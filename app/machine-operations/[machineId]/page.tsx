import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { FLEET, getMachine, neverSynced } from '@/lib/fleet';

export function generateStaticParams() {
  return FLEET.machines.map((m) => ({ machineId: m.machineId }));
}

export default async function MachineDetail({ params }: { params: Promise<{ machineId: string }> }) {
  const { machineId } = await params;
  const m = getMachine(machineId);
  if (!m) notFound();

  return (
    <div className="shell">
      <Sidebar active="machine-operations" />
      <main className="main">
        <div className="deptpage" style={{ ['--c' as string]: '#ff3df2', maxWidth: 1200 }}>
          <div className="crumb"><Link href="/">Command Center</Link> / <Link href="/machine-operations">Machine Operations</Link> / {m.group}</div>
          <h1 style={{ fontSize: 28 }}>{m.label}</h1>
          <p className="blurb"><span className="mono">{m.machineId}</span> · {m.stockedSlots} slots loaded · {m.totalStock} units</p>

          {m.slots.length === 0 ? (
            <div className="banner" style={{ border: '1px solid rgba(150,150,170,.4)', background: 'rgba(150,150,170,.08)', color: '#c8d0e0' }}>
              No products loaded on this machine in the snapshot — empty or still in setup.
            </div>
          ) : (
            <div className="tablewrap">
              <table className="dtable">
                <thead>
                  <tr><th>Slot</th><th>Product</th><th style={{ textAlign: 'right' }}>Charged</th><th style={{ textAlign: 'right' }}>Cloud price</th><th style={{ textAlign: 'right' }}>Stock</th><th style={{ textAlign: 'right' }}>Cap</th><th>Sync</th></tr>
                </thead>
                <tbody>
                  {m.slots.map((s) => {
                    const unsynced = neverSynced(s);
                    const diff = !unsynced && s.userPrice && s.machinePrice !== s.userPrice;
                    return (
                      <tr key={s.slot}>
                        <td className="num">{s.slot}</td>
                        <td>{s.product || <span style={{ opacity: .5 }}>—</span>}</td>
                        <td style={{ textAlign: 'right' }} className="num">{unsynced ? '—' : `$${s.machinePrice}`}</td>
                        <td style={{ textAlign: 'right' }} className="num">{s.userPrice ? `$${s.userPrice}` : '—'}{diff ? ' *' : ''}</td>
                        <td style={{ textAlign: 'right' }} className="num">{s.stock}</td>
                        <td style={{ textAlign: 'right' }} className="num">{s.capacity}</td>
                        <td>{unsynced ? <span className="chip chip-empty">never synced</span> : diff ? <span className="chip chip-warn">differs</span> : <span className="chip chip-live">ok</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="blurb" style={{ marginTop: 14, fontSize: 12.5 }}>
            &ldquo;Charged&rdquo; is the Machine Price (what the customer pays, evidenced). &ldquo;Cloud price&rdquo; is the editable user-defined price. <b>*</b> marks a slot where the two differ. Editing from here is proven and will be wired once live auth is in place.
          </p>
        </div>
      </main>
    </div>
  );
}
