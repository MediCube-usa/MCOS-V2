// ─────────────────────────────────────────────────────────────────────────────
// THE DEPARTMENT LIST — this one file controls the whole dashboard.
//
// Add, remove, rename, recolor, or re-status a department here and it updates
// everywhere: the sidebar, the Command Center blocks, and its own page. No other
// file needs touching to change the shape of MCOS.
//
// status:
//   'ready'    fully in use, real work happens here
//   'building' page exists, actively being built out
//   'shell'    parked on purpose — visible but intentionally empty (added later)
//
// hasAgent: true only where a department runs its own live agent. Most do not —
//   the Command Center agent (Atlas) reaches into the rest. The badge still shows
//   for consistency, but only these four actually run logic.
// ─────────────────────────────────────────────────────────────────────────────

export type DeptStatus = 'ready' | 'building' | 'shell';

export interface Department {
  id: string;            // url slug, e.g. /inventory
  name: string;
  group: 'OVERVIEW' | 'OPERATIONS' | 'COMPANY' | 'GROWTH' | 'PARKED';
  color: string;         // neon outline color
  agent: string;         // badge name
  hasAgent: boolean;     // runs live logic vs. just a badge
  status: DeptStatus;
  metric: string;        // headline number on the block
  metricLabel: string;   // what the number means
  blurb: string;         // one line shown on the department page
}

export const DEPARTMENTS: Department[] = [
  // ── OVERVIEW ──
  { id: 'command-center', name: 'Command Center', group: 'OVERVIEW', color: '#ffffff',
    agent: 'Atlas', hasAgent: true, status: 'ready',
    metric: 'Live', metricLabel: 'National command layer',
    blurb: 'Executive view of the whole company. Every department reports up here.' },

  // ── OPERATIONS ──
  { id: 'product-catalog-sales', name: 'Product Catalog & Sales', group: 'OPERATIONS', color: '#00ffaa',
    agent: 'Vesta', hasAgent: false, status: 'ready',
    metric: '44', metricLabel: 'products in catalog',
    blurb: 'Master product list — identity, pricing, images, suppliers. Pulled live from the fleet.' },
  { id: 'inventory', name: 'Inventory', group: 'OPERATIONS', color: '#ff8c1a',
    agent: 'Orion', hasAgent: true, status: 'ready',
    metric: '—', metricLabel: 'stock signals',
    blurb: 'What is stocked where, across every machine. Decides what is needed.' },
  { id: 'restocking', name: 'Restocking', group: 'OPERATIONS', color: '#caff00',
    agent: 'Marcus', hasAgent: true, status: 'ready',
    metric: '—', metricLabel: 'open tasks',
    blurb: 'Field work — assign refillers, send tasks, track proof. Notify + access-code coming.' },
  { id: 'machine-operations', name: 'Machine Operations', group: 'OPERATIONS', color: '#ff3df2',
    agent: 'Nova', hasAgent: true, status: 'ready',
    metric: '14', metricLabel: 'machines tracked',
    blurb: 'Every machine — status, prices, slots. Reads and writes the fleet through OurVend.' },
  { id: 'setup-distribution', name: 'Machine Setup', group: 'OPERATIONS', color: '#ff3b3b',
    agent: 'Derek', hasAgent: false, status: 'building',
    metric: '—', metricLabel: 'in deployment',
    blurb: 'New machines from order through shipping, placement, and go-live.' },
  { id: 'templates-config', name: 'Templates & Config', group: 'OPERATIONS', color: '#8b5cff',
    agent: 'Tessa', hasAgent: false, status: 'building',
    metric: '—', metricLabel: 'layouts',
    blurb: 'Reusable machine layouts — which product sits in which slot.' },

  { id: 'maps-distribution', name: 'Maps & Routes', group: 'OPERATIONS', color: '#2fd2ff',
    agent: 'Scout', hasAgent: false, status: 'building',
    metric: '—', metricLabel: 'machines mapped',
    blurb: 'Every machine pinned by address/GPS with photos and access notes. Share a location to a refiller, plan routes, show students where machines are. Google Maps-backed; agent-managed later.' },

  // ── COMPANY ──
  { id: 'facilities', name: 'Facilities', group: 'COMPANY', color: '#4dff88',
    agent: 'Nova', hasAgent: false, status: 'building',
    metric: '—', metricLabel: 'active locations',
    blurb: 'Each campus and its rules — contacts, reporting, restrictions, access.' },
  { id: 'warehouse-purchasing', name: 'Warehouse & Purchasing', group: 'COMPANY', color: '#3d7cff',
    agent: 'Cole', hasAgent: false, status: 'building',
    metric: '—', metricLabel: 'orders moving',
    blurb: 'Supplier ordering, item numbers, in-transit stock, receiving.' },
  { id: 'payments', name: 'Payments', group: 'COMPANY', color: '#ffd84d',
    agent: 'Coin', hasAgent: false, status: 'building',
    metric: '—', metricLabel: 'card readers',
    blurb: 'Card-reader providers, terminal-to-machine mapping, provider sales.' },
  { id: 'documents', name: 'Documents & Compliance', group: 'COMPANY', color: '#ff66a8',
    agent: 'Quill', hasAgent: false, status: 'building',
    metric: '—', metricLabel: 'need action',
    blurb: 'Contracts, licenses, compliance deadlines, secure-vault references.' },
  { id: 'finance', name: 'Finance & Accounting', group: 'COMPANY', color: '#4d5bff',
    agent: 'Ledger', hasAgent: false, status: 'building',
    metric: '—', metricLabel: 'MTD',
    blurb: 'QuickBooks-backed money operations — costs, payouts, profitability. Private.' },

  // ── GROWTH ──
  { id: 'marketing-outreach', name: 'Marketing & Outreach', group: 'GROWTH', color: '#00ffea',
    agent: 'Maya', hasAgent: false, status: 'building',
    metric: '—', metricLabel: 'prospects',
    blurb: 'School launches, announcements, new-facility onboarding.' },
  { id: 'contacts', name: 'Contacts', group: 'GROWTH', color: '#a6b5ff',
    agent: 'Rolo', hasAgent: false, status: 'building',
    metric: '—', metricLabel: 'directory',
    blurb: 'Central directory — every contact lives once, linked by role.' },

  // ── PARKED (shell blocks — added later on purpose) ──
  { id: 'vouchers', name: 'Vouchers & Programs', group: 'PARKED', color: '#00d9ff',
    agent: '—', hasAgent: false, status: 'shell',
    metric: 'Later', metricLabel: 'parked',
    blurb: 'MCOS-controlled voucher programs and redemption. Shell only — details to come.' },
  { id: 'video-ads', name: 'Video Ads & Screen', group: 'PARKED', color: '#b366ff',
    agent: '—', hasAgent: false, status: 'shell',
    metric: 'Later', metricLabel: 'parked',
    blurb: 'On-screen advertising and media. Shell only — your dev is building the delivery.' },
];

export const GROUP_ORDER = ['OVERVIEW', 'OPERATIONS', 'COMPANY', 'GROWTH', 'PARKED'] as const;

export function getDepartment(id: string) {
  return DEPARTMENTS.find((d) => d.id === id);
}
export function blockDepartments() {
  // everything except the Command Center itself shows as a block
  return DEPARTMENTS.filter((d) => d.id !== 'command-center');
}
