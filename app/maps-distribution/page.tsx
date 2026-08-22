import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { FLEET } from '@/lib/fleet';
import { ScopeMap } from '@/components/ScopeMap';
import { MapConsole } from '@/components/MapConsole';
import { MapCards } from '@/components/MapCards';
import { BlockAlerts } from '@/components/BlockAlerts';
import { AtlasDock } from '@/components/AtlasDock';

const COLOR = '#2fd2ff';

// Maps is the first real record of a location: a campus is approved, THEN pinned
// here, THEN a machine is ordered and set up. Pins are dropped by hand on the live
// Google Map and saved so the whole team — and the field crew — see the same map.
export default function MapsDistribution() {
  const machines = FLEET.machines.map((m) => ({
    machineId: m.machineId,
    label: m.label,
    group: m.group
  }));

  return (
    <div className="shell">
      <Sidebar active="maps-distribution" />
      <main className="main">
        <div className="deptpage" style={{ ['--c' as string]: COLOR, maxWidth: 1280 }}>
          <AtlasDock dept="maps-distribution" />
          <div className="crumb"><Link href="/">Command Center</Link> / OPERATIONS</div>
          <h1>Maps &amp; Routes</h1>
          <p className="blurb">Every machine pinned by hand on the live map. A campus gets mapped here the moment it&apos;s approved — before a machine is ordered or set up.</p>

          <BlockAlerts dept="maps-distribution" />

          <div className="banner" style={{ border: '1px solid rgba(47,210,255,.35)', background: 'rgba(47,210,255,.07)', color: '#a9e6ff' }}>
            <b>How to map a machine:</b> pick it from the list, then click its exact spot on the map — inside the building, at the real placement. Drag the pin to fine-tune. It saves instantly and everyone sees it.
          </div>

          {/* lifecycle strip — the order a location moves through */}
          <div className="workflow-strip">
            {['Campus approved', 'Pin location', 'Placement photo', 'Plan route', 'Share field card'].map((step, i) => (
              <div className="wf-step" key={step}>
                <span className="wf-num">{i + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>

          <MapConsole machines={machines} />

          <MapCards />

          <div className="section" style={{ marginTop: 18 }}>
            <h3>Next on this page <span className="ph-tag">after pins</span></h3>
            <p>Once machines are pinned: a placement photo per pin, a one-tap field card that shares just that machine&apos;s location + directions to a refiller (not the whole fleet), and route planning across a campus. New campuses enter at &quot;approved&quot; and move down the strip above.</p>
          </div>

          <h2 className="scope-heading">Full department scope</h2>
          <ScopeMap id="maps-distribution" />
        </div>
      </main>
    </div>
  );
}
