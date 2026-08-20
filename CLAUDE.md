# MCOS-V2 — Living Source of Truth (read this first, every session)

This file auto-loads into context. It is the memory. **Keep it updated as we build** —
when a decision is made or a block is finished, edit this file in the same commit.
Details per block live in `docs/blocks/*.md`. When in doubt, the repo + Supabase are the
truth, not chat history.

MCOS is MediCube's operating system: a neon "Command Center" dashboard that runs MediCube's
TCN/Yunshu vending machines. Deployed on **Vercel** (auto-deploys on push to `main`), backed by
**Supabase** (project `negtepvmbkyefvxiakwu`, "MCOS 2v").

**THE LIVE SITE IS https://mcos-v2-site.vercel.app** (Vercel project `mcos-v2-site`, wired to
this repo's `main`). The Vercel project named `mcos-v2` is a STRAY frozen duplicate (3 manual
deploys, no GitHub link, never updates) — do not use its URL; Joe to delete it in the Vercel
dashboard. (This confusion cost a whole evening on 2026-08-19.)

---

## HARD RULES (do not break)
1. **OurVend is THE system.** All catalog, planogram, inventory, price data flows to and from
   OurVend. The push path to machines is **MCOS → OurVend → machine**.
2. **Nayax is SECONDARY.** A few campuses only (e.g. Boston, not yet set up). Never a substitute
   for OurVend, never part-time, never the source or the push path. Do NOT propose switching to
   it. (Nayax Lynx API exists in the old repo but is not used here.)
3. **READ-ONLY against live machines.** These are live, partner-run machines. Never write to a
   machine or change any price/product in OurVend without explicit per-item approval from Joe.
   Reads and writes to our OWN Supabase DB are fine.
4. **Be honest.** No fake-finished. If something isn't built or a test failed, say so. Verify
   with real calls, don't describe. (This has burned trust before — check before claiming.)
5. **Never commit secrets** (OurVend credentials, cookies) to the repo. They live only in the
   Supabase `secrets` table.

## HOW WE WORK
- **Block by block.** For each dashboard block: (a) Joe brain-dumps, (b) write/append its spec
  in `docs/blocks/<block>.md` BEFORE coding, (c) build it, (d) verify live, (e) next block.
- Writing facts to files (this file + `docs/blocks/`) is the anti-forgetting insurance.
- Keep Joe informed as you build. Joe stays in control; don't run ahead without checking in.

---

## THE OURVEND CONNECTION (built, working, permanent)
Fully automated, cloud-side, no browser, no Vercel env. All in **Supabase Edge Functions**
(Deno) + **pg_cron** + **pg_net**. Cookie/credentials never touch the browser.

- **Auth model:** credentials in `secrets` (`ourvend_username`, `ourvend_password`); the live
  session cookie in `secrets.ourvend_cookie`.
- **`ourvend-login`** (edge fn): logs in the way the site does — POST `/Account/GetPubKey` →
  RSA/PKCS#1-v1.5 encrypt password (node-forge = the page's JSEncrypt) → POST `/Account/Login` →
  stores the fresh cookie jar (`aliyungf_tc`, `acw_tc`, `ASP.NET_SessionId`) into secrets.
- **`ourvend-refresh`** (edge fn): reads every slot for the roster via `/Selection/SoltInfo` →
  writes `live_slots`. **Self-heals** (calls `ourvend-login` + retries on session expiry).
- **`ourvend-catalog`** (edge fn): reads Commodity Management `/CommodityInfo/ListJson`
  (Local warehouse `Type=0`, key on `PrID`, images at
  `https://ourvend-image.oss-cn-qingdao.aliyuncs.com/Regular/` + `PrImgUrl`) → upserts
  `products`. **Self-heals** too.
- **Schedules (pg_cron):** `ourvend-fleet-sync` every 20 min (data), `ourvend-auto-login` hourly
  (session), `ourvend-catalog-sync` daily. Data freshness = 20 min.
- **Key OurVend facts:** catalog is the gate — a product needs image+desc in OurVend before it
  can be used in a template, and OurVend takes product images ONLY from the preloaded catalog
  (loaded one at a time). OurVend has NO template object — a "planogram template" = a MACHINE
  cloned onto others (set up a not-in-use machine named "Template"); applying a planogram is
  CLONE ONLY (Joe, confirmed 2026-08-19). Prices can be set at the
  machine (ES folder) and may lag OurVend's cloud price → "differs" flags are expected.
- If Joe changes the OurVend password, update `secrets.ourvend_password` (then run login).

## SUPABASE (project negtepvmbkyefvxiakwu)
- Tables: `live_slots` (fleet slots, ~204), `products` (catalog, 49 — ALL with image+desc since
  2026-08-19 cleanup), `ourvend_sync_log`, `secrets` (RLS-locked), plus block tables
  (`facilities`, `contacts`, `templates`, `setup_machines`, `machine_locations`,
  `warehouse_orders`, `documents`, `campaigns`).
- Edge functions: `ourvend-login`, `ourvend-refresh`, `ourvend-catalog`, `ourvend-sales`
  (sales reader, built+deployed, feed blocked on a one-time browser capture — see
  product-catalog spec), plus utilities `catalog-thumbs` + `ourvend-sales-probe` (read-only,
  no cron, safe to delete).
- Public keys/URLs in `lib/config.ts`. Anon JWT is used by the dashboard Refresh button + crons.

## APP ARCHITECTURE
- Next.js 15 App Router / React 19 / TS on Vercel. Push to `main` → auto-deploy.
- `lib/departments.ts` = single source for the dashboard (sidebar, blocks, statuses).
- `lib/dept-specs.ts` = scope maps shown on every department page.
- `lib/live-slots.ts` = reads `live_slots` (falls back to `lib/fleet-seed.json`), "synced Nm ago".
- Machine Operations + Inventory pages are server-rendered (`force-dynamic`) off `live_slots`.
- Product Catalog uses `components/CatalogBoard.tsx` (reads `products`, shows image+description).
- Site is password-gated (`app/api/login`, `lib/auth.ts`) — separate from OurVend login.

---

## BLOCK STATUS (update as we go)
- **Machine Operations** — live off `live_slots`. ✅ data wired. SPEC v1 captured
  (2026-08-19, `docs/blocks/machine-operations.md`): per-machine record — ID/name/location,
  live planogram + product swap + price change, card reader, connectivity, lock codes, apps,
  maintenance history, OurVend registration. ✅ BUILT (2026-08-19): record card + health strip
  + lockbox generate + service log on the machine detail page (MachineRecord.tsx).
- **Inventory** — live off `live_slots`, low-stock signals. ✅ data wired
- **Product Catalog & Sales** — 49 products, ALL w/ image+description (passes the OurVend
  gate). ✅ SPEC v2 (2026-08-19): the PRODUCT HUB — tabs Products / Requested / Shop-Suppliers
  (Weiner's LTD) / Coil Setup / Sales(feed pending). Planograms moved OFF this block.
  See `docs/blocks/product-catalog.md`.
- **Planograms/Templates** — SPEC v1 locked; **Phases 0–2 BUILT** (2026-08-19, spec in
  `docs/blocks/planograms.md`): `machines` registry (14 seeded w/ real labels + roles) +
  PlanogramsBoard on the Templates block — 40-coil authoring w/ catalog-gated picker,
  assignment, go-live confirm. Phase 3 reconciliation next; Phase 4 push BLOCKED on Joe's
  clone walkthrough.
- **Setup & Distribution** — SPEC v1 + BUILT (2026-08-19, `docs/blocks/setup-distribution.md`):
  Joe's ordered-and-distribution pipeline — TCN order (model/qty/color/fridge-or-non/invoice +
  purchasing protocol) → shipping/port (LA default) + paperwork/dates → Brendamour pickup →
  warehouse → contract → MAP CARD (walk-out location, Google Maps pin, photos, directions,
  access time, contacts, follow-up) → setup (router online, TCN registered, decals) →
  verified (TCN machine_id links to Machine Ops). `setup_machines` extended. LIVE-USE REWORK
  2026-08-20: colored tabs each render their stage's REAL form (no descriptive lists), stage
  panels solid/opaque, invoice + paperwork + signed contract have paste-a-link OR real file
  upload (Storage bucket `mcos-docs`, anon-verified), full-record toggle per machine.
- **Restocking** — SPEC v1 + BUILT (2026-08-19, `docs/blocks/restocking.md`): task pipeline
  (alert → accept/re-offer-next-day → map card → on-site verify → key+refill codes →
  replenish list from live slots → photo → Drive/email filed), refiller setup
  (Instawork/Aramark/student), Shipping-refill tab (campus check-in first, back-storage).
  RULE: refill never changes prices/slots. Agent layer (SMS/QR/text bot/auto filing) specced,
  not built. `restock_tasks` table; machines gained map_card_url + refill videos/docs links.
- Facilities, Warehouse, Payments, Documents, Finance, Marketing, Contacts —
  scaffolded, not deeply built. Vouchers, Video Ads — parked shells.

## OPEN / NEXT
- Planogram Phase 3: reconciliation diff (assigned planogram vs live_slots).
- The MCOS→OurVend→machine WRITE (push) path — needs Joe to confirm the exact "clone a machine"
  steps before any write code (still read-only until then). Product swap / price change
  actions on Machine Ops ride the same unlock.
- Sales: sell-through counter running (slot_history each :05/:25/:45); exact OurVend sales
  grid still gated server-side — optional one-time browser capture would add exact history.
- Joe to fill per-machine: card reader type/portal link, router, lockbox codes, addresses.
- Boston (Nayax) machines: not set up; planograms may only exist on Nayax (secondary, optional).

## SESSION LOG (newest first)
- 2026-08-20: Machine Setup goes LIVE-USE per Joe ("no placeholder examples — I am finishing
  this site"): stage panels made solid/opaque like the landing page (map backdrop no longer
  bleeds through); every colored tab now renders its stage's ACTUAL form — the machine card
  opens straight into that stage's fields, "Show full record" reveals all 8 sections; real
  document uploads for invoice/paperwork/signed contract via new public Storage bucket
  `mcos-docs` (anon upload verified live w/ pg_net, 200) + `setup_machines.contract_url`.
  Browser-verified 13/13 with mocked rows.
- 2026-08-19 (h): BUILT THE MAP CARD on Maps & Routes (docs/blocks/maps.md — every field from
  Joe's dumps: address, Google pin, walk-out spot, directions to+THROUGH machine, fill times,
  access time, follow-up, contacts, 3 photo link spaces, refill videos/docs/notes, access
  notes; key code never on card). machine_locations extended. Restock tasks now show the
  shared card read-only + link (no doubles). Cleaned Restocking page (dropped unasked
  low-stock banner). Fixed Setup board sizing (8 stages fit the same width; scoped CSS).
- 2026-08-19 (g): BUILT Restocking per Joe's dump — restock_tasks pipeline w/ refill +
  shipping-refill tabs, refiller offer/accept/re-offer, shared map-card links (+refill
  videos/docs on machines), verify-before-codes flow (lockbox key + generated refill code),
  replenish list loaded from live_slots (real capacities only), photo + Drive/email filed
  flags. Agent layer specced for later.
- 2026-08-19 (f): BUILT Machine Ops record (health strip, reader+portal link, router, apps,
  lockbox generate, service log, address→machine_locations) and Setup & Distribution pipeline
  (8 stages per Joe's ordered-and-distribution dump incl. map cards). Sales sell-through
  counter live (slot_history snapshots + product_sales_estimate view). All deployed to main.
- 2026-08-19 (e): BUILT planogram Phases 0–2 on Templates block (`machines` registry seeded
  w/ real roster labels from ourvend-refresh; PlanogramsBoard: 40-coil authoring, catalog-only
  picker, assignment + go-live confirm; old TemplatesBoard removed). Sales reader
  `ourvend-sales` built+deployed; SaleSummarize helper endpoints answer but grid endpoints
  200-empty (same bot-wall as Commodity) → needs Joe's one-time ListJson browser capture,
  then schedule it. SalesBoard tab wired to `product_sales` (lights up when data lands).
  Captured Machine Operations SPEC v1 (next block). ourvend-sales-probe utility deployed.
- 2026-08-19 (d): Joe's SPEC v2 brain-dump for Catalog block = product hub (shop links,
  requested-products lists, research, coil map, sales info; planograms → own block/file).
  Built tabs: Requested (`requested_products` table), Shop/Suppliers (`supplier_links`,
  seeded Weiner's LTD https://weinersltd.com), Coil Setup (shared 40-coil layout: 1–29 odd
  wide, 31–51 standard, 53–59 odd wide). Sales totals NOT derivable yet (no transaction
  history in live_slots) → needs read-only OurVend Sales Report reader, noted as next.
  Old repo medicube-mcos attached read-only; old Vercel project untouched/live alongside v2.
- 2026-08-19 (c): Imported PLANOGRAM 01 "UNLV Tonopah 1" (Joe's xlsx → `templates`, draft,
  40 slots). Gate check: 28 in catalog, 7 check-variant, 5 NOT in OurVend (Clear Blue
  Pregnancy Test, Beast Bites, Creatine Gummies, Dove Bar Soap, Chapstick Cherry — must be
  loaded one at a time), 5 price diffs vs cloud. Details in the block spec.
- 2026-08-19 (b): Verified connection live (crons active, sync 16m fresh, 14-machine roster:
  7 w/ slots, 7 at 0). Locked PLANOGRAM SPEC v1 with Joe: new-machines-only, clone-only push,
  images only from preloaded catalog (one at a time). Catalog now 49/49 w/ image+desc (4
  desc-less rows removed from `products` mid-session, presumed Joe). Deployed `catalog-thumbs`
  utility edge fn. "Planogram Ops" artifact (plan + fleet + catalog board) — link in chat.
- 2026-08-19: Built OurVend auto-login (self-renewing session) + self-heal in both syncs +
  hourly login / daily catalog crons. Imported 51 catalog products w/ images+descriptions.
  Wired Machine Ops + Inventory to live_slots. Locked "OurVend is the system, Nayax secondary."
