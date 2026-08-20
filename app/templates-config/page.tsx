import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { ScopeMap } from '@/components/ScopeMap';
import { PlanogramsBoard } from '@/components/PlanogramsBoard';
import { BlockAlerts } from '@/components/BlockAlerts';

const COLOR = '#8b5cff';

// Planograms & Templates — authoring, machine roles, assignment, go-live tracking.
// Spec: docs/blocks/planograms.md. Push to OurVend is CLONE-A-MACHINE ONLY and stays
// locked (read-only) until Joe walks through the exact clone steps.
export default function TemplatesConfig() {
  return (
    <div className="shell">
      <Sidebar active="templates-config" />
      <main className="main">
        <div className="deptpage" style={{ ['--c' as string]: COLOR, maxWidth: 1100 }}>
          <div className="crumb"><Link href="/">Command Center</Link> / OPERATIONS</div>
          <h1>Planograms &amp; Templates</h1>
          <p className="blurb">Author planograms on the shared 40-coil layout, flag machine roles, assign
            planograms to new machines, and track go-live. Products come from the
            <Link href="/product-catalog-sales" style={{ color: '#c3b0ff' }}> Product Catalog</Link> — only
            catalog products (image + description in OurVend) can ride a planogram.</p>

          <BlockAlerts dept="templates-config" />

          <div className="banner" style={{ border: '1px solid rgba(139,92,255,.35)', background: 'rgba(139,92,255,.08)', color: '#cdbcff' }}>
            <b>How it reaches a machine:</b> OurVend has no template object — a planogram becomes a
            <b> template machine</b> (set up, not in use) and gets <b>cloned</b> onto real machines. A machine
            goes live when refill places the products and sets the beginning count at the machine.
            The MCOS→OurVend push is <b>locked</b> until Joe walks the clone steps — everything here stays
            in our own database.
          </div>

          <PlanogramsBoard />

          <h2 className="scope-heading">Full department scope</h2>
          <ScopeMap id="templates-config" />
        </div>
      </main>
    </div>
  );
}
