// MCOS ↔ OurVend product catalog import — images + descriptions.
//
// Reads OurVend's Commodity Management grid (/CommodityInfo/ListJson) with the
// stored session cookie and imports every product's image + description into the
// MCOS `products` table. OurVend is the source of truth for the catalog.
//
// Image host: OurVend's public Alibaba OSS bucket. Full image URL = OSS base +
// the product's stored image path.
//
// Modes (query string):
//   (default)   dry run — returns count, field names, and 3 sample rows. No writes.
//   ?commit=1   upsert into products (image_url, description, name, default_price, barcode).
//   ?raw=1      returns the first 1200 chars of OurVend's raw response (shape debugging).
//
// READ-ONLY against OurVend (only reads the grid). Writes only to our own DB.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OURVEND = "https://os.ourvend.com";
const OSS = "https://ourvend-image.oss-cn-qingdao.aliyuncs.com/";
const sb = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

async function getCookie(): Promise<string> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/secrets?key=eq.ourvend_cookie&select=value`, { headers: sb });
  const rows = await r.json();
  return rows?.[0]?.value ?? "";
}

// Build the full public image URL from whatever OurVend stored. Handles absolute
// URLs, OSS-relative keys, and a leading slash.
function imageUrl(raw: string): string {
  if (!raw) return "";
  const v = raw.trim();
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return OSS + v.replace(/^\/+/, "");
}

// Pull a field by trying several likely key names (OurVend keys vary by module).
function pick(row: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const commit = url.searchParams.get("commit") === "1";
  const raw = url.searchParams.get("raw") === "1";
  const rows = url.searchParams.get("rows") || "2000";
  const warehouse = url.searchParams.get("warehouse") || "0"; // 0 = Local, 1 = Cloud
  const prtype = url.searchParams.get("prtype") || "0";        // 0 = All types

  const cookie = await getCookie();
  if (!cookie) return Response.json({ ok: false, error: "no OurVend cookie stored" });

  // Prime the Commodity module: entering the page sets the server-side session
  // context the grid query depends on (without this, ListJson returns an empty 200).
  await fetch(`${OURVEND}/CommodityInfo/Index`, {
    headers: { cookie, "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36" },
    redirect: "manual",
  }).catch(() => {});

  const resp = await fetch(`${OURVEND}/CommodityInfo/ListJson`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "x-requested-with": "XMLHttpRequest",
      accept: "application/json, text/javascript, */*; q=0.01",
      origin: OURVEND,
      referer: `${OURVEND}/CommodityInfo/Index`,
      cookie,
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    },
    // The Commodity grid (jqGrid) posts these filter fields (empty = all) plus paging.
    body: new URLSearchParams({
      PrCode: "", PrName: "", Type: warehouse, PrType: prtype,
      _search: "false", nd: String(Date.now()), rows, page: "1", sidx: "", sord: "asc",
    }).toString(),
    redirect: "manual",
  });

  const text = await resp.text();
  if (raw) return Response.json({ ok: true, status: resp.status, len: text.length, head: text.slice(0, 1200) });

  let data: unknown;
  try { data = JSON.parse(text); }
  catch { return Response.json({ ok: false, status: resp.status, error: "non-JSON (session expired or WAF)", head: text.slice(0, 300) }); }

  const d = data as Record<string, unknown>;
  const list = (Array.isArray(data) ? data : (d.rows || d.data || d.list || d.Data || d.rowsList || [])) as Record<string, unknown>[];
  const firstKeys = list[0] ? Object.keys(list[0]) : [];

  // Commodity grid column order (from the page's colModel), used when a row is a
  // jqGrid { id, cell:[...] } instead of a named object.
  const COLS = ["PrID", "PrCode", "PrName", "PrImgUrl", "PrRetailPrice", "PrCostPrice", "CiManufacturer", "PrSpecification"];
  const asObj = (row: Record<string, unknown>): Record<string, unknown> => {
    const cell = (row as { cell?: unknown[] }).cell;
    if (Array.isArray(cell)) { const o: Record<string, unknown> = {}; COLS.forEach((k, i) => (o[k] = cell[i])); return o; }
    return row;
  };

  if (!commit) {
    return Response.json({ ok: true, status: resp.status, total: (d.records ?? d.total ?? list.length), count: list.length, firstKeys, sample: list.slice(0, 3).map(asObj) });
  }

  // Map + upsert. OurVend field names confirmed from the page's colModel.
  const products = list.map((r) => {
    const row = asObj(r);
    const barcode = pick(row, ["PrCode"]);
    const name = pick(row, ["PrName"]);
    const img = pick(row, ["PrImgUrl"]);
    const spec = pick(row, ["PrSpecification"]);
    const price = pick(row, ["PrRetailPrice"]);
    const cost = pick(row, ["PrCostPrice"]);
    const supplier = pick(row, ["CiManufacturer"]);
    return {
      barcode: barcode || `OV-${name}`.slice(0, 60),
      name,
      image_url: imageUrl(img) || null,
      description: spec || null,
      default_price: price || null,
      cost: cost || null,
      supplier: supplier || null,
    };
  }).filter((p) => p.name);

  // Upsert on barcode. Only OurVend-owned fields; MCOS-only fields untouched.
  let imported = 0, withImg = 0, withDesc = 0;
  for (let i = 0; i < products.length; i += 100) {
    const batch = products.slice(i, i + 100);
    const r = await fetch(`${SUPABASE_URL}/rest/v1/products?on_conflict=barcode`, {
      method: "POST",
      headers: { ...sb, "content-type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(batch),
    });
    if (!r.ok) return Response.json({ ok: false, error: `upsert ${r.status} ${await r.text()}`, imported });
    imported += batch.length;
  }
  withImg = products.filter((p) => p.image_url).length;
  withDesc = products.filter((p) => p.description).length;

  return Response.json({ ok: true, imported, withImg, withDesc, total: list.length });
});
