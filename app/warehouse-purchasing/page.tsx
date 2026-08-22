import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { ScopeMap } from '@/components/ScopeMap';
import { RecordBoard, type BoardConfig } from '@/components/RecordBoard';
import { BlockAlerts } from '@/components/BlockAlerts';
import { AtlasDock } from '@/components/AtlasDock';

const COLOR = '#3d7cff';

const CONFIG: BoardConfig = {
  table: 'warehouse_orders',
  color: COLOR,
  statuses: ['recommended', 'approved', 'ordered', 'in_transit', 'received'],
  addPlaceholder: 'What to buy * (e.g. Tide Pods x2 cases)',
  emptyText: 'No purchase orders yet. When Inventory signals a location-wide need, draft the order here and move it recommended → approved → ordered → in-transit → received.',
  subtitleKeys: ['supplier', 'qty', 'eta'],
  fields: [
    { key: 'supplier', label: 'Supplier', type: 'text' },
    { key: 'item_ref', label: 'Supplier item #', type: 'text' },
    { key: 'qty', label: 'Quantity', type: 'text' },
    { key: 'cost', label: 'Est. cost', type: 'text', placeholder: '$' },
    { key: 'eta', label: 'ETA', type: 'date' },
    { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Which machines/closet this restocks, PO number, receiving notes' }
  ]
};

export default function WarehousePurchasing() {
  return (
    <div className="shell">
      <Sidebar active="warehouse-purchasing" />
      <main className="main">
        <div className="deptpage" style={{ ['--c' as string]: COLOR, maxWidth: 1100 }}>
          <AtlasDock dept="warehouse-purchasing" />
          <div className="crumb"><Link href="/">Command Center</Link> / COMPANY</div>
          <h1>Warehouse &amp; Purchasing</h1>
          <p className="blurb">Supplier ordering and receiving — triggered by inventory need, bundled into economic orders, tracked to the shelf.</p>

          <BlockAlerts dept="warehouse-purchasing" />

          <div className="banner" style={{ border: '1px solid rgba(61,124,255,.35)', background: 'rgba(61,124,255,.08)', color: '#b6ccff' }}>
            <b>Track every purchase order to receiving.</b> Draft what to buy, set supplier and item number, then advance the status as it&apos;s approved, ordered, ships, and arrives. Feeds from <Link href="/inventory" style={{ color: '#9cc0ff' }}>Inventory</Link> need.
          </div>

          <RecordBoard config={CONFIG} />

          <div className="section" style={{ marginTop: 18 }}>
            <h3>Coming next on this page <span className="ph-tag">after PO tracking</span></h3>
            <p>Supplier records with item catalogs, a reorder recommendation engine driven by real Inventory velocity, a PO approval gate through <Link href="/finance" style={{ color: '#9cc0ff' }}>Finance</Link>, and receiving that stocks straight into the campus closet or machine.</p>
          </div>

          <h2 className="scope-heading">Full department scope</h2>
          <ScopeMap id="warehouse-purchasing" />
        </div>
      </main>
    </div>
  );
}
