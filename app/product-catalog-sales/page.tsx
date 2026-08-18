import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { ScopeMap } from '@/components/ScopeMap';
import { CatalogBoard } from '@/components/CatalogBoard';
import { FLEET } from '@/lib/fleet';

const COLOR = '#00ffaa';

// which machines carry each product (by barcode), from the live fleet snapshot
function buildCarriers(): Record<string, string[]> {
  const map: Record<string, Set<string>> = {};
  for (const m of FLEET.machines) {
    for (const s of m.slots) {
      if (!s.barcode || !s.product) continue;
      (map[s.barcode] ||= new Set()).add(m.label || m.machineId);
    }
  }
  const out: Record<string, string[]> = {};
  for (const k of Object.keys(map)) out[k] = [...map[k]];
  return out;
}

export default function ProductCatalogSales() {
  const carriers = buildCarriers();

  return (
    <div className="shell">
      <Sidebar active="product-catalog-sales" />
      <main className="main">
        <div className="deptpage" style={{ ['--c' as string]: COLOR, maxWidth: 1200 }}>
          <div className="crumb"><Link href="/">Command Center</Link> / OPERATIONS</div>
          <h1>Product Catalog &amp; Sales</h1>
          <p className="blurb">The master product list — identity, image, description, pricing, supplier. Products live here once, then get placed into planogram templates.</p>

          <div className="banner" style={{ border: '1px solid rgba(0,255,170,.35)', background: 'rgba(0,255,170,.07)', color: '#a7ffdc' }}>
            <b>44 products loaded from your fleet.</b> Open any product to add its <b>image and description</b>, set category, cost, and supplier. Image + description flow into the <Link href="/templates-config" style={{ color: '#7dffc8' }}>planograms</Link> and the machine displays.
          </div>

          <CatalogBoard carriers={carriers} />

          <div className="section" style={{ marginTop: 18 }}>
            <h3>Coming next on this page <span className="ph-tag">after images</span></h3>
            <p>The OurVend add-product form is mapped (code, name, specs, price, supplier, type + image) to push new products to the machines, plus the live sales feed (per-transaction records) and cost/margin math.</p>
          </div>

          <h2 className="scope-heading">Full department scope</h2>
          <ScopeMap id="product-catalog-sales" />
        </div>
      </main>
    </div>
  );
}
