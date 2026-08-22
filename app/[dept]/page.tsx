import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { DEPARTMENTS, getDepartment } from '@/lib/departments';
import { ScopeMap } from '@/components/ScopeMap';
import { AgentBadge } from '@/components/AgentBadge';
import { BlockAlerts } from '@/components/BlockAlerts';
import { AtlasDock } from '@/components/AtlasDock';

// Departments that have their own custom page file (app/<id>/page.tsx). The
// generic [dept] route must NOT pre-generate these, or it shadows the real page.
const CUSTOM_PAGES = new Set([
  'machine-operations', 'inventory', 'restocking', 'product-catalog-sales',
  'maps-distribution', 'setup-distribution', 'templates-config',
  'facilities', 'contacts', 'warehouse-purchasing', 'documents', 'marketing-outreach'
]);

export function generateStaticParams() {
  return DEPARTMENTS
    .filter((d) => d.id !== 'command-center' && !CUSTOM_PAGES.has(d.id))
    .map((d) => ({ dept: d.id }));
}

// Real starter content for the departments whose data layer already works.
// Everything else gets an honest scaffold so nothing looks more finished than it is.
const READY_SECTIONS: Record<string, { h: string; p: string }[]> = {
  'machine-operations': [
    { h: 'Fleet roster', p: '14 machines across ASU, UNLV, CSUDH, Murad, plus 4 unassigned. Read live from OurVend.' },
    { h: 'Per-machine detail', p: 'Status, slot layout, prices, stock — every slot, read and (proven) writable through OurVend.' },
    { h: 'Price & slot changes', p: 'Change a price or product from here. Every change is confirmed against the machine sync flag before it counts as done.' },
    { h: 'Sync status', p: 'The DsiIsDownLoad marker shows, per slot, whether a change has reached the machine yet.' }
  ],
  'inventory': [
    { h: 'Live stock', p: 'Current count and capacity for every slot on every machine, one pull.' },
    { h: 'Low-stock signals', p: 'Flags slots below threshold. Note: capacity is a factory default on several machines — real capacities needed before percentage alerts are trustworthy.' },
    { h: 'Reorder logic', p: 'Bundles need location-wide before triggering a purchase, not one random low slot.' }
  ],
  'product-catalog-sales': [
    { h: 'Catalog', p: '44 products pulled from the live fleet — GUID, name, both prices, image path, which machines carry each.' },
    { h: 'Add product', p: 'OurVend add-product form is mapped (code, name, specs, price, supplier, type + image). Ready to wire.' },
    { h: 'Sales', p: 'Individual transaction records available — machine, slot, product, amount charged. Customers pay the Machine Price (evidenced).' }
  ],
  'restocking': [
    { h: 'Task queue', p: 'Restock tasks from inventory need through assignment, arrival, refill, proof, close.' },
    { h: 'Refiller dispatch', p: 'Assign a refiller and send the work order.' },
    { h: 'App features (coming)', p: 'Push notification to the refiller and a one-time access code to open the machine — placeholders below, your dev builds the delivery.' }
  ]
};

export default async function DepartmentPage({ params }: { params: Promise<{ dept: string }> }) {
  const { dept } = await params;
  const d = getDepartment(dept);
  if (!d || d.id === 'command-center') notFound();

  const sections = READY_SECTIONS[d.id] ?? [];

  return (
    <div className="shell">
      <Sidebar active={d.id} />
      <main className="main">
        <div className="deptpage" style={{ ['--c' as string]: d.color }}>
          <AtlasDock dept={d.id} />
          <div className="crumb"><Link href="/">Command Center</Link> / {d.group}</div>
          <h1>{d.name}</h1>
          <p className="blurb">{d.blurb}</p>

          <BlockAlerts dept={d.id} />

          {d.status === 'building' && (
            <div className="banner building">⚙ In development — scope is mapped below so the whole team sees what belongs here. Working sections get built out next.</div>
          )}
          {d.status === 'shell' && (
            <div className="banner shell">◱ Shell only — parked on purpose. Scope is mapped below so nobody builds it elsewhere by mistake; no details built yet.</div>
          )}

          {sections.map((s) => (
            <div className="section" key={s.h}>
              <h3>{s.h}</h3>
              <p>{s.p}</p>
            </div>
          ))}

          {d.id === 'restocking' && (
            <div className="section">
              <h3>Refiller actions</h3>
              <p>These sit where your dev&apos;s notification and access system will plug in.</p>
              <span className="ph-btn">🔔 Notify refiller <span className="ph-tag">coming</span></span>
              <span className="ph-btn">🔒 Send access code <span className="ph-tag">coming</span></span>
            </div>
          )}

          {/* Full scope map — shown on every department so the whole plan is visible. */}
          <ScopeMap id={d.id} />

          <div className="section owner-line owner-row">
            {d.agent && d.agent !== '—' && <AgentBadge name={d.agent} color={d.color} size={40} sub={d.hasAgent ? 'live agent' : 'badge'} />}
            <div>
              <h3>Owner</h3>
              <p>{d.hasAgent ? `${d.agent} runs this department's live logic.` : `${d.agent} is this department's agent. The Command Center agent (Atlas) reaches in here until a dedicated one is earned.`}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
