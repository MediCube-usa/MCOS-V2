import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { ScopeMap } from '@/components/ScopeMap';
import { ProductHub } from '@/components/ProductHub';
import { FLEET } from '@/lib/fleet';
import { AtlasDock } from '@/components/AtlasDock';

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
          <AtlasDock dept="product-catalog-sales" />
          <div className="crumb"><Link href="/">Command Center</Link> / OPERATIONS</div>
          <h1>Product Catalog &amp; Sales</h1>
          <p className="blurb">The product hub — everything to do with products, sales, research and promo
            decisions lives here. Build and assess products, shop the suppliers, track requested products,
            check what fits which coil. Products exist here first; planogram templates (on the
            <Link href="/templates-config" style={{ color: '#7dffc8' }}> Templates block</Link>) consume them.</p>


          <ProductHub carriers={carriers} />

          <h2 className="scope-heading">Full department scope</h2>
          <ScopeMap id="product-catalog-sales" />
        </div>
      </main>
    </div>
  );
}
