'use client';

import { useState } from 'react';
import { CatalogBoard } from '@/components/CatalogBoard';
import { RequestedBoard } from '@/components/RequestedBoard';
import { SupplierLinks } from '@/components/SupplierLinks';
import { CoilMap } from '@/components/CoilMap';
import { SalesBoard } from '@/components/SalesBoard';

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
      {tab === 'sales' && <SalesBoard />}
    </div>
  );
}
