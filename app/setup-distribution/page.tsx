import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { ScopeMap } from '@/components/ScopeMap';
import { SetupBoard } from '@/components/SetupBoard';
import { BlockAlerts } from '@/components/BlockAlerts';
import { AtlasDock } from '@/components/AtlasDock';

const COLOR = '#ffb000';

// Machine Setup is the pre-live lifecycle: a machine is ordered from TCN, tracked
// through shipping and the warehouse, scheduled, placed, and verified before it
// goes live and hands off to Machine Operations. This is where the partner adds
// new machines and moves them down the pipeline.
export default function SetupDistribution() {
  return (
    <div className="shell">
      <Sidebar active="setup-distribution" />
      <main className="main">
        <div className="deptpage" style={{ ['--c' as string]: COLOR, maxWidth: 1280 }}>
          <AtlasDock dept="setup-distribution" />
          <div className="crumb"><Link href="/">Command Center</Link> / OPERATIONS</div>
          <h1>Machine Setup</h1>
          <p className="blurb">The fleet pipeline — every machine from TCN order to verified, coast to coast. Each colored tab is a stage: open it to see exactly what it holds, what completes it, and the machines sitting there.</p>

          <BlockAlerts dept="setup-distribution" />

          <SetupBoard />

          <h2 className="scope-heading">Full department scope</h2>
          <ScopeMap id="setup-distribution" />
        </div>
      </main>
    </div>
  );
}
