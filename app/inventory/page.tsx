import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { neverSynced } from '@/lib/fleet';
import { getLiveFleet, syncedAgo } from '@/lib/live-slots';
import { ScopeMap } from '@/components/ScopeMap';
import { AtlasDock } from '@/components/AtlasDock';
import { getDepartment } from '@/lib/departments';

// Render against the freshest live_slots on every request.
export const dynamic = 'force-dynamic';

export default async function Inventory() {
  const { machines, syncedAt, live } = await getLiveFleet();

  // Low-stock signals — only where capacity is real (not a factory default).
  type Low = { machineId: string; label: string; slot: number; product: string; stock: number; capacity: number; pct: number };
  const lows: Low[] = [];
  let realCapMachines = 0;
  for (const m of machines) {
    const realCap = m.slots.length > 0 && m.slots.every((s) => s.capacity === 99 || s.capacity === 199) === false;
    // "real capacity" = not every slot pinned to the 99/199 factory defaults
    const hasRealCap = m.slots.some((s) => s.capacity !== 99 && s.capacity !== 199 && s.capacity > 0);
    if (hasRealCap) realCapMachines++;
    for (const s of m.slots) {
      if (neverSynced(s) || !s.product) continue;
      const usable = s.capacity !== 99 && s.capacity !== 199 && s.capacity > 0;
      if (usable && s.stock / s.capacity <= 0.5) {
        lows.push({ machineId: m.machineId, label: m.label, slot: s.slot, product: s.product, stock: s.stock, capacity: s.capacity, pct: Math.round((s.stock / s.capacity) * 100) });
      }
    }
  }
  lows.sort((a, b) => a.pct - b.pct);

  const totalUnits = machines.reduce((n, m) => n + m.totalStock, 0);
  const stockedMachines = machines.filter((m) => m.stockedSlots > 0).length;

  return (
    <div className="shell">
      <Sidebar active="inventory" />
      <main className="main">
        <div className="deptpage" style={{ ['--c' as string]: getDepartment('inventory')!.color, maxWidth: 1200 }}>
          <AtlasDock dept="inventory" />
          <div className="crumb"><Link href="/">Command Center</Link> / OPERATIONS</div>
          <h1>Inventory</h1>
          <p className="blurb">What is stocked where, across every machine. Inventory decides what is needed — Restocking does the fieldwork.</p>


          <div className="banner" style={{ border: '1px solid rgba(255,140,26,.35)', background: 'rgba(255,140,26,.07)', color: '#ffd39a' }}>
            {live ? <>Live from OurVend — synced <b>{syncedAgo(syncedAt)}</b>. </> : <>Committed snapshot. </>}
            <b>Low-stock alerts only run where capacity is real</b> — {realCapMachines} of {machines.length} machines have true per-slot capacities set. The rest still show the factory default (99/199), so a percentage there is meaningless until real capacities are entered.
          </div>

          <div className="pills" style={{ justifyContent: 'flex-start', marginBottom: 18 }}>
            <div className="pill">{stockedMachines} machines stocked</div>
            <div className="pill">{totalUnits.toLocaleString()} units on hand</div>
            <div className="pill">{lows.length} low-stock signals</div>
          </div>

          <div className="section">
            <h3>Low-stock signals</h3>
            {lows.length === 0 ? (
              <p>No trustworthy low-stock signals in the snapshot. (Only machines with real capacities can be measured — see the note above.)</p>
            ) : (
              <div className="tablewrap" style={{ marginTop: 10 }}>
                <table className="dtable">
                  <thead><tr><th>Machine</th><th>Slot</th><th>Product</th><th style={{ textAlign: 'right' }}>Stock</th><th style={{ textAlign: 'right' }}>Cap</th><th style={{ textAlign: 'right' }}>Full</th></tr></thead>
                  <tbody>
                    {lows.map((l) => (
                      <tr key={`${l.machineId}-${l.slot}`}>
                        <td><Link href={`/machine-operations/${l.machineId}`}>{l.label}</Link></td>
                        <td className="num">{l.slot}</td>
                        <td>{l.product}</td>
                        <td className="num" style={{ textAlign: 'right' }}>{l.stock}</td>
                        <td className="num" style={{ textAlign: 'right' }}>{l.capacity}</td>
                        <td className="num" style={{ textAlign: 'right' }}><span className={`chip ${l.pct <= 25 ? 'chip-warn' : 'chip-empty'}`}>{l.pct}%</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="section">
            <h3>Per-machine stock</h3>
            <div className="tablewrap" style={{ marginTop: 10 }}>
              <table className="dtable">
                <thead><tr><th>Machine</th><th>Group</th><th style={{ textAlign: 'right' }}>Slots loaded</th><th style={{ textAlign: 'right' }}>Units</th><th>Capacity data</th></tr></thead>
                <tbody>
                  {machines.map((m) => {
                    const hasRealCap = m.slots.some((s) => s.capacity !== 99 && s.capacity !== 199 && s.capacity > 0);
                    return (
                      <tr key={m.machineId}>
                        <td><Link href={`/machine-operations/${m.machineId}`}>{m.label}</Link></td>
                        <td>{m.group}</td>
                        <td className="num" style={{ textAlign: 'right' }}>{m.stockedSlots || '—'}</td>
                        <td className="num" style={{ textAlign: 'right' }}>{m.totalStock || '—'}</td>
                        <td>{m.stockedSlots === 0 ? <span className="chip chip-empty">empty</span> : hasRealCap ? <span className="chip chip-live">real</span> : <span className="chip chip-warn">default only</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="section">
            <h3>Reorder logic <span className="ph-tag">next</span></h3>
            <p>Bundles need location-wide before triggering a purchase, not one random low slot — accounts for restock cost, shipping, velocity, and contract type. Wires up once real capacities and sales velocity are flowing.</p>
          </div>

          <h2 className="scope-heading">Full department scope</h2>
          <ScopeMap id="inventory" />
        </div>
      </main>
    </div>
  );
}
