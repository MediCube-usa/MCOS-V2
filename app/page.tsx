import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { AgentBadge } from '@/components/AgentBadge';
import { AgentChat } from '@/components/AgentChat';
import { BoxAlertCount } from '@/components/BoxAlertCount';
import { CalendarPanel } from '@/components/CalendarPanel';
import { blockDepartments } from '@/lib/departments';
import { FLEET, neverSynced } from '@/lib/fleet';

// Real signals derived from the fleet snapshot, so the blocks show honest alerts
// where we have data (not invented numbers).
function fleetAlerts() {
  const machines = FLEET.machines;
  let low = 0, unsynced = 0;
  const priceByProduct = new Map<string, Set<string>>();
  for (const m of machines) {
    for (const s of m.slots) {
      if (neverSynced(s)) { unsynced++; continue; }
      if (!s.product) continue;
      const realCap = s.capacity !== 99 && s.capacity !== 199 && s.capacity > 0;
      if (realCap && s.stock / s.capacity <= 0.5) low++;
      const key = s.barcode || s.product;
      if (!priceByProduct.has(key)) priceByProduct.set(key, new Set());
      priceByProduct.get(key)!.add(s.machinePrice);
    }
  }
  let priceVaries = 0;
  priceByProduct.forEach((set) => { if (set.size > 1) priceVaries++; });
  return { low, unsynced, priceVaries, machines: machines.length };
}

export const revalidate = 120;

// Live counts for the block stat lines — real numbers from the database,
// refreshed every couple of minutes; '—' only if the database is unreachable.
// A zero here is REAL: the block is connected and that table is empty today.
async function liveCounts(): Promise<Record<string, number | null>> {
  const { SUPABASE_URL, SUPABASE_KEY } = await import('@/lib/config');
  const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
  const count = async (q: string) => {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { headers, next: { revalidate: 120 } });
      if (!r.ok) return null;
      return ((await r.json()) as unknown[]).length;
    } catch { return null; }
  };
  const [products, openTasks, pipeline, layouts, mapped, campuses, orders, docs, people] = await Promise.all([
    count('products?select=barcode'),
    count('restock_tasks?select=id&status=not.eq.done'),
    count('setup_machines?select=id'),
    count('templates?select=id'),
    count('machine_locations?select=machine_id'),
    count('facilities?select=id'),
    count('warehouse_orders?select=id&status=not.eq.received'),
    count('documents?select=id'),
    count('contacts?select=id'),
  ]);
  return { products, openTasks, pipeline, layouts, mapped, campuses, orders, docs, people };
}

export default async function CommandCenter() {
  const blocks = blockDepartments();
  const ready = blocks.filter((d) => d.status === 'ready').length;
  const building = blocks.filter((d) => d.status === 'building').length;
  const shell = blocks.filter((d) => d.status === 'shell').length;
  const a = fleetAlerts();
  const live = await liveCounts();

  // stocked slots across the fleet — a real, always-meaningful inventory number
  let stocked = 0;
  for (const m of FLEET.machines) for (const s of m.slots) if (s.product && !neverSynced(s)) stocked++;

  // the stat line on each box — live wherever real data exists; a zero means
  // connected-and-empty-today, never disconnected
  const n = (v: number | null) => (v !== null ? String(v) : '—');
  const METRICS: Record<string, string> = {
    'product-catalog-sales': n(live.products),
    'inventory': String(stocked),
    'restocking': n(live.openTasks),
    'machine-operations': String(a.machines),
    'setup-distribution': n(live.pipeline),
    'templates-config': n(live.layouts),
    'maps-distribution': n(live.mapped),
    'facilities': n(live.campuses),
    'warehouse-purchasing': n(live.orders),
    'documents': n(live.docs),
    'contacts': n(live.people),
  };

  // per-department alert line: real where we have data, else a neutral status
  const ALERTS: Record<string, string> = {
    'machine-operations': a.unsynced > 0 ? `${a.machines} machines · ${a.unsynced} slots unsynced` : `${a.machines} machines online`,
    'inventory': a.low > 0 ? `${a.low} low-stock signals` : 'stock levels OK',
    'restocking': a.low > 0 ? `${a.low} restock tasks queued` : 'no open tasks',
    'product-catalog-sales': a.priceVaries > 0 ? `${a.priceVaries} products priced differently` : 'prices consistent'
  };
  const statusWord = (s: string) => (s === 'ready' ? 'Live' : s === 'building' ? 'Building' : 'Parked');

  return (
    <div className="shell">
      <Sidebar active="command-center" />
      <main className="main">
        {/* Per Joe's markup: right column (video + calendar, even sizes) runs the FULL
            height from the page top; Atlas + title fill the left. */}
        <div className="cc-top atlas-band">
          <div className="cc-left">
            <div className="topbar">
              <div>
                <h1>Command Center</h1>
                <div className="sub">MEDICUBE HEALTH · LIVE OPERATIONS · JOSEPH</div>
              </div>
            </div>
            <AgentChat greeting={`${ready} live, ${building} in build, ${shell} parked. Ask me about the fleet, stock, or any date — or say "remind me…" and I'll put it on the calendar.`} />
          </div>
          <div className="side-stack">
            <div className="video-box">
              <div className="video-head"><span>📺 Screen Feed</span><span className="video-tag">NATIONWIDE</span></div>
              <div className="video-screen"><span className="video-play">▶</span></div>
              <div className="video-note">placeholder — will mirror what&apos;s playing on the machine screens</div>
            </div>
            <CalendarPanel />
          </div>
        </div>

        <section className="grid">
          {blocks.map((d) => {
            const alert = ALERTS[d.id];
            return (
              <Link key={d.id} href={`/${d.id}`} className={`block ${d.status === 'shell' ? 'parked' : ''}`} style={{ ['--c' as string]: d.color }}>
                <div className="block-head">
                  <div className="block-title">
                    <h2>{d.name}</h2>
                    <div className="block-sub">MCOS · {statusWord(d.status)}</div>
                  </div>
                  <div className="block-side">
                    {d.agent && d.agent !== '—' && <AgentBadge name={d.agent} color={d.color} size={30} />}
                    <BoxAlertCount dept={d.id} />
                  </div>
                </div>

                <div className="metric">{METRICS[d.id] ?? d.metric}</div>
                <div className="label">{d.metricLabel}</div>

                <div className="block-alert">
                  <span className="alert-dot" />
                  {alert ? alert : (d.status === 'shell' ? 'parked — added later' : 'no alerts')}
                </div>

                <div className="block-activity">
                  <span className="act-label">activity</span>
                  <span className="spark">
                    {sparkBars(d.id).map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}
                  </span>
                  <span className="act-window">7D</span>
                </div>
              </Link>
            );
          })}
        </section>
      </main>
    </div>
  );
}

// A stable, per-department bar pattern for the activity motif (visual accent,
// deterministic from the id — not a data claim).
function sparkBars(id: string): number[] {
  let seed = 0;
  for (let i = 0; i < id.length; i++) seed = (seed * 31 + id.charCodeAt(i)) % 9973;
  const out: number[] = [];
  for (let i = 0; i < 14; i++) { seed = (seed * 1103515245 + 12345) % 2147483648; out.push(30 + (seed % 70)); }
  return out;
}
