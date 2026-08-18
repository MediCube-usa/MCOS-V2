import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { ScopeMap } from '@/components/ScopeMap';
import { SetupBoard } from '@/components/SetupBoard';

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
          <div className="crumb"><Link href="/">Command Center</Link> / OPERATIONS</div>
          <h1>Machine Setup</h1>
          <p className="blurb">New machines from TCN order through shipping, placement, and go-live. Add a machine when it&apos;s ordered; move it down the pipeline as it progresses.</p>

          <div className="banner" style={{ border: '1px solid rgba(255,176,0,.35)', background: 'rgba(255,176,0,.07)', color: '#ffce7a' }}>
            <b>How it works:</b> add a machine when your partner orders it. Open a card to set its order ref, facility, ETA, notes, and tick the go-live checklist. Use ← / advance → to move it through the stages. When it reaches <b>Live</b>, it belongs to Machine Operations.
          </div>

          <SetupBoard />

          <div className="section" style={{ marginTop: 18 }}>
            <h3>Coming next on this page <span className="ph-tag">after the pipeline</span></h3>
            <p>TCN &amp; logistics contacts (Brendamour, warehouse) linked in, setup photos/proof per machine, and auto-handoff: when a machine goes Live it appears in Machine Operations and gets pinned in Maps. Facility, template, and card-reader fields will link to those departments instead of free text.</p>
          </div>

          <h2 className="scope-heading">Full department scope</h2>
          <ScopeMap id="setup-distribution" />
        </div>
      </main>
    </div>
  );
}
