# Source Capture: Block Decisions — 2026-08-11

Verbatim capture of Jordan's block-by-block working session. **Do not edit this
file.** It is the authority for the changes applied elsewhere in this repo on
this date; if a page spec and this file disagree, this file is right and the
page spec is stale.

Integration notes, conflicts, and what is still open:
`04-build-tasks/2026-08-11-integration-map.md`

---

# MCOS 2 Blueprint — Today's Confirmed Decisions

Everything below was worked through block by block today. Paste each section into
its matching file in the repo. 12 of ~18 blocks are fully settled; the rest are
listed at the end with exactly what's still open.

---

## Command Center (locked)

- Left sidebar. Floating blocks show live alerts on the face; opening one gives the
  full department workflow, not a preview.
- Command Center Agent (ATLAS) sits top-right, where the logo is now — connects to
  every block; each block's own agent reports up to it.
- Which AI actually runs the Command Center Agent role is still open — deliberately
  deferred until every block is laid out.
- Stack: DigitalOcean (server) + Supabase (data) + GitHub (blueprint/code). **Vercel
  is out, permanently.**

## Agent Management (locked)

- Meta-layer for viewing/configuring/duplicating/assigning agents — not where agents
  live day to day.
- **Key rule:** agents do not own data. Central MCOS/Supabase is the one source of
  truth. An agent is skillset + workflow + instructions only — nothing else. This is
  what makes a block duplicatable/templatable/leasable: copy the agent config, point
  it at a fresh empty data space, no live business data drags along.
- Template = the agent's skillset, info, workflow, task specialization — the
  upgradable part.
- Human names are deliberate — used when talking to Aramark, schools, partners, to
  project a real team even though it's agents. Draft names exist: Ava (Inventory),
  Marcus (Restocking), Jeff (Machine Ops), Derek (Setup), Tessa (Templates).

## Product Catalog (scope grew — rename to reflect it)

- Master product record (price/description/image) **plus** sales velocity and demand
  tracking per machine and per location type (dorm / gym / campus-general /
  VA-military-stadium — this taxonomy recurs everywhere).
- Owns the row-swap signal (if one item is outselling, add a row before an early
  costly refill) — feeds Restocking's trigger, doesn't decide it.
- Sourcing: purchased vs. donated need different fields — donated has no purchase
  cost but still needs a cost basis for margin/Impact billing.
- **One sole-authority agent** — only this agent shops, sources images, fills catalog
  entries, feeds templates and orders. Single source of truth for product placement.
  Templates can only pull from catalog, never free-type a new product.
- Vouchers/Impact/campaigns/promotions/product-request-voting do **not** belong here
  — moved to a separate Vouchers/Impact/Campaigns block.

## Inventory (locked)

- "Inventory decides what is needed and where. Restocking executes the field task."
- Inventory never sends lock codes or dispatches anyone — that's entirely Restocking.
- Reads Product Catalog's velocity data to decide refill vs. reorder.
- Composite-trigger principle: never dispatch for 2–3 isolated low slots — needs a
  location-wide threshold.

## Restocking (the core differentiator — treat with real care)

- **Not an employee model.** A routing layer over whichever channel already serves a
  facility: Aramark campuses → Aramark's own assigned person, paid through the
  existing Aramark contract (MCOS never touches that money). Sodexo → same pattern.
  Non-university → InstaWork (routes and pays). Student-initiative campuses → two
  designated people per campus, MediCube's own program, still paid through InstaWork.
- The facility record stores which channel a given campus uses; Restocking reads it,
  doesn't own it.
- **Confirmed workflow:** day-before notify → they verify and get the map → day-of
  they confirm presence (text/QR) → push to Restocking Agent → agent generates a
  digital lock code, sends it (no physical keys, ever) → they open the door (agent
  sees it) → refill via the on-machine app, entered under their name → door-closed +
  inventory-updated verification → confirmation email → records update.
- Shipment side: Catalog signals → Inventory decides/triggers → Restocking executes
  fulfillment. CC readers ship with machines from warehouse, matched per-location in
  advance.
- The machine already has a native refill app (log in, tap slot, refill) — confirmed
  by testing. Reference apps if needed: Nayax MoMa (product map + picklist, can
  pre-build a picklist ahead of a visit using predicted usage) and Cantaloupe Seed
  Driver (par/cap/pick/spoil on one screen, shows only slots needing attention,
  barcode scan to enter inventory, photo/video audit per stop). Plan: build a custom
  app combining the best of both, eventually opened to any gig worker as its own
  market.
- **Lock hardware in evaluation:** MK221 — zinc alloy, runs 5G + cloud + Bluetooth
  together (not Bluetooth-only), 1-second unlock, ships with a mechanical emergency
  backup key. The 5G/cloud layer means the lock can potentially report its own
  open/close events straight to the backend, independent of the refiller's phone.
- Met with a national gig-workforce company (details pending) as a second channel
  alongside InstaWork.

## Machine Operations (locked)

- **Two agents, one block.** Agent 1 (Jeff): live status, health, alerts, service
  coordination, template changes, connectivity. Agent 2 (unnamed): destination/growth
  mission — explicitly *not* monitoring. Tracks new apps, gaming, tech features across
  machines and locations to find what makes a machine a destination people seek out,
  rather than relying on impulse/passing traffic like every other vending operator.
- Distinct from Setup & Distribution (pre-live, one-time journey) — this block is the
  live/ongoing picture; setup history stays visible here after handoff.

## Machine Setup & Distribution (locked)

- Pre-live lifecycle, TCN-coordinated. White machines need extra lead time. No
  refrigeration currently; stay flexible for future machine types.
- Digital locks are built and sent **to TCN before shipping**, not installed after
  delivery. CC readers pre-ordered to warehouse, matched per-destination in advance.
- Shipping route: China → LA port → Brendamour → warehouse (minimal handling) →
  final location. Tracked on the calendar at each real milestone.
- **Confirmed sequence:** machine ships before its exact on-campus spot is known →
  arrives, installed (router + internet on) → photo/info sent → MediCube assigns the
  real machine ID tied to confirmed placement → labeled → **only now** does Templates
  & Configuration pick the template → initial order + fill → decals → announcements.
- Go-live on MediCube's end: label + connect the CC reader, log in and confirm
  inventory/sales reporting is live (possibly automatable via the Nayax API).
  Handoff to Machine Operations = "turned on, connected, ID'd, template assigned."

## Machine Templates & Configuration (locked)

- Template is chosen only after a machine's real placement is confirmed, pulling
  only from Product Catalog's approved products.
- Linked/double-wide coil slots count as one product position.
- Facility-level restrictions (e.g., a school banning a product) are handled as an
  override that swaps the product without touching the base template.

## Facilities (major expansion — now a rule center other blocks read from)

- Contract type field: who's the actual contract with — Aramark, Sodexo, direct,
  sponsored — determines both the Restocking channel and MediCube's point contact.
- Structured contact roles (not generic "contacts"), pulled from the one central
  contact database, filtered to this facility: administrator, staff, student affairs,
  risk mitigation, student groups, outreach, university newspaper, student radio, and
  **the refiller as its own distinct role.** List stays open-ended.
- Real compliance checklist: retail license, insurance, any required documentation —
  shows incomplete/red status if missing before a machine ships there.
- Structured product restrictions (product/category + reason), read programmatically
  by Templates & Config to auto-apply overrides.
- Facility-profile section: culture, preferences, population data — context, separate
  from hard rules.
- Special requests stay flexible/open text (military clearance, hotel requirements) —
  not predictable in advance.

## Documents / Contracts / Compliance / Secure Vault (locked)

- The single real storage layer for: facility contracts, SAFE/investor agreements,
  insurance, resale licenses, OTC licensing, ad agreements, compliance paperwork,
  grant applications, nonprofit agreements, school contracts, endorsement agreements,
  purchase orders, TCN invoices, port fees, delivery costs, InstaWork agreements —
  plus LLC/corporate formation docs, bank and credit card info, collaboration
  agreements, internal documents.
- **Resolves the Facilities overlap:** this block holds the one real copy of every
  document; Facilities only shows status filtered to that campus.
- Bank/card info specifically needs tiered access — track that it exists and when it
  needs attention, without displaying raw numbers on a page anyone with Documents
  access could open.

## Payments / Card Readers (locked)

- Reader assignment follows location and campus-card usage, with parameters he sets.
- Every machine has its own service login on file — full connection/troubleshooting
  info and direct log access from here, not through the reader company's own portal.
- Refunds and auto-fixes where safe. Inventory-vs-reader cross-check as the honesty
  layer (catching the kind of stock/reader mismatch that's easy to miss otherwise).
- Event-linked payout reports, distinct from standard recurring reports. Provider-
  service awareness — knows what Nayax/Cantaloupe offer beyond the reader itself
  (POS handhelds, other services) so decisions aren't made blind later.

## Finance / Accounting / Payouts / QuickBooks (locked, one open item)

- One Finance agent, broad visibility: sales, purchases, port costs, fees, card
  processing, contractor payments, shipping, marketing spend, promo expenses,
  software costs, taxes, reader costs, voucher numbers — can calculate voucher
  reimbursements and handle recurring bills.
- **Open question, needs a direct answer:** does Finance only *track and report* on
  restocker/Aramark payouts for MediCube's own books (money still physically flows
  through InstaWork/Aramark's own systems, per Restocking), or does Finance actually
  *execute* those payments? These need to be consistent — Restocking already
  confirmed MCOS doesn't touch that money.

## Marketing / Outreach (one block, will grow — do not split yet)

- **Maya** — on-screen AI persona, the anchor and starting point. Actively engages
  anyone passing by, captures email/phone via QR sign-up. From there: free-item
  applications, promos, product voting/requests, and a "text me if/where this item
  is available" lookup.
- Social/ad agent, same two-part pattern as Machine Ops: an autonomous side (finds
  what works for a demographic/location, posts on a defined calendar, MediCube's
  own products get priority) and a manual override (direct task bar).
- Ad-slot marketplace: replaces the expensive, manual campus kiosk-rental system.
  Student groups/departments request → approved → scheduled → billed → eventually
  automatic proof-of-play. Same engine scales later to concerts/stadiums.
- Sponsor/brand partnerships (named interest: J&J, MGM) — **hard rule: a company
  can't just buy visibility, they need actual product placement in the machine.**
- Telehealth ads — flagged as a real future category, not designed yet.
- Growth order: Maya live first (engagement is the actual goal), then ad automation,
  then the kiosk-rental replacement, then sponsorships — added gradually.

## Contacts / Central Company Directory (locked)

- MediCube's full internal relationship book — not limited to facility-linked
  people. Covers delivery contacts, maintenance, refillers, every school reached out
  to (whether or not it worked out), parents, donors, sponsors, governments,
  military bases, hotels, alumni.
- **Critical exclusion:** students/clients who sign up through the machines (Maya's
  leads) are a separate database, owned by Marketing. Don't merge them.
- Agent labels/categorizes continuously, runs active outreach tasks (gather contacts
  for a specific school), can draft/send emails, answer the company phone, send SMS.

## Calendar / Logistics (locked — treat as a hard technical block)

- **Correction from an earlier assumption:** this is not the expanded view of the
  header's calendar — it's the reverse. This is the real backbone; the header
  element is a small window into it.
- Every appointment type in one place: deliveries, shipments, personal appointments,
  events, campaigns, overseas purchase milestones.
- Alerts/reminders on every appointment regardless of source — entered directly, or
  pulled from email. **Real technical dependency: needs actual email integration**,
  not just manually-entered events.
- Actively pushes updates to him and his partner — not passive.

---

## Still open — not yet formally walked

- **Vouchers / Impact / Redemption Ledger** — largely pre-resolved already (see the
  separate Impact boundary notes): MCOS only checks Impact's API for eligibility,
  dispenses, logs a separate non-commissionable record. Color-coded voucher
  categories map to specific rows/slot groups. Still blocked on one real technical
  gap: no confirmed safe way yet to trigger a dispense outside the payment flow.
- **Screen Access / Digital Platform** — mostly folded into Marketing above; the
  remaining piece is the technical delivery layer (relay + agent), separate from the
  business design already settled.
- **Maps / Machine Locator** — genuinely open. Needs the field-safe vs. sensitive-
  data permission split worked out (a restocker's map view shouldn't show financial
  data).
- **Reporting / Compliance / Billing / Payouts** — self-declares as an assembly
  layer only (never owns data, pulls from Facilities/Documents/Finance/Payments/
  Vouchers). Inherits the same open question as Finance — settle that first.
- **Vouchers / Refunds / Customer Service** — cleanest of what's left. Already
  separates itself from the ledger above (program rules and ledger stay there; this
  is customer-facing exceptions only — failed dispenses, refunds, support tickets).

---

## Standing rules for whoever builds from this

- Every block's agent-config vs. data-ownership split follows Agent Management's
  rule: agents never own data, Supabase does.
- Location-type (dorm/gym/campus-general/VA-military-stadium) is a taxonomy that
  recurs across Catalog, Facilities, and Templates — should be one shared reference,
  not duplicated per block.
- Every machine-facing action goes through a job queue, picked up by the on-machine
  agent on its next check-in — nothing is synchronous. Build every "do X to a
  machine" button as create-job → pending → confirmed.
