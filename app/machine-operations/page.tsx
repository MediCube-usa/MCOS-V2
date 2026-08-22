import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { ScopeMap } from '@/components/ScopeMap';
import { RefreshOurVend } from '@/components/RefreshOurVend';
import { getLiveFleet, syncedAgo } from '@/lib/live-slots';
import { AtlasDock } from '@/components/AtlasDock';
import { getDepartment } from '@/lib/departments';

// Always render against the freshest live_slots (edge function keeps it current).
export const dynamic = 'force-dynamic';

export default async function MachineOperations() {
  const { machines, syncedAt, live } = await getLiveFleet();
  const withProduct = machines.filter((m) => m.stockedSlots > 0).length;
  const groups = Array.from(new Set(machines.map((m) => m.group)));

  return (
    <div className="shell">
      <Sidebar active="machine-operations" />
      <main className="main">
        <div className="deptpage" style={{ ['--c' as string]: getDepartment('machine-operations')!.color, maxWidth: 1200 }}>
          <AtlasDock dept="machine-operations" />
          <div className="crumb"><Link href="/">Command Center</Link> / OPERATIONS</div>
          <h1>Machine Operations</h1>
          <p className="blurb">Every machine on the account, read live from OurVend. Click a machine to see its slots, prices, and stock.</p>


          <div className="banner" style={{ border: '1px solid rgba(255,61,242,.35)', background: 'rgba(255,61,242,.07)', color: '#ffc2f6' }}>
            {live ? (
              <>Live from OurVend — synced <b>{syncedAgo(syncedAt)}</b>. {machines.length} machines, {withProduct} with product loaded. The fleet re-syncs automatically every ~20 min; hit refresh for an on-demand pull.</>
            ) : (
              <>Showing the committed snapshot ({machines.length} machines, {withProduct} with product loaded). Live rows will appear here as soon as the next OurVend sync lands — or hit refresh now.</>
            )}
          </div>

          <div className="pills" style={{ justifyContent: 'flex-start', marginBottom: 14 }}>
            <div className="pill">{machines.length} machines</div>
            <div className="pill">{withProduct} loaded</div>
            <div className="pill">{groups.length} groups</div>
            {live && <div className="pill">synced {syncedAgo(syncedAt)}</div>}
          </div>

          <RefreshOurVend />

          <div className="tablewrap">
            <table className="dtable">
              <thead>
                <tr><th>Machine ID</th><th>Location</th><th>Group</th><th style={{ textAlign: 'right' }}>Stocked slots</th><th style={{ textAlign: 'right' }}>Units</th><th>State</th></tr>
              </thead>
              <tbody>
                {machines.map((m) => {
                  const empty = m.stockedSlots === 0;
                  return (
                    <tr key={m.machineId}>
                      <td className="mono"><Link href={`/machine-operations/${m.machineId}`}>{m.machineId}</Link></td>
                      <td>{m.label}</td>
                      <td>{m.group}</td>
                      <td style={{ textAlign: 'right' }} className="num">{m.stockedSlots || '—'}</td>
                      <td style={{ textAlign: 'right' }} className="num">{m.totalStock || '—'}</td>
                      <td><span className={`chip ${empty ? 'chip-empty' : 'chip-live'}`}>{empty ? 'empty / setup' : 'stocked'}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h2 className="scope-heading">Full department scope</h2>
          <ScopeMap id="machine-operations" />
        </div>
      </main>
    </div>
  );
}
