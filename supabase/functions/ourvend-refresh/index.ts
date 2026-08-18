// MCOS ↔ OurVend fleet sync — permanent, cloud-side, no browser.
//
// This is the automated reader that keeps `live_slots` current. It runs inside
// Supabase (Edge Function), which:
//   1. auto-receives the service-role key, so it can read the OurVend session
//      cookie from the RLS-locked `secrets` table (never exposed to the browser);
//   2. can reach os.ourvend.com from the cloud (proven — the bot-wall does not
//      block a server origin the way it would a sandbox);
//   3. is invoked on a schedule by pg_cron every ~20 min (job: ourvend-fleet-sync)
//      AND on demand by the "Refresh from OurVend" button in the dashboard.
//
// READ-ONLY against OurVend: it only POSTs /Selection/SoltInfo (read). It never
// calls /Selection/Edit. The only writes are into our own Supabase tables.
//
// Deployed as edge function `ourvend-refresh` (verify_jwt=true — callers pass the
// project anon key). Optional ?machine=<id> refreshes a single machine.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OURVEND = "https://os.ourvend.com";
// 6553.5 / 600 are uninitialised hardware registers, not prices. 255 = empty slot.
const SENTINEL = new Set(["6553.5", "600"]);

const ROSTER = [
  { machineId: "2210280082", label: "UNLV Tonopah Hall" },
  { machineId: "2404260016", label: "UNLV Dayton Complex" },
  { machineId: "2303220332", label: "ASU West Glendale" },
  { machineId: "2307120156", label: "ASU Noble Library" },
  { machineId: "2307130211", label: "ASU PolyTech South" },
  { machineId: "2307130307", label: "ASU Breezeway Main Campus" },
  { machineId: "2404090021", label: "ASU Downtown City Center" },
  { machineId: "2404090022", label: "ASU Hayden Library" },
  { machineId: "2602080991", label: "Murad" },
  { machineId: "2602080907", label: "CSUDH Front Hall" },
  { machineId: "2407100037", label: "Unassigned" },
  { machineId: "2407100158", label: "Unassigned" },
  { machineId: "2602080924", label: "Unassigned" },
  { machineId: "2602080931", label: "Unassigned" },
];

const sb = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

async function getCookie(): Promise<string> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/secrets?key=eq.ourvend_cookie&select=value`, { headers: sb });
  const rows = await r.json();
  return rows?.[0]?.value ?? "";
}

async function readMachine(machineId: string, cookie: string) {
  const r = await fetch(`${OURVEND}/Selection/SoltInfo`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "x-requested-with": "XMLHttpRequest",
      origin: OURVEND,
      referer: `${OURVEND}/Selection/Index`,
      cookie,
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    },
    body: new URLSearchParams({ MachineID: machineId, boxId: "" }).toString(),
    redirect: "manual",
  });
  const text = await r.text();
  if (r.status >= 300 && r.status < 400) throw new Error("session expired");
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error("non-JSON (session expired?)"); }
  const rows = Array.isArray(parsed) ? (parsed as unknown[])[1] : null;
  if (!Array.isArray(rows)) throw new Error("unexpected shape");
  const out: Record<string, unknown>[] = [];
  for (const s of rows as Record<string, string>[]) {
    if (s.SiWorkStatus === "255" || !s.SiBarCode || SENTINEL.has(s.SiPrice)) continue;
    out.push({
      machine_id: s.SiMachineId, coil: Number(s.SiCoilId), barcode: s.SiBarCode,
      product: (s.PrName || "").trim(), machine_price: s.SiPrice, cloud_price: s.SiCustomPrice,
      capacity: Number(s.SiCapacity), stock: Number(s.SiExtantQuantity),
      img_url: s.PrImgUrl || "", work_status: s.SiWorkStatus, synced_at: new Date().toISOString(),
    });
  }
  return out;
}

async function saveSlots(machineId: string, rows: Record<string, unknown>[]) {
  await fetch(`${SUPABASE_URL}/rest/v1/live_slots?machine_id=eq.${machineId}`, { method: "DELETE", headers: { ...sb, Prefer: "return=minimal" } });
  if (rows.length === 0) return;
  const r = await fetch(`${SUPABASE_URL}/rest/v1/live_slots`, { method: "POST", headers: { ...sb, "content-type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(rows) });
  if (!r.ok) throw new Error(`save ${r.status} ${await r.text()}`);
}

async function log(machineId: string | null, slots: number, ok: boolean, note: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/ourvend_sync_log`, { method: "POST", headers: { ...sb, "content-type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ machine_id: machineId, slots, ok, note }) }).catch(() => {});
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const one = url.searchParams.get("machine");
  const cookie = await getCookie();
  if (!cookie) return Response.json({ ok: false, error: "no OurVend cookie stored" });
  const targets = one ? ROSTER.filter((m) => m.machineId === one) : ROSTER;
  if (targets.length === 0) return Response.json({ ok: false, error: `unknown machine ${one}` });

  const results: Record<string, unknown>[] = [];
  let totalSlots = 0;
  for (const m of targets) {
    try {
      const rows = await readMachine(m.machineId, cookie);
      await saveSlots(m.machineId, rows);
      await log(m.machineId, rows.length, true, "ok");
      results.push({ machineId: m.machineId, label: m.label, slots: rows.length });
      totalSlots += rows.length;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await log(m.machineId, 0, false, msg);
      results.push({ machineId: m.machineId, label: m.label, error: msg });
    }
    if (targets.length > 1) await new Promise((r) => setTimeout(r, 250));
  }
  const failed = results.filter((r) => r.error).length;
  return Response.json({ ok: failed === 0, machines: results.length, totalSlots, failed, syncedAt: new Date().toISOString(), results });
});
