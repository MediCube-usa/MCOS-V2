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
    purpose: 'Field execution: alert → accept (or roll to next day) → map card → verify at machine → codes → replenish exactly → photo → filed. Refill never changes prices or slots.',
    owns: ['restock tasks (refill + shipping refill)', 'refiller setup: Instawork / Aramark / student + contacts', 'offer, accept, re-offer scheduling', 'map card delivery (with refill videos/docs)', 'on-site verify → key code + refill code release', 'replenish lists (exact product + amount)', 'photo proof → Drive + email filing'],
    workflow: ['trigger restock → alert refiller with time+date', 'no accept → next day re-offer', 'confirmed → send map card', 'QR/push verify at machine → release key code', 'replenish per screen (refill code from agent)', 'inventory verified → door closed → photo to agent', 'agent files to Google Drive + email → done'],
    connects: ['inventory', 'machine-operations', 'facilities', 'contacts', 'maps-distribution'],
    toBuild: ['agent layer: SMS/push alerts, QR check-in, auto code release, photo intake, auto Drive/email filing', 'at-machine text bot via QR (campus/machine info, contacts)', 'refiller accounting']
  },
  'product-catalog-sales': {
    purpose: 'The product hub — everything products, sales, research and promo decisions. Products exist here first; planograms (Templates block) consume them.',
    owns: ['product identity & SKU', 'images & descriptions (the OurVend gate)', 'cost / price / margin', 'supplier shop links + warehouse contacts + shipping prices', 'requested-products lists (per campus/promo) & demand counts', 'product research (price points, popularity, demographics)', 'the shared 40-coil setup map', 'sales totals & where-it-sells (once the sales feed lands)'],
    workflow: ['shop supplier sites (Weiner’s LTD first)', 'bring product back → Requested list with source/image/description', 'research price & popularity', 'approve → order → add to Products + load into OurVend (image + desc, one at a time)', 'place via Templates block', 'watch sales & promo the requested winners'],
    connects: ['templates-config', 'inventory', 'warehouse-purchasing', 'finance', 'machine-operations', 'marketing-outreach'],
    toBuild: ['OurVend Sales Report reader (read-only) → per-product sold totals', 'agent: shop-site research, pull products in, order assistance (per-action confirm)', 'pre-order / launch staging']
  },
  'setup-distribution': {
    purpose: 'Ordered & distribution — the machine\'s life before it is live: TCN order → port (LA) → Brendamour → warehouse → contract → map card → setup → verified.',
    owns: ['TCN orders (model, qty, color, fridge/non, invoice)', 'purchasing protocol checklist (model/color/locks can change)', 'shipping, port + paperwork, calendar dates', 'Brendamour pickup → warehouse', 'contract → ship to campus', 'MAP CARDS: pinned walk-out location, photos on Google Maps, directions, access times, contacts, follow-ups', 'setup verification: router online, TCN registered, decals'],
    workflow: ['order from TCN (verify model/color/locks)', 'ship → port (mostly Los Angeles), papers + dates', 'Brendamour pickup → warehouse', 'contract signed → ship to campus', 'create + send the map card', 'set up on site: router online, register TCN, decals', 'verified → Machine Operations'],
    connects: ['facilities', 'documents', 'templates-config', 'inventory', 'payments', 'machine-operations', 'maps-distribution'],
    toBuild: ['file uploads for invoice/paperwork/photos', 'calendar sync for ETAs + follow-ups', 'auto-handoff to machines registry on verified']
  },
  'templates-config': {
    purpose: 'Planograms & templates — author layouts on the shared 40-coil grid, flag machine roles, assign to new machines, track go-live. Push = OurVend clone-a-machine ONLY (locked until the clone walkthrough).',
    owns: ['planograms (templates table) & their draft→ready→assigned→live status', 'machine roles registry (live / new / template)', 'planogram↔machine assignment + go-live confirms', 'the clone-only push path (locked)'],
    workflow: ['author planogram from catalog products (the gate)', 'flag machine roles', 'assign to a new machine', 'refill places product + begin count at machine', 'confirm live', 'later: clone template machine in OurVend (per-push OK)'],
    connects: ['product-catalog-sales', 'setup-distribution', 'machine-operations', 'inventory', 'facilities'],
    toBuild: ['reconciliation diff (planogram vs live_slots)', 'clone/push runbook after Joe’s walkthrough', 'facility restriction overrides (e.g. no Plan B)']
  },
  'maps-distribution': {
    purpose: 'Private machine map — every machine pinned by location, with field-safe route cards.',
    owns: ['machine GPS & placement photos', 'facility locations', 'field-safe route/delivery instructions'],
    workflow: ['pin machine location', 'attach placement photo', 'plan restock/delivery route', 'share field card to refiller'],
    connects: ['facilities', 'machine-operations', 'restocking', 'setup-distribution'],
    toBuild: ['Google Maps integration', 'placement photos', 'route planner', 'field-safe vs full-view permissions']
  },
  'facilities': {
    purpose: 'Master record & rule center for each campus — not just an address.',
    owns: ['facility profile & location', 'contacts by role', 'reporting & payment rules', 'restrictions', 'delivery/setup instructions'],
    workflow: ['create facility', 'link contacts by role', 'set rules (reporting, restrictions, promo)', 'other departments read these rules'],
    connects: ['contacts', 'documents', 'setup-distribution', 'machine-operations', 'inventory', 'restocking', 'marketing-outreach'],
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
    connects: ['facilities', 'finance', 'setup-distribution', 'warehouse-purchasing'],
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
    connects: ['facilities', 'restocking', 'setup-distribution', 'documents', 'marketing-outreach'],
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
