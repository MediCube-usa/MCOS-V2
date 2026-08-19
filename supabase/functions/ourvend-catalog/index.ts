// MCOS ↔ OurVend product catalog import — images + descriptions.
//
// Reads OurVend's Commodity Management grid (/CommodityInfo/ListJson) with the
// stored session cookie and imports every product's image + description into the
// MCOS `products` table. OurVend is the source of truth for the catalog.
//
// Self-healing: if the read comes back blocked/empty (session or WAF expired), it
// calls the ourvend-login function to renew the stored cookie and retries once —
// so a scheduled catalog sync keeps working with no cookie pasted by hand.
//
// Image host: OurVend's public Alibaba OSS bucket (Regular/ prefix).
//
// Modes (query string): (default) dry run; ?commit=1 upsert; ?raw not needed now.
// READ-ONLY against OurVend. Writes only to our own DB.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OURVEND = "https://os.ourvend.com";
const OSS = "https://ourvend-image.oss-cn-qingdao.aliyuncs.com/Regular/";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const LOGIN_FN = `${SUPABASE_URL}/functions/v1/ourvend-login`;
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lZ3RlcHZtYmt5ZWZ2eGlha3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5OTAyMDYsImV4cCI6MjEwMTU2NjIwNn0.lxxt_mJfYCLCyc3v_h_2qHqZuBnt2GTZ28HfuIhhRIM";
const sb = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

async function getCookie(): Promise<string> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/secrets?key=eq.ourvend_cookie&select=value`, { headers: sb });
  const rows = await r.json();
  return rows?.[0]?.value ?? "";
}

// Self-heal: trigger a fresh login (renews the stored cookie) and return the new one.
async function relogin(): Promise<string> {
  await fetch(LOGIN_FN, { method: "POST", headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "content-type": "application/json" }, body: "{}" }).catch(() => {});
  return await getCookie();
}

// One ListJson read for a given cookie. Empty list = blocked/expired session.
async function readList(cookie: string, warehouse: string, prtype: string, rows: string): Promise<Record<string, unknown>[]> {
  await fetch(`${OURVEND}/CommodityInfo/Index`, { headers: { cookie, "user-agent": UA }, redirect: "manual" }).catch(() => {});
  const resp = await fetch(`${OURVEND}/CommodityInfo/ListJson`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8", "x-requested-with": "XMLHttpRequest",
      accept: "application/json, text/javascript, */*; q=0.01", origin: OURVEND,
      referer: `${OURVEND}/CommodityInfo/Index`, cookie, "user-agent": UA,
    },
    body: new URLSearchParams({ PrCode: "", PrName: "", Type: warehouse, PrType: prtype, _search: "false", nd: String(Date.now()), rows, page: "1", sidx: "PrTopping", sord: "desc" }).toString(),
    redirect: "manual",
  });
  const text = await resp.text();
  let data: unknown;
  try { data = JSON.parse(text); } catch { return []; }
  const d = data as Record<string, unknown>;
  return (Array.isArray(data) ? data : (d.rows || d.data || d.list || d.Data || [])) as Record<string, unknown>[];
}

function imageUrl(raw: string): string {
  if (!raw) return "";
  const v = raw.trim();
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return OSS + v.replace(/^\/+/, "");
}

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
  const rows = url.searchParams.get("rows") || "2000";
  const warehouse = url.searchParams.get("warehouse") || "0"; // 0 = Local, 1 = Cloud
  const prtype = url.searchParams.get("prtype") || "0";        // 0 = All types

  // Optional fresh cookie in the body; otherwise use the stored one.
  let bodyCookie = "";
  try { const b = await req.json(); bodyCookie = (b?.cookie as string) || ""; } catch { /* no body */ }
  let cookie = bodyCookie || await getCookie();
  if (!cookie) return Response.json({ ok: false, error: "no OurVend cookie stored" });

  // Read; if blocked/empty and we're on the stored cookie, self-heal via login and retry once.
  let list = await readList(cookie, warehouse, prtype, rows);
  let reloggedIn = false;
  if (list.length === 0 && !bodyCookie) {
    cookie = await relogin();
    reloggedIn = true;
    list = await readList(cookie, warehouse, prtype, rows);
  }

  if (!commit) {
    return Response.json({ ok: true, count: list.length, reloggedIn, firstKeys: list[0] ? Object.keys(list[0]) : [], sample: list.slice(0, 3) });
  }

  const products = list.map((row) => {
    const barcode = pick(row, ["PrID"]); // matches existing rows → merge, not duplicate
    const name = pick(row, ["PrName"]);
    return {
      barcode: barcode || `OV-${name}`.slice(0, 60),
      name,
      image_url: imageUrl(pick(row, ["PrImgUrl"])) || null,
      description: pick(row, ["PrSpecification"]) || null,
      default_price: pick(row, ["PrRetailPrice"]) || null,
      cost: pick(row, ["PrCostPrice"]) || null,
      supplier: pick(row, ["CiManufacturer"]) || null,
    };
  }).filter((p) => p.name);

  let imported = 0;
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
  return Response.json({
    ok: true, imported, reloggedIn,
    withImg: products.filter((p) => p.image_url).length,
    withDesc: products.filter((p) => p.description).length,
    total: list.length,
  });
});
