import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { ScopeMap } from '@/components/ScopeMap';
import { RestockBoard } from '@/components/RestockBoard';
import { FLEET, neverSynced } from '@/lib/fleet';

// Restocking — Joe's flow (docs/blocks/restocking.md): trigger → alert refiller
// (Instawork/Aramark/student) → accept or roll to next day → map card → QR/push
// verify at machine → key code + refill code → replenish screen amounts → photo
// → agent files to Drive + email → done. Refill NEVER changes prices or slots.
export default function Restocking() {
  // Low-stock signals from trustworthy (real-capacity) machines — candidates for new tasks.
  const lows: { machineId: string; label: string; count: number }[] = [];
  for (const m of FLEET.machines) {
    const n = m.slots.filter((s) => !neverSynced(s) && s.product && s.capacity !== 99 && s.capacity !== 199 && s.capacity > 0 && s.stock / s.capacity <= 0.5).length;
    if (n) lows.push({ machineId: m.machineId, label: m.label, count: n });
  }

  return (
    <div className="shell">
      <Sidebar active="restocking" />
      <main className="main">
        <div className="deptpage" style={{ ['--c' as string]: '#caff00', maxWidth: 1200 }}>
          <div className="crumb"><Link href="/">Command Center</Link> / OPERATIONS</div>
          <h1>Restocking</h1>
          <p className="blurb">Trigger → alert the refiller → accept (or roll to next day) → map card → verify at the
            machine → key + refill codes → replenish exactly what the screen says → photo → filed → done.
            Shipping refills add the campus check-in stop first.</p>

          {lows.length > 0 && (
            <div className="banner" style={{ border: '1px solid rgba(202,255,0,.3)', background: 'rgba(202,255,0,.06)', color: '#e8ff9e' }}>
              Low-stock signals: {lows.map((l) => (
                <span key={l.machineId}><Link href={`/machine-operations/${l.machineId}`} style={{ color: '#caff00' }}>{l.label}</Link> ({l.count} slots) · </span>
              ))}
              create a task below when one needs a run.
            </div>
          )}

          <RestockBoard />

          <h2 className="scope-heading">Full department scope</h2>
          <ScopeMap id="restocking" />
        </div>
      </main>
    </div>
  );
}
