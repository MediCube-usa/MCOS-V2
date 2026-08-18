import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { RefreshOurVend } from '@/components/RefreshOurVend';
import { neverSynced } from '@/lib/fleet';
import { getLiveMachine, getLiveImages, syncedAgo } from '@/lib/live-slots';

// Render live from live_slots on every request.
export const dynamic = 'force-dynamic';

export default async function MachineDetail({ params }: { params: Promise<{ machineId: string }> }) {
  const { machineId } = await params;
  const { machine: m, syncedAt, live } = await getLiveMachine(machineId);
  if (!m) notFound();
  const images = await getLiveImages(machineId);

  return (
    <div className="shell">
      <Sidebar active="machine-operations" />
      <main className="main">
        <div className="deptpage" style={{ ['--c' as string]: '#ff3df2', maxWidth: 1200 }}>
          <div className="crumb"><Link href="/">Command Center</Link> / <Link href="/machine-operations">Machine Operations</Link> / {m.group}</div>
          <h1 style={{ fontSize: 28 }}>{m.label}</h1>
          <p className="blurb">
            <span className="mono">{m.machineId}</span> · {m.stockedSlots} slots loaded · {m.totalStock} units
            {live && syncedAt ? <> · <span style={{ color: '#8affc2' }}>live, synced {syncedAgo(syncedAt)}</span></> : <> · <span style={{ opacity: .7 }}>snapshot</span></>}
          </p>

          <RefreshOurVend machineId={m.machineId} label={m.label} />

          {m.slots.length === 0 ? (
            <div className="banner" style={{ border: '1px solid rgba(150,150,170,.4)', background: 'rgba(150,150,170,.08)', color: '#c8d0e0', marginTop: 12 }}>
              No products loaded on this machine — empty or still in setup.
            </div>
          ) : (
            <div className="tablewrap" style={{ marginTop: 12 }}>
              <table className="dtable">
                <thead>
                  <tr><th></th><th>Slot</th><th>Product</th><th style={{ textAlign: 'right' }}>Charged</th><th style={{ textAlign: 'right' }}>Cloud price</th><th style={{ textAlign: 'right' }}>Stock</th><th style={{ textAlign: 'right' }}>Cap</th><th>Sync</th></tr>
                </thead>
                <tbody>
                  {m.slots.map((s) => {
                    const unsynced = neverSynced(s);
                    const diff = !unsynced && s.userPrice && s.machinePrice !== s.userPrice;
                    const img = images[`${m.machineId}:${s.slot}`];
                    return (
                      <tr key={s.slot}>
                        <td>{img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt="" width={34} height={34} style={{ objectFit: 'contain', borderRadius: 6, background: 'rgba(255,255,255,.06)' }} />
                        ) : null}</td>
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
            &ldquo;Charged&rdquo; is the Machine Price (what the customer pays, evidenced). &ldquo;Cloud price&rdquo; is the editable user-defined price. <b>*</b> marks a slot where the two differ. This view is <b>read-only</b> — these are live, partner-run machines; no price or product is changed from here.
          </p>
        </div>
      </main>
    </div>
  );
}
