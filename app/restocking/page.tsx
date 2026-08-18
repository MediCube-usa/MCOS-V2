import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { FLEET, neverSynced } from '@/lib/fleet';

const STAGES = ['Drafted','Assigned','Confirmed','En route','At machine','Access sent','Refilled','Proof','Closed'];

export default function Restocking() {
  // Candidate restock tasks = machines with trustworthy low slots (real capacity).
  type Task = { machineId: string; label: string; group: string; lows: { slot: number; product: string; stock: number; capacity: number }[] };
  const tasks: Task[] = [];
  for (const m of FLEET.machines) {
    const lows = m.slots.filter((s) => !neverSynced(s) && s.product && s.capacity !== 99 && s.capacity !== 199 && s.capacity > 0 && s.stock / s.capacity <= 0.5)
      .map((s) => ({ slot: s.slot, product: s.product, stock: s.stock, capacity: s.capacity }));
    if (lows.length) tasks.push({ machineId: m.machineId, label: m.label, group: m.group, lows });
  }

  return (
    <div className="shell">
      <Sidebar active="restocking" />
      <main className="main">
        <div className="deptpage" style={{ ['--c' as string]: '#caff00', maxWidth: 1200 }}>
          <div className="crumb"><Link href="/">Command Center</Link> / OPERATIONS</div>
          <h1>Restocking</h1>
          <p className="blurb">Field execution. Inventory decides what is needed; Restocking gets a person to the machine, tracks proof, and updates stock when done.</p>

          <div className="banner" style={{ border: '1px solid rgba(202,255,0,.3)', background: 'rgba(202,255,0,.06)', color: '#e8ff9e' }}>
            Tasks are drafted from Inventory&apos;s trustworthy low-stock signals (real-capacity machines only). Assignment, dispatch, and proof wire up as refiller records and the notify/access system come online.
          </div>

          <div className="section">
            <h3>Task lifecycle</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {STAGES.map((s, i) => (
                <span key={s} className="chip chip-empty" style={{ fontSize: 10.5 }}>{i + 1}. {s}</span>
              ))}
            </div>
          </div>

          <div className="section">
            <h3>Draft restock tasks <span className="ph-tag">from inventory</span></h3>
            {tasks.length === 0 ? (
              <p>No trustworthy restock tasks in the snapshot yet — only real-capacity machines generate them. West Glendale is the one machine with real capacities today.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
                {tasks.map((t) => (
                  <div key={t.machineId} className="tablewrap" style={{ padding: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderBottom: '1px solid rgba(111,228,255,.1)' }}>
                      <div><Link href={`/machine-operations/${t.machineId}`} style={{ color: '#caff00', fontWeight: 800 }}>{t.label}</Link> <span style={{ color: 'var(--muted)', fontSize: 12 }}>· {t.group} · {t.lows.length} slot(s) low</span></div>
                      <div>
                        <span className="ph-btn">🔔 Notify refiller <span className="ph-tag">coming</span></span>
                        <span className="ph-btn">🔒 Send access code <span className="ph-tag">coming</span></span>
                      </div>
                    </div>
                    <table className="dtable">
                      <thead><tr><th>Slot</th><th>Product</th><th style={{ textAlign: 'right' }}>Have</th><th style={{ textAlign: 'right' }}>Cap</th><th style={{ textAlign: 'right' }}>Refill</th></tr></thead>
                      <tbody>
                        {t.lows.map((l) => (
                          <tr key={l.slot}><td className="num">{l.slot}</td><td>{l.product}</td><td className="num" style={{ textAlign: 'right' }}>{l.stock}</td><td className="num" style={{ textAlign: 'right' }}>{l.capacity}</td><td className="num" style={{ textAlign: 'right', color: '#caff00' }}>+{l.capacity - l.stock}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="section">
            <h3>Refiller records, proof & training <span className="ph-tag">next</span></h3>
            <p>Assigned refiller, arrival confirmation, photo proof, door-closed check, and training videos attach here once refiller contacts and the mobile flow are added.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
