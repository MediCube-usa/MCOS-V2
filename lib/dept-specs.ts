// Full scope map for every department — the plan on the page, so the team sees
// exactly what each department owns, how it flows, what it connects to, and what
// is left to build. Sourced from the MCOS-V2 page specs and department matrix.
// Edit here to reshape any department's scope; the department page renders it.

export interface DeptSpec {
  purpose: string;
  owns: string[];        // data / records this department is the source of truth for
  workflow: string[];    // the main flow, in order
  connects: string[];    // department ids it hands off to / reads from
  toBuild: string[];     // concrete pieces still to build
}

export const DEPT_SPECS: Record<string, DeptSpec> = {
  'machine-operations': {
    purpose: 'Private page for every active machine — status, prices, slots, access, service history.',
    owns: ['machine identity & status', 'placement / access references', 'machine alerts', 'service & damage history'],
    workflow: ['open machine', 'view slots/prices/stock', 'change price or product (confirmed via sync flag)', 'request service or restock'],
    connects: ['facilities', 'inventory', 'restocking', 'templates-config', 'payments', 'maps-distribution'],
    toBuild: ['live auto-refresh (needs OurVend login)', 'in-page price/product edit', 'service request flow', 'alerts feed']
  },
  'inventory': {
    purpose: 'Source of truth for what is stocked where. Decides what is needed; Restocking executes.',
    owns: ['active slot stock', 'machine & closet storage stock', 'in-transit stock', 'reorder / refill thresholds', 'product velocity'],
    workflow: ['read live stock', 'detect low slots (real capacity only)', 'bundle need location-wide', 'signal Restocking / Purchasing'],
    connects: ['product-catalog-sales', 'machine-operations', 'restocking', 'warehouse-purchasing'],
    toBuild: ['real per-slot capacities entered', 'sell-through velocity from sales feed', 'reorder trigger math', 'manual count + adjustment log']
  },
  'restocking': {
    purpose: 'Field execution — get a person to the machine, track proof, update stock when done.',
    owns: ['restock tasks & work orders', 'refiller assignment', 'access/key process', 'photo proof & checklist', 'exceptions'],
    workflow: ['task drafted from inventory', 'assign refiller', 'notify + send access code', 'refill', 'upload proof', 'inventory updates'],
    connects: ['inventory', 'machine-operations', 'facilities', 'contacts', 'maps-distribution'],
    toBuild: ['refiller contact records', 'push notification (dev)', 'one-time access code (dev)', 'proof upload', 'monthly refiller accounting', 'training videos']
  },
  'product-catalog-sales': {
    purpose: 'Master product database. Products exist here before being assigned anywhere.',
    owns: ['product identity & SKU', 'images', 'cost / price / margin', 'supplier item numbers', 'restrictions & substitutes'],
    workflow: ['add / edit product', 'attach image & supplier', 'set default capacity/threshold', 'assign to templates'],
    connects: ['templates-config', 'inventory', 'warehouse-purchasing', 'finance', 'machine-operations'],
    toBuild: ['add-product form (OurVend mapped)', 'image upload', 'live sales feed', 'cost/margin fields', 'substitute mapping']
  },
  'setup-distribution': {
    purpose: 'Pre-live machine lifecycle — from TCN order through shipping, placement, and go-live.',
    owns: ['machine orders & TCN contacts', 'shipping / import / port status', 'delivery schedule', 'setup checklist', 'go-live approval'],
    workflow: ['order machine', 'track shipping → port → warehouse', 'assign facility & schedule delivery', 'place & connect', 'load template & initial stock', 'verify → go live'],
    connects: ['facilities', 'documents', 'templates-config', 'inventory', 'payments', 'machine-operations', 'maps-distribution'],
    toBuild: ['order & shipping tracker', 'logistics contacts (Brendamour, warehouse)', 'go-live checklist', 'setup photos/proof']
  },
  'templates-config': {
    purpose: 'Reusable machine layouts — which product sits in which slot. Templates define intended contents.',
    owns: ['templates & versions', 'slot layout & linked slots', 'product-slot assignments', 'price/capacity per slot', 'facility restriction overrides'],
    workflow: ['build template', 'assign products from catalog', 'set linked slots & pricing', 'approve', 'assign to machine at setup'],
    connects: ['product-catalog-sales', 'machine-setup', 'machine-operations', 'inventory', 'facilities'],
    toBuild: ['visual template builder', 'linked-slot handling', 'facility restriction overrides (e.g. no Plan B)', 'version approval']
  },
  'maps-distribution': {
    purpose: 'Private machine map — every machine pinned by location, with field-safe route cards.',
    owns: ['machine GPS & placement photos', 'facility locations', 'field-safe route/delivery instructions'],
    workflow: ['pin machine location', 'attach placement photo', 'plan restock/delivery route', 'share field card to refiller'],
    connects: ['facilities', 'machine-operations', 'restocking', 'machine-setup'],
    toBuild: ['Google Maps integration', 'placement photos', 'route planner', 'field-safe vs full-view permissions']
  },
  'facilities': {
    purpose: 'Master record & rule center for each campus — not just an address.',
    owns: ['facility profile & location', 'contacts by role', 'reporting & payment rules', 'restrictions', 'delivery/setup instructions'],
    workflow: ['create facility', 'link contacts by role', 'set rules (reporting, restrictions, promo)', 'other departments read these rules'],
    connects: ['contacts', 'documents', 'machine-setup', 'machine-operations', 'inventory', 'restocking', 'marketing-outreach'],
    toBuild: ['facility profiles', 'rule fields (reporting/restriction/promo)', 'contact links', 'facility calendar/events']
  },
  'warehouse-purchasing': {
    purpose: 'Supplier ordering & receiving. Triggered by inventory rules, not one random low slot.',
    owns: ['purchase recommendations & orders', 'supplier & item numbers', 'in-transit & receiving status', 'campus-closet deliveries'],
    workflow: ['inventory signals need', 'bundle economic order', 'approve purchase', 'track shipment → receiving', 'stock into closet/machine'],
    connects: ['product-catalog-sales', 'inventory', 'finance', 'documents', 'facilities'],
    toBuild: ['supplier records & item numbers', 'reorder recommendation engine', 'PO approval flow', 'receiving confirmation']
  },
  'payments': {
    purpose: 'Card-reader providers & their sales reporting. Card sales only — no voucher logic here.',
    owns: ['provider accounts (Nayax/Cantaloupe/Preva)', 'reader-to-machine mapping', 'settlement & fees', 'support tickets'],
    workflow: ['map reader to machine', 'pull provider sales', 'reconcile settlement', 'route finance items'],
    connects: ['machine-operations', 'finance', 'facilities'],
    toBuild: ['provider integrations', 'reader-machine map', 'settlement reconciliation', 'support ticket log']
  },
  'documents': {
    purpose: 'Secure control center for contracts, licenses, compliance, and corporate records.',
    owns: ['document records & status', 'contract & license deadlines', 'signed/unsigned state', 'secure-vault references'],
    workflow: ['upload / create from template', 'send for signature (DocuSign)', 'store signed', 'expiry/renewal alerts', 'rules flow to other departments'],
    connects: ['facilities', 'finance', 'machine-setup', 'warehouse-purchasing'],
    toBuild: ['document store & categories', 'expiry/renewal alerts', 'DocuSign flow', 'secure-vault link (no raw secrets in dashboard)']
  },
  'finance': {
    purpose: 'Private money operations. QuickBooks is the accounting backbone. Contracts create rules; Finance executes.',
    owns: ['QuickBooks connection', 'orders, invoices, fees, taxes', 'payouts (restocker/Aramark/facility)', 'profitability (machine/facility/product)'],
    workflow: ['pull costs & income', 'track payouts', 'watch profitability', 'prepare approvals before money moves'],
    connects: ['warehouse-purchasing', 'payments', 'documents', 'facilities'],
    toBuild: ['QuickBooks integration', 'payout records', 'profitability views', 'approval-before-payment gate']
  },
  'marketing-outreach': {
    purpose: 'School launches, announcements, and new-facility onboarding.',
    owns: ['launch communications', 'outreach campaigns', 'announcement instructions', 'new-school onboarding status'],
    workflow: ['read facility launch rules', 'draft announcement', 'schedule to launch date', 'track outreach'],
    connects: ['facilities', 'contacts', 'documents'],
    toBuild: ['announcement templates', 'campaign tracker', 'tie messaging to facility go-live']
  },
  'contacts': {
    purpose: 'Central company directory. Every contact lives once, linked by role.',
    owns: ['contact profiles & roles', 'facility/vendor/machine relationships', 'verification status'],
    workflow: ['add contact once', 'assign role', 'link to facility/vendor/machine', 'verify'],
    connects: ['facilities', 'restocking', 'machine-setup', 'documents', 'marketing-outreach'],
    toBuild: ['contact database', 'role linking', 'dedupe & verification']
  },
  'vouchers': {
    purpose: 'MCOS-controlled voucher programs & redemption. PARKED — shell only, added later.',
    owns: ['(planned) voucher programs, eligibility, redemption ledger, impact events'],
    workflow: ['(planned) issue code → machine verifies → dispense → ledger → impact report'],
    connects: ['machine-operations', 'inventory', 'product-catalog-sales', 'finance'],
    toBuild: ['everything — parked until the redemption path is proven at a machine']
  },
  'video-ads': {
    purpose: 'On-screen advertising & media on the machine screen. PARKED — dev is building delivery.',
    owns: ['(planned) screen media per machine/facility'],
    workflow: ['(planned) upload media → push to machine screen folder'],
    connects: ['machine-operations', 'facilities'],
    toBuild: ['everything — not available through OurVend; needs on-machine file delivery (dev)']
  }
};
