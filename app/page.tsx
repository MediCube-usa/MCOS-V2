import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { AgentBadge } from '@/components/AgentBadge';
import { BoxAlertCount } from '@/components/BoxAlertCount';
import { CalendarPanel } from '@/components/CalendarPanel';
import { LogoRainbow } from '@/components/Logo';
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

export default function CommandCenter() {
  const blocks = blockDepartments();
  const ready = blocks.filter((d) => d.status === 'ready').length;
  const building = blocks.filter((d) => d.status === 'building').length;
  const shell = blocks.filter((d) => d.status === 'shell').length;
  const a = fleetAlerts();

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
        <div className="topbar">
          <div>
            <h1>Command Center</h1>
            <div className="sub">MEDICUBE HEALTH · LIVE OPERATIONS · JOSEPH</div>
          </div>
          <CalendarPanel />
        </div>

        <div className="agent-band">
          <div className="statement">
            <b>One system runs the whole company.</b>
            <span>Every machine, school, product, restock, payout, and report moves through MCOS.</span>
          </div>
          <div className="agent-card">
            <div className="agentbadge"><LogoRainbow size={56} /><span className="agent-name">Atlas</span><span className="agent-sub" style={{ color: '#b9a6ff' }}>Executive</span></div>
            <div className="agent-card-body">
              <div className="t">Command Agent</div>
              <div className="note">{ready} live, {building} in build, {shell} parked. Atlas reaches into every department. Click any block to open it.</div>
            </div>
          </div>
        </div>

        <section className="grid">
          {blocks.map((d) => {
            const alert = ALERTS[d.id];
            return (
              <Link key={d.id} href={`/${d.id}`} className={`block ${d.status === 'shell' ? 'parked' : ''}`} style={{ ['--c' as string]: d.color }}>
                <span className={`status-tag ${d.status}`}>{d.status}</span>
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

                <div className="metric">{d.metric}</div>
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
