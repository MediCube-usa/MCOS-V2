// Permanent OurVend refresh endpoint. Pulls live slot/inventory/price data from
// OurVend for one machine (?machine=ID) or the whole fleet, and stores it in
// live_slots. Runs on the server (Vercel), read-only against OurVend.
//
// Session: reads the OurVend cookie from the OURVEND_COOKIE env var (server-only,
// never shipped to the browser). When it expires, update that one env var — or,
// later, the login-capture refreshes it automatically.
import { OURVEND_ROSTER } from '@/lib/ourvend/roster';
import { readMachine, type LiveSlot } from '@/lib/ourvend/client';
import { SUPABASE_URL, SUPABASE_KEY } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const sb = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

async function saveSlots(machineId: string, slots: LiveSlot[]) {
  // replace this machine's rows, then insert the fresh set
  await fetch(`${SUPABASE_URL}/rest/v1/live_slots?machine_id=eq.${machineId}`, {
    method: 'DELETE', headers: { ...sb, Prefer: 'return=minimal' }
  });
  if (slots.length === 0) return;
  const rows = slots.map((s) => ({
    machine_id: s.machineId, coil: s.coil, barcode: s.barcode, product: s.product,
    machine_price: s.machinePrice, cloud_price: s.cloudPrice, capacity: s.capacity,
    stock: s.stock, img_url: s.imgUrl, work_status: s.workStatus, synced_at: new Date().toISOString()
  }));
  const r = await fetch(`${SUPABASE_URL}/rest/v1/live_slots`, {
    method: 'POST',
    headers: { ...sb, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(rows)
  });
  if (!r.ok) throw new Error(`save ${machineId} ${r.status} ${await r.text()}`);
}

async function log(machineId: string | null, slots: number, ok: boolean, note: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/ourvend_sync_log`, {
    method: 'POST',
    headers: { ...sb, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ machine_id: machineId, slots, ok, note })
  }).catch(() => {});
}

export async function POST(req: Request) {
  const cookie = process.env.OURVEND_COOKIE || '';
  if (!cookie) {
    return Response.json(
      { ok: false, error: 'OURVEND_COOKIE is not set on the server. Add it in Vercel → Settings → Environment Variables, then redeploy.' },
      { status: 200 }
    );
  }
  const url = new URL(req.url);
  const one = url.searchParams.get('machine');
  const targets = one ? OURVEND_ROSTER.filter((m) => m.machineId === one) : OURVEND_ROSTER;
  if (targets.length === 0) return Response.json({ ok: false, error: `unknown machine ${one}` }, { status: 200 });

  const results: { machineId: string; label: string; slots?: number; error?: string }[] = [];
  let totalSlots = 0;
  for (const m of targets) {
    try {
      const slots = await readMachine(m.machineId, cookie);
      await saveSlots(m.machineId, slots);
      await log(m.machineId, slots.length, true, 'ok');
      results.push({ machineId: m.machineId, label: m.label, slots: slots.length });
      totalSlots += slots.length;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await log(m.machineId, 0, false, msg);
      results.push({ machineId: m.machineId, label: m.label, error: msg });
    }
    if (targets.length > 1) await new Promise((r) => setTimeout(r, 300));
  }
  const failed = results.filter((r) => r.error);
  return Response.json({
    ok: failed.length === 0,
    machines: results.length,
    totalSlots,
    failed: failed.length,
    syncedAt: new Date().toISOString(),
    results
  });
}
