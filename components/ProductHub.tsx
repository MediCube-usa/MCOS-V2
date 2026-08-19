'use client';

import { useState } from 'react';
import { CatalogBoard } from '@/components/CatalogBoard';
import { RequestedBoard } from '@/components/RequestedBoard';
import { SupplierLinks } from '@/components/SupplierLinks';
import { CoilMap } from '@/components/CoilMap';

const TABS = [
  { id: 'products', label: 'Products' },
  { id: 'requested', label: 'Requested' },
  { id: 'shop', label: 'Shop / Suppliers' },
  { id: 'coils', label: 'Coil Setup' },
  { id: 'sales', label: 'Sales' },
] as const;

type TabId = typeof TABS[number]['id'];

export function ProductHub({ carriers }: { carriers: Record<string, string[]> }) {
  const [tab, setTab] = useState<TabId>('products');

  return (
    <div>
      <div className="hub-tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`hub-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'products' && <CatalogBoard carriers={carriers} />}
      {tab === 'requested' && <RequestedBoard />}
      {tab === 'shop' && <SupplierLinks />}
      {tab === 'coils' && <CoilMap />}
      {tab === 'sales' && (
        <div>
          <p className="hub-note"><b>What this tab will show, per product:</b> how many we sell in total, where it
            sells and where it does not, cost vs. sell price and margin, sell-through velocity — the numbers behind
            promos, launches and pre-orders.</p>
          <div className="banner building">
            <b>Sales feed not connected yet.</b> Our sync reads current stock snapshots (every 20 min), not
            transactions, so totals can&apos;t be generated honestly today. The next data build on this block is a
            read-only OurVend <b>Sales Report reader</b> (same pattern as the slot + catalog readers) — once it&apos;s
            in, every product card gets its sold-total and where-it-sells breakdown automatically.
          </div>
          <div className="section">
            <h3>Available today</h3>
            <p>Cost, sell price and which machines carry each product are already on the <b>Products</b> tab
              (open any product). Stock movement between syncs is visible on the Inventory block.</p>
          </div>
        </div>
      )}
    </div>
  );
}
