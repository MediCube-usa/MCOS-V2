import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { FLEET, neverSynced } from '@/lib/fleet';
import { ScopeMap } from '@/components/ScopeMap';

export default function ProductCatalog() {
  // Derive the catalog from every stocked slot across the fleet, keyed by product GUID.
  type P = { barcode: string; names: Set<string>; machinePrices: Set<string>; userPrices: Set<string>; placements: number };
  const map = new Map<string, P>();
  for (const m of FLEET.machines) {
    for (const s of m.slots) {
      if (!s.barcode || !s.product) continue;
      let p = map.get(s.barcode);
      if (!p) { p = { barcode: s.barcode, names: new Set(), machinePrices: new Set(), userPrices: new Set(), placements: 0 }; map.set(s.barcode, p); }
      if (s.product) p.names.add(s.product);
      if (!neverSynced(s)) p.machinePrices.add(s.machinePrice);
      if (s.userPrice) p.userPrices.add(s.userPrice);
      p.placements++;
    }
  }
  const products = [...map.values()].map((p) => ({
    barcode: p.barcode,
    name: [...p.names][0] ?? '(unnamed)',
    altNames: [...p.names].slice(1),
    machinePrices: [...p.machinePrices],
    userPrices: [...p.userPrices],
    placements: p.placements
  })).sort((a, b) => a.name.localeCompare(b.name));

  const priceVaries = products.filter((p) => p.machinePrices.length > 1).length;

  return (
    <div className="shell">
      <Sidebar active="product-catalog-sales" />
      <main className="main">
        <div className="deptpage" style={{ ['--c' as string]: '#00ffaa', maxWidth: 1200 }}>
          <div className="crumb"><Link href="/">Command Center</Link> / OPERATIONS</div>
          <h1>Product Catalog & Sales</h1>
          <p className="blurb">Every product across the fleet, keyed by its product ID. This is the master list — products exist here before they are assigned to machines.</p>

          <div className="banner" style={{ border: '1px solid rgba(0,255,170,.3)', background: 'rgba(0,255,170,.06)', color: '#9dffdc' }}>
            {products.length} products derived from the live fleet snapshot. Adding new products (name, code, specs, price, supplier, image) and the sales feed wire up once OurVend auth is captured — the add-product form and sales endpoint are already mapped.
          </div>

          <div className="pills" style={{ justifyContent: 'flex-start', marginBottom: 18 }}>
            <div className="pill">{products.length} products</div>
            <div className="pill">{priceVaries} priced differently by machine</div>
          </div>

          <div className="tablewrap">
            <table className="dtable">
              <thead><tr><th>Product</th><th>Charged price(s)</th><th>Cloud price(s)</th><th style={{ textAlign: 'right' }}>In slots</th></tr></thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.barcode}>
                    <td>{p.name}{p.altNames.length ? <span style={{ color: '#ffc24d', fontSize: 11 }}> · also &ldquo;{p.altNames.join('", "')}&rdquo;</span> : null}</td>
                    <td className="num">{p.machinePrices.length ? p.machinePrices.map((x) => `$${x}`).join(', ') : '—'}{p.machinePrices.length > 1 ? ' *' : ''}</td>
                    <td className="num">{p.userPrices.length ? p.userPrices.map((x) => `$${x}`).join(', ') : '—'}</td>
                    <td className="num" style={{ textAlign: 'right' }}>{p.placements}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="blurb" style={{ marginTop: 14, fontSize: 12.5 }}>
            <b>*</b> marks a product charged different prices on different machines. Your partner has been adjusting these — nothing here is changed, only shown, so you can review.
          </p>

          <h2 className="scope-heading">Full department scope</h2>
          <ScopeMap id="product-catalog-sales" />
        </div>
      </main>
    </div>
  );
}
