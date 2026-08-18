import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { ScopeMap } from '@/components/ScopeMap';
import { TemplatesBoard } from '@/components/TemplatesBoard';
import { FLEET } from '@/lib/fleet';

const COLOR = '#8b5cff';

// Templates define intended machine contents — which product in which slot, at
// what price and capacity. Built once, approved, then loaded onto a machine at
// setup. Product names are pulled from the live fleet for quick entry.
export default function TemplatesConfig() {
  const products = Array.from(
    new Set(FLEET.machines.flatMap((m) => m.slots.map((s) => s.product).filter(Boolean)))
  ).sort();

  return (
    <div className="shell">
      <Sidebar active="templates-config" />
      <main className="main">
        <div className="deptpage" style={{ ['--c' as string]: COLOR, maxWidth: 1100 }}>
          <div className="crumb"><Link href="/">Command Center</Link> / OPERATIONS</div>
          <h1>Templates &amp; Config</h1>
          <p className="blurb">Reusable machine layouts — which product sits in which slot, at what price and capacity. Build once, approve, load onto a machine at setup.</p>

          <div className="banner" style={{ border: '1px solid rgba(139,92,255,.35)', background: 'rgba(139,92,255,.08)', color: '#cdbcff' }}>
            <b>Build a layout once, reuse it.</b> Add slot rows, type a product (autocompletes from your live catalog), set price and capacity. Approve it when it&apos;s ready — approved templates are what <Link href="/setup-distribution" style={{ color: '#c3b0ff' }}>Setup</Link> loads onto a new machine.
          </div>

          <TemplatesBoard products={products} />

          <div className="section" style={{ marginTop: 18 }}>
            <h3>Coming next on this page <span className="ph-tag">after layouts</span></h3>
            <p>Linked-slot handling (one product across two coils, like the fleet already does), facility restriction overrides (e.g. block Plan B on a campus that bans it), a visual slot grid, and one-click apply-to-machine that writes the layout through Machine Operations.</p>
          </div>

          <h2 className="scope-heading">Full department scope</h2>
          <ScopeMap id="templates-config" />
        </div>
      </main>
    </div>
  );
}
