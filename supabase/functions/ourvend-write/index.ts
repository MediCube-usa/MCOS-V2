// MCOS → OurVend WRITE path (private API, through the pages) — the push side.
// Rides the SAME authenticated session as the readers (secrets.ourvend_cookie),
// self-heals via ourvend-login on session expiry. Recipes: docs/blocks/ourvend-write.md.
//
// THREE THINGS OURVEND INSISTS ON, all learned the hard way:
//  1. PRODUCT IDENTITY — our `products.barcode` column stores OurVend's internal
//     PrID GUID; OurVend's own scannable code is PrCode. Callers may pass either,
//     so every lookup matches PrID OR PrCode.
//  2. PAGE WARM-UP — grid and save endpoints 302 to default404 unless the CURRENT
//     session has just GET-ed the owning page. So the warm-up must happen AFTER any
//     relogin, never before it, or the fresh cookie posts cold and gets bounced.
//  3. REFERENCE IDS, NOT NAMES — the add/edit form posts Manufacturers=<MiID guid>
//     and CiType=<CtID int>, never the display names. GetManufacturer returns
//     {MiID,MiName}; GetCitype returns {CtID,CtName}. Resolving those by name is
//     what makes addProduct work at all (2026-08-22 HAR).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { encodeBase64 } from "jsr:@std/encoding/base64";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OURVEND = "https://os.ourvend.com";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const LOGIN_FN = `${SUPABASE_URL}/functions/v1/ourvend-login`;
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lZ3RlcHZtYmt5ZWZ2eGlha3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5OTAyMDYsImV4cCI6MjEwMTU2NjIwNn0.lxxt_mJfYCLCyc3v_h_2qHqZuBnt2GTZ28HfuIhhRIM";
const sb = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

async function getCookie(): Promise<string> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/secrets?key=eq.ourvend_cookie&select=value`, { headers: sb });
  const rows = await r.json();
  return rows?.[0]?.value ?? "";
}
async function relogin(): Promise<string> {
  await fetch(LOGIN_FN, { method: "POST", headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "content-type": "application/json" }, body: "{}" }).catch(() => {});
  return await getCookie();
}
function ovHeaders(cookie: string, referer: string) {
  return {
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    "x-requested-with": "XMLHttpRequest",
    accept: "application/json, text/javascript, */*; q=0.01",
    origin: OURVEND, referer, cookie, "user-agent": UA,
  };
}
async function visit(cookie: string, path: string) {
  await fetch(`${OURVEND}${path}`, { headers: { cookie, "user-agent": UA }, redirect: "manual" }).catch(() => {});
}
async function sessionOk(cookie: string, area: string): Promise<boolean> {
  const r = await fetch(`${OURVEND}/${area}/getSession`, { method: "POST", headers: ovHeaders(cookie, `${OURVEND}/${area}/Index`), body: "", redirect: "manual" });
  const t = await r.text().catch(() => "");
  return r.status === 200 && t.trim() === "True";
}
async function post(path: string, cookie: string, referer: string, body: string) {
  const r = await fetch(`${OURVEND}${path}`, { method: "POST", headers: ovHeaders(cookie, referer), body, redirect: "manual" });
  return { status: r.status, text: await r.text().catch(() => "") };
}
const okText = (t: string) => /^\s*(ok|true|1)\s*$/i.test(t) || /\"?(success|state)\"?\s*[:=]\s*\"?(true|1|ok)/i.test(t);
const same = (a: unknown, b: string) => String(a ?? "").trim().toLowerCase() === b.trim().toLowerCase();

// OurVend answers the catalog saves with a bare word. The page turns each into a
// different message, and the difference matters operationally: "OK" means the
// product is NOT usable yet — the platform audits it first, 1-2 working days.
function readSaveReply(t: string): { ok: boolean; state: string; meaning: string } {
  const v = t.trim();
  if (/^true$/i.test(v)) return { ok: true, state: "live", meaning: "Saved and live immediately." };
  if (/^ok$/i.test(v)) return { ok: true, state: "pending-audit", meaning: "Saved, but OurVend queues it for platform audit — generally 1-2 working days before a machine can use it." };
  if (/^rest$/i.test(v) || /^exist$/i.test(v)) return { ok: false, state: "duplicate-code", meaning: "Duplicate commodity code — that product code already exists." };
  if (/^format$/i.test(v)) return { ok: false, state: "bad-image", meaning: "Image rejected: NFC goods need jpg/png under 15kb." };
  return { ok: false, state: "failed", meaning: `OurVend refused the save (returned "${v.slice(0, 80)}").` };
}

// Turn a picture ANYWHERE on the web into what OurVend's form produces: a 500x500
// PNG data URI. This is what lets Atlas source its own product images instead of
// waiting for someone to crop and paste one.
async function imageFromUrl(url: string): Promise<{ dataUri?: string; error?: string; note?: string }> {
  let res: Response;
  try {
    res = await fetch(url, { headers: { "user-agent": UA, accept: "image/*,*/*" }, redirect: "follow" });
  } catch (e) { return { error: `could not reach the image url (${String(e).slice(0, 120)})` }; }
  if (!res.ok) return { error: `image url returned ${res.status}` };
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.length === 0) return { error: "image url returned no bytes" };
  if (buf.length > 8 * 1024 * 1024) return { error: "image is over 8MB — pick a smaller one" };
  // Match the portal's cropper: a 500x500 square. contain() keeps the whole product
  // visible rather than cropping into it.
  try {
    const mod = await import("npm:imagescript@1.3.0");
    const decoded = await (mod as { decode: (b: Uint8Array) => Promise<unknown> }).decode(buf) as {
      contain?: (w: number, h: number) => unknown; resize?: (w: number, h: number) => unknown;
    };
    const sq = (decoded.contain ? decoded.contain(500, 500) : decoded.resize!(500, 500)) as { encode: () => Promise<Uint8Array> };
    const png = await sq.encode();
    return { dataUri: `data:image/png;base64,${encodeBase64(png)}`, note: "fetched and squared to 500x500 png" };
  } catch {
    // Resize unavailable — pass the original through if OurVend will take the type.
    const type = ct.includes("png") ? "image/png" : (ct.includes("jpeg") || ct.includes("jpg")) ? "image/jpeg" : "";
    if (!type) return { error: `that url is "${ct || "an unknown type"}", not a png or jpeg image` };
    return { dataUri: `data:${type};base64,${encodeBase64(buf)}`, note: "sent at original size (could not resize)" };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return Response.json({ ok: false, error: "POST only" });
  let input: Record<string, unknown> = {};
  try { input = await req.json(); } catch { return Response.json({ ok: false, error: "bad json" }); }
  const action = String(input.action || "");
  const report: Record<string, unknown> = { action, ranAt: new Date().toISOString() };

  let cookie = await getCookie();
  if (!cookie) return Response.json({ ok: false, error: "no OurVend cookie stored" });
  const CI = `${OURVEND}/CommodityInfo/Index`;
  const SEL = `${OURVEND}/Selection/Index`;

  // Establish session, THEN warm the owning page, THEN act. Retry once on a bounce.
  async function act(area: string, warmPath: string, run: (c: string) => Promise<{ status: number; text: string }>) {
    if (!(await sessionOk(cookie, area))) { cookie = await relogin(); report.relogged = true; }
    await visit(cookie, warmPath);
    let res = await run(cookie);
    if (res.status >= 300 && res.status < 400) {
      cookie = await relogin(); report.retried = true;
      await visit(cookie, warmPath);
      res = await run(cookie);
    }
    return res;
  }

  async function readList(c: string): Promise<Record<string, unknown>[]> {
    await visit(c, "/CommodityInfo/Index");
    const body = new URLSearchParams({
      PrCode: "", PrName: "", Type: "0", PrType: "0", _search: "false",
      nd: String(Date.now()), rows: "2000", page: "1", sidx: "PrTopping", sord: "desc",
    }).toString();
    const r = await post("/CommodityInfo/ListJson", c, CI, body);
    try {
      const d = JSON.parse(r.text) as Record<string, unknown>;
      return (Array.isArray(d) ? d : (d.rows || d.data || d.list || d.Data || [])) as Record<string, unknown>[];
    } catch { return []; }
  }
  async function listProducts(): Promise<Record<string, unknown>[]> {
    let list = await readList(cookie);
    if (list.length === 0) { cookie = await relogin(); report.relogged = true; list = await readList(cookie); }
    return list;
  }
  function findProduct(list: Record<string, unknown>[], ident: string) {
    return list.find((p) => same(p.PrID, ident)) || list.find((p) => same(p.PrCode, ident)) || null;
  }
  async function getProduct(prId: string): Promise<Record<string, string> | null> {
    const r = await post("/CommodityInfo/GetProductData", cookie, CI, new URLSearchParams({ PrID: prId }).toString());
    try { const d = JSON.parse(r.text); const row = Array.isArray(d) ? d[0] : d; return row || null; } catch { return null; }
  }

  // --- reference data: the ID lists the add/edit form posts ---------------------
  async function refList(path: string): Promise<Record<string, unknown>[]> {
    const r = await post(path, cookie, CI, "");
    try {
      const d = JSON.parse(r.text);
      return (Array.isArray(d) ? d : (d.rows || d.data || d.list || [])) as Record<string, unknown>[];
    } catch { return []; }
  }
  // Match by name (exact, then contains, either direction), else fall back to the
  // first entry so a caller who gave nothing still gets a valid id.
  function resolveRef(rows: Record<string, unknown>[], idKey: string, nameKey: string, wanted: string): string {
    if (!rows.length) return "";
    const w = wanted.trim().toLowerCase();
    if (w) {
      const exactId = rows.find((r) => same(r[idKey], wanted));
      if (exactId) return String(exactId[idKey]);
      const exact = rows.find((r) => same(r[nameKey], wanted));
      if (exact) return String(exact[idKey]);
      const loose = rows.find((r) => {
        const n = String(r[nameKey] ?? "").trim().toLowerCase();
        return n.length > 0 && (n.includes(w) || w.includes(n));
      });
      if (loose) return String(loose[idKey]);
    }
    return String(rows[0][idKey] ?? "");
  }

  // ---- listRefData : read-only, what suppliers and types OurVend will accept ----
  if (action === "listRefData") {
    if (!(await sessionOk(cookie, "CommodityInfo"))) { cookie = await relogin(); report.relogged = true; }
    await visit(cookie, "/CommodityInfo/Index");
    const [manus, types] = await Promise.all([refList("/CommodityInfo/GetManufacturer"), refList("/CommodityInfo/GetCitype")]);
    report.suppliers = manus.map((m) => ({ id: m.MiID, name: m.MiName }));
    report.types = types.map((t) => ({ id: t.CtID, name: t.CtName, description: t.CtDescription }));
    report.ok = manus.length > 0 || types.length > 0;
    return Response.json(report);
  }

  // ---- probeProduct {ident} : read-only id check ----
  if (action === "probeProduct") {
    const ident = String(input.ident || input.code || "").trim();
    const list = await listProducts();
    const row = ident ? findProduct(list, ident) : null;
    report.catalogRows = list.length;
    report.sample = list.slice(0, 3).map((p) => ({ PrID: p.PrID, PrCode: p.PrCode, PrName: p.PrName }));
    report.match = row ? { PrID: row.PrID, PrCode: row.PrCode, PrName: row.PrName } : null;
    report.ok = list.length > 0 && (!ident || !!row);
    return Response.json(report);
  }

  // --- Selection helpers, matched to what the portal's own dialog does ----------
  // SoltInfo answers a NESTED array: [[], [ ...slot rows ]]. Flattening one level
  // is what turns it back into rows (2026-08-22 HAR).
  function slotRows(text: string): Record<string, unknown>[] {
    try {
      const d = JSON.parse(text);
      if (Array.isArray(d)) {
        const flat: Record<string, unknown>[] = [];
        for (const part of d) {
          if (Array.isArray(part)) flat.push(...(part as Record<string, unknown>[]));
          else if (part && typeof part === "object") flat.push(part as Record<string, unknown>);
        }
        return flat;
      }
      const o = d as Record<string, unknown>;
      return (o.rows || o.data || o.list || o.Data || []) as Record<string, unknown>[];
    } catch { return []; }
  }
  const readAllSlots = (c: string, machineId: string) =>
    post("/Selection/SoltInfo", c, SEL, new URLSearchParams({ MachineID: machineId, boxId: "" }).toString());
  // The single-coil read the Edit dialog performs on open. Doubles as the per-coil
  // warm-up that /Selection/Edit needs before it will accept a save.
  async function readOneSlot(c: string, machineId: string, coil: string): Promise<Record<string, string> | null> {
    const r = await post("/Selection/GetSoltInfo", c, SEL, new URLSearchParams({ MachineID: machineId, HuoDao: coil }).toString());
    try { const d = JSON.parse(r.text); const row = Array.isArray(d) ? d[0] : d; return (row || null) as Record<string, string> | null; } catch { return null; }
  }
  const plainPost = (c: string, path: string, params: Record<string, string>) =>
    post(path, c, SEL, new URLSearchParams(params).toString());
  // OurVend binds these server-side as integers. An empty string fails model binding
  // and the request bounces to default404 — that was the whole two-day "404".
  const intOr = (v: unknown, dflt: string) => {
    const s = String(v ?? "").trim();
    if (s === "") return dflt;
    if (/^true$/i.test(s)) return "1";
    if (/^false$/i.test(s)) return "0";
    return s;
  };

  // ---- readSlots {machineId} : read-only, what OurVend holds ----
  if (action === "readSlots") {
    const machineId = String(input.machineId || "").trim();
    if (!machineId) return Response.json({ ok: false, error: "machineId required" });
    const r = await act("Selection", "/Selection/Index", (c) => readAllSlots(c, machineId));
    report.status = r.status;
    const rows = slotRows(r.text);
    report.count = rows.length;
    report.keys = rows[0] ? Object.keys(rows[0]) : [];
    report.slots = rows.slice(0, 60);
    report.ok = rows.length > 0;
    if (!report.ok) report.response = r.text.slice(0, 400);
    return Response.json(report);
  }

  // ---- readSlot {machineId, coil} : one coil, exactly as the dialog loads it ----
  if (action === "readSlot") {
    const machineId = String(input.machineId || "").trim();
    const coil = String(input.coil || "").trim();
    if (!machineId || !coil) return Response.json({ ok: false, error: "machineId and coil required" });
    if (!(await sessionOk(cookie, "Selection"))) { cookie = await relogin(); report.relogged = true; }
    await visit(cookie, "/Selection/Index");
    await readAllSlots(cookie, machineId);
    const row = await readOneSlot(cookie, machineId, coil);
    report.ok = !!row;
    report.slot = row;
    if (row?.SiBarCode) {
      const pr = await plainPost(cookie, "/Selection/GetProductUrl", { PrID: String(row.SiBarCode) });
      try { report.product = JSON.parse(pr.text)?.[0] ?? null; } catch { /* name is a nicety */ }
    }
    return Response.json(report);
  }

  // ---- deleteProduct {prId} ----
  if (action === "deleteProduct") {
    const prId = String(input.prId || "").trim();
    if (!prId) return Response.json({ ok: false, error: "prId required" });
    const res = await act("CommodityInfo", "/CommodityInfo/Index", (c) => post("/CommodityInfo/Delete", c, CI, new URLSearchParams({ PrIDs: prId }).toString()));
    report.status = res.status; report.response = res.text.slice(0, 200);
    report.ok = res.status === 200 && okText(res.text);
    return Response.json(report);
  }

  // ---- editProductByCode {code, set:{...}} : code may be PrID or PrCode ----
  if (action === "editProductByCode") {
    const code = String(input.code || "").trim();
    const set = (input.set || {}) as Record<string, string>;
    if (!code) return Response.json({ ok: false, error: "code required" });
    const list = await listProducts();
    const row = findProduct(list, code);
    if (!row) { report.ok = false; report.error = `no product matching "${code}" (tried PrID and PrCode; catalog rows: ${list.length})`; return Response.json(report); }
    const prId = String(row.PrID);
    report.resolved = { prId, prCode: row.PrCode, prName: row.PrName };
    const cur = await getProduct(prId);
    if (!cur) { report.ok = false; report.error = "could not load current product data"; return Response.json(report); }
    const fields: Record<string, string> = {
      PrAdultLimit: "false", PrAliAdultLimit: "false", PrID: prId,
      ProductCode: cur.PrCode ?? String(row.PrCode ?? ""),
      ProductName: set.name ?? cur.PrName ?? "",
      PrSpecification: set.size ?? cur.PrSpecification ?? "",
      PrRetailPrice: set.price ?? cur.PrRetailPrice ?? "",
      Manufacturers: cur.Manufacturers ?? "", CiType: cur.CiType ?? "",
      PrCostPrice: set.cost ?? cur.PrCostPrice ?? "",
      QualityPeriod: cur.QualityPeriod ?? "",
      ImgPath: cur.PrImgUrl ?? String(row.PrImgUrl ?? ""),
      PrContent: set.description ?? cur.PrContent ?? "",
    };
    report.before = { price: cur.PrRetailPrice, name: cur.PrName, size: cur.PrSpecification, description: cur.PrContent };
    const res = await act("CommodityInfo", "/CommodityInfo/Index", (c) => post("/CommodityInfo/EditCI", c, CI, new URLSearchParams(fields).toString()));
    const verdict = readSaveReply(res.text);
    report.status = res.status; report.response = res.text.slice(0, 200);
    report.state = verdict.state; report.meaning = verdict.meaning;
    report.ok = res.status === 200 && verdict.ok;
    report.product = { code, name: fields.ProductName, prId };
    report.after = { price: fields.PrRetailPrice, name: fields.ProductName, size: fields.PrSpecification, description: fields.PrContent };
    return Response.json(report);
  }

  // ---- addProduct : the catalog gate. One missing product fails a whole planogram.
  // OurVend refuses this outright without an image, and it wants the supplier/type
  // as IDs. Both are handled here so a caller only has to know names.
  if (action === "addProduct") {
    const p = (input.product || {}) as Record<string, string>;
    const code = String(p.code || "").trim();
    const name = String(p.name || "").trim();
    if (!code || !name) return Response.json({ ok: false, error: "product.code and product.name required" });

    // The page's own validation, applied before we spend a round trip.
    if (!/^[a-zA-Z0-9]+$/.test(code)) return Response.json({ ok: false, error: `product code "${code}" must be letters and digits only` });
    if (name.length > 50) return Response.json({ ok: false, error: `product name is ${name.length} characters; OurVend caps it at 50` });
    if (/[@#$%\\]/.test(name)) return Response.json({ ok: false, error: "product name cannot contain @ # $ % or backslash" });

    // An image is mandatory, but the caller can hand us a URL and we do the rest —
    // fetch it, square it to 500x500, base64 it. Atlas can therefore find its own
    // product pictures instead of being fed data URIs.
    let img = String(input.imageDataUri || p.imageDataUri || "").trim();
    const imgUrl = String(input.imageUrl || p.imageUrl || "").trim();
    if (!img && imgUrl) {
      const fetched = await imageFromUrl(imgUrl);
      if (fetched.error) return Response.json({ ok: false, error: `image: ${fetched.error}`, imageUrl: imgUrl });
      img = fetched.dataUri!;
      report.image = { from: imgUrl, note: fetched.note };
    }
    if (!img) return Response.json({ ok: false, error: "an image is required — OurVend rejects a product with no image (its own check: \"Please choose a commodity image\"). Pass imageUrl (any png/jpeg on the web) or imageDataUri." });
    if (!/^data:image\/(png|jpe?g);base64,/i.test(img)) return Response.json({ ok: false, error: "imageDataUri must be a data URI like data:image/png;base64,… (the portal sends a 500x500 canvas export)" });

    if (!(await sessionOk(cookie, "CommodityInfo"))) { cookie = await relogin(); report.relogged = true; }
    await visit(cookie, "/CommodityInfo/Index");

    // Names in, IDs out. This is what was silently failing before.
    const [manus, types] = await Promise.all([refList("/CommodityInfo/GetManufacturer"), refList("/CommodityInfo/GetCitype")]);
    const manu = resolveRef(manus, "MiID", "MiName", String(p.manufacturer || p.supplier || ""));
    const citype = resolveRef(types, "CtID", "CtName", String(p.ciType || p.type || p.category || ""));
    if (!manu || !citype) {
      report.ok = false;
      report.error = "could not resolve a supplier or type id from OurVend";
      report.suppliers = manus.map((m) => m.MiName);
      report.types = types.map((t) => t.CtName);
      return Response.json(report);
    }
    report.resolved = {
      supplier: { id: manu, name: manus.find((m) => same(m.MiID, manu))?.MiName ?? null },
      type: { id: citype, name: types.find((t) => same(t.CtID, citype))?.CtName ?? null },
    };

    // The portal screens every image before the save; a rejected image blocks AddCI.
    const audit = await post("/WxMallProduct/AuditImge", cookie, CI, new URLSearchParams({ image: img }).toString());
    report.imageAudit = audit.text.slice(0, 120);
    if (!/^\s*ok\s*$/i.test(audit.text)) {
      report.ok = false;
      report.error = `OurVend's image screen rejected the picture (returned "${audit.text.trim().slice(0, 60)}"). Try a different single-product photo.`;
      return Response.json(report);
    }

    const fields: Record<string, string> = {
      ProductCode: code, ProductName: name,
      PrSpecification: String(p.size || ""), PrContent: String(p.description || ""),
      PrRetailPrice: String(p.price || "0"), PrCostPrice: String(p.cost || "0"),
      // AddCI posts four more price fields than EditCI does; leaving them off was
      // half of why this action failed.
      PrPromotionPrice: String(p.promotionPrice || "0"), PrMemberPrice: String(p.memberPrice || "0"),
      PrDiscount: String(p.discount || "100"), PrTaxRate: String(p.taxRate || "0"),
      Manufacturers: manu, CiType: citype,
      QualityPeriod: String(p.qualityPeriod || ""),
      PrAdultLimit: "false", PrAliAdultLimit: "false", ImgPath: img,
    };
    const res = await act("CommodityInfo", "/CommodityInfo/Index", (c) => post("/CommodityInfo/AddCI", c, CI, new URLSearchParams(fields).toString()));
    const verdict = readSaveReply(res.text);
    report.status = res.status; report.response = res.text.slice(0, 200);
    report.state = verdict.state; report.meaning = verdict.meaning;
    report.ok = res.status === 200 && verdict.ok;
    report.product = { code, name, size: fields.PrSpecification, price: fields.PrRetailPrice };
    return Response.json(report);
  }

  // ---- editSlot : one coil = product placement + price + inventory ----------------
  // These are LIVE machines: an OurVend coil write goes down into the machine and on
  // to the card readers. So this reads the coil first and changes ONLY what the
  // caller named — every other value is written back verbatim, exactly as the
  // portal's own dialog behaves — then reads it back and compares.
  // Pass dryRun:true to get the payload without saving.
  if (action === "editSlot") {
    const machineId = String(input.machineId || "").trim();
    const coil = String(input.coil || "").trim();
    if (!machineId || !coil) return Response.json({ ok: false, error: "machineId and coil required" });

    let prId = String(input.productPrId || "").trim();
    const ident = String(input.productCode || "").trim();
    if (!prId && ident) {
      const list = await listProducts();
      const row = findProduct(list, ident);
      if (!row) { report.ok = false; report.error = `no product matching "${ident}" (tried PrID and PrCode; catalog rows: ${list.length})`; return Response.json(report); }
      prId = String(row.PrID);
      report.resolved = { prId, prCode: row.PrCode, prName: row.PrName };
    }

    if (!(await sessionOk(cookie, "Selection"))) { cookie = await relogin(); report.relogged = true; }
    await visit(cookie, "/Selection/Index");
    await readAllSlots(cookie, machineId);

    // Dialog-open sequence. GetSoltInfo is both the current state and the per-coil
    // warm-up; warmTime / SelectWarm come from the two heater lookups beside it.
    const before = await readOneSlot(cookie, machineId, coil);
    if (!before) {
      report.ok = false;
      report.error = `could not read coil ${coil} on machine ${machineId} — check the machine id and that the coil exists`;
      return Response.json(report);
    }
    const [hot, warm] = await Promise.all([
      plainPost(cookie, "/Selection/GetHatintTime", { Mid: machineId, Cid: coil }),
      plainPost(cookie, "/Selection/GetselectWarm", { Mid: machineId, Cid: coil }),
    ]);
    await plainPost(cookie, "/Selection/Warm", { Mid: machineId });
    report.before = before;

    // Overlay: anything the caller did not name keeps the machine's current value.
    const keep = (given: unknown, current: unknown) => (given === undefined || given === null || String(given) === "" ? String(current ?? "") : String(given));
    const fields: Record<string, string> = {
      MachineID: machineId,
      SiCoilId: coil,
      SiBarCode: prId || String(before.SiBarCode ?? ""),
      SiPrice: keep(input.cloudPrice ?? input.price, before.SiPrice),
      SiCustomPrice: keep(input.machinePrice ?? input.price, before.SiCustomPrice),
      SiCapacity: keep(input.capacity, before.SiCapacity),
      SiExtantQuantity: keep(input.stock, before.SiExtantQuantity),
      WxDiscount: intOr(before.WxDiscount, "100"),
      AliDiscount: intOr(before.AliDiscount, "100"),
      IDcardDiscount: intOr(before.IDcardDiscount, "100"),
      WarningQuantity: keep(input.warningQuantity, before.WarningQuantity),
      warmTime: intOr(hot.text, "0"),
      SelectWarm: intOr(warm.text, "0"),
      Ext: String(before.Ext ?? ""),
      EnableHot: intOr(before.EnableHot, "0"),
      EnablePunch: intOr(before.EnablePunch, "0"),
      EnableCustomize: intOr(before.EnableCustomize, "0"),
      CustomizeJson: String(before.CustomizeSetJson ?? ""),
      HotTime: String(before.HotTime ?? ""),
    };
    report.payload = fields;

    if (input.dryRun) {
      report.ok = true; report.dryRun = true;
      report.note = "nothing was written — this is the exact payload editSlot would post";
      return Response.json(report);
    }

    const res = await post("/Selection/Edit", cookie, SEL, new URLSearchParams(fields).toString());
    report.status = res.status; report.response = res.text.slice(0, 300);
    report.ok = res.status === 200 && okText(res.text);
    if (!report.ok && res.status >= 300 && res.status < 400) {
      report.error = "/Selection/Edit bounced to default404 — a field failed server-side model binding. Every numeric field must carry a number, never an empty string.";
      return Response.json(report);
    }

    // Read back and compare. This is the stop-on-first-mismatch rule for live pushes.
    const after = await readOneSlot(cookie, machineId, coil);
    report.after = after;
    const checks: Record<string, { wrote: string; read: string; match: boolean }> = {};
    for (const k of ["SiBarCode", "SiPrice", "SiCustomPrice", "SiCapacity", "SiExtantQuantity"]) {
      const wrote = fields[k] ?? "";
      const read = String((after as Record<string, unknown> | null)?.[k] ?? "");
      checks[k] = { wrote, read, match: wrote.trim().toLowerCase() === read.trim().toLowerCase() };
    }
    report.verify = checks;
    report.verified = Object.values(checks).every((c) => c.match);
    if (report.ok && !report.verified) {
      report.error = "OurVend accepted the save but the read-back does not match — stop here, do not continue to the next coil.";
    }
    report.slot = { machineId, coil, prId: fields.SiBarCode };
    return Response.json(report);
  }

  // ---- cloneMachine : apply a planogram by copying a whole machine ----
  if (action === "cloneMachine") {
    const source = String(input.sourceMachineId || "").trim();
    const target = String(input.targetMachineId || "").trim();
    if (!source || !target) return Response.json({ ok: false, error: "sourceMachineId and targetMachineId required" });
    const fields: Record<string, string> = {
      Machine: source, CMachieID: target, CloneGoods: "0",
      CStratGoods: String(input.startCoil ?? "1"), CEndGoods: String(input.endCoil ?? ""),
    };
    const res = await act("Selection", "/Selection/Index", (c) => post("/Selection/ClMachine", c, SEL, new URLSearchParams(fields).toString()));
    report.status = res.status; report.response = res.text.slice(0, 300);
    report.ok = res.status === 200 && okText(res.text);
    report.clone = { source, target };
    return Response.json(report);
  }

  return Response.json({ ok: false, error: `unknown action ${action}` });
});
