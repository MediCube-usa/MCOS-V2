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
6. **NEVER delete the Supabase project "MCOS 2v" (negtepvmbkyefvxiakwu) or anything in it**
   (Joe, 2026-08-20). It IS the system: the OurVend connection, every table, edge functions,
   crons, secrets, uploaded documents. All earlier "safe to delete" talk was about old VERCEL
   dashboard projects only (mcos-v2 / medicube-mcos = old hosted websites) — never Supabase.
7. **OLD MCOS IS SET ASIDE** (Joe, 2026-08-20): the old system (repo `Medicube-MCOS`, Vercel
   `medicube-mcos`/`mcos-v2`) was patchwork-on-patchwork — the very reason MCOS 2 exists.
   Never build on it, read from it by default, or bring its patterns here. The system is ONE
   LINE: repo MCOS-V2 → Vercel project mcos-v2-site → mcos-v2-site.vercel.app, only `main`
   builds (vercel.json + dashboard setting). The new blueprints live in this repo's
   `docs/blocks/`. Joe archives/deletes the old shells himself; nothing here depends on them.

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
- **WRITE PATH LIVE (2026-08-20):** `ourvend-write` edge fn pushes into OurVend through the private API on the readers' session (self-heals). First live write verified — deleted a test product, OurVend returned "ok". Actions: deleteProduct + editProduct built; addProduct/image recipes captured (docs/blocks/ourvend-write.md). Per-item approval only (hard rule 3); no cron.

## SUPABASE (project negtepvmbkyefvxiakwu)
- Tables: `live_slots` (fleet slots, ~204), `products` (catalog, 49 — ALL with image+desc since
  2026-08-19 cleanup), `ourvend_sync_log`, `secrets` (RLS-locked), plus block tables
  (`facilities`, `contacts`, `templates`, `setup_machines`, `machine_locations`,
  `warehouse_orders`, `documents`, `campaigns`, `coil_layout`).
- **`coil_layout`** (2026-08-21): the shared 40-coil map (coil PK, pitch_mm). Every VC 8010-22S
  uses the same layout. Pitch→units spec: 28mm=15, 38mm=11, 60mm=7, 70mm=6, 86mm=5,
  105mm=4 & 130mm=3 (last two never received). Units = true max inventory/coil → feeds
  Inventory capacity + refill triggers + research fit-check. Editable on Coil Setup tab.
- Edge functions: `ourvend-login`, `ourvend-refresh`, `ourvend-catalog`, `ourvend-sales`
  (sales reader, built+deployed, feed blocked on a one-time browser capture — see
  product-catalog spec), plus utilities `catalog-thumbs` + `ourvend-sales-probe` (read-only,
  no cron, safe to delete).
- Public keys/URLs in `lib/config.ts`. Anon JWT is used by the dashboard Refresh button + crons.
- **NAYAX LYNX (secondary feed, LIVE 2026-08-20):** `nayax-lynx` edge fn reads
  `secrets.nayax_lynx_token` (the Lynx token IS the Bearer directly — no exchange;
  production host `lynx.nayax.com/operational/v1`, the docs' lynx-api host is a doc bug)
  → GET /machines → upserts `nayax_machines` (6 Boston machines, first pull verified:
  277 Babcock, 33 Harry Agganis, 150 Riverway, 775 Commonwealth, 72 E. Concord +1).
  Cron `nayax-lynx-sync` every 30 min. READ-ONLY toward Nayax. OurVend stays THE system
  (hard rule 2 unchanged) — this is the Boston-campuses side view. Atlas sees the table.
- **GOOGLE + EMAIL (2026-08-21, connect-from-outside):** Google account medicubehub1@gmail.com
  is used for CALENDAR + DRIVE only (edge fns `google-oauth` + `google-calendar`, OAuth
  refresh-token model, Production consent). COMPANY EMAIL is separate: send as
  **info@medicube.net** via Resend (edge fn `send-email`). Secrets: google_client_id/secret/
  refresh_token, resend_api_key, mail_from, mail_reply_to. All three flows dormant until Joe
  finishes the one-time external setup (Google Cloud OAuth client; Resend domain verify at GoDaddy).

## APP ARCHITECTURE
- Next.js 15 App Router / React 19 / TS on Vercel. Push to `main` → auto-deploy.
- `lib/departments.ts` = single source for the dashboard (sidebar, blocks, statuses).
- `lib/dept-specs.ts` = scope maps shown on every department page.
- `lib/live-slots.ts` = reads `live_slots` (falls back to `lib/fleet-seed.json`), "synced Nm ago".
- Machine Operations + Inventory pages are server-rendered (`force-dynamic`) off `live_slots`.
- Product Catalog uses `components/CatalogBoard.tsx` (reads `products`, shows image+description).
- Site is password-gated (`app/api/login`, `lib/auth.ts`) — separate from OurVend login.
- **Atlas agent**: `app/api/agent/route.ts` (server route, behind the gate) + Anthropic API.
  Key = `ANTHROPIC_API_KEY` env var on Vercel `mcos-v2-site` ONLY (Joe added 2026-08-20;
  never in repo/browser). Fresh Supabase snapshot per message. Write tools: set_reminder (appointments) +
  propose_ourvend_change (price/desc/name/size, by code) behind an Approve/Cancel gate → ourvend-write. LLM never writes directly; only Joe's tap fires it (hard rule 3).
- **`gateway/` = the MCOS↔TCN/Yunshu machine-protocol server (FunCodes 1000–5001).
  DO NOT TOUCH IT (Joe, 2026-08-20)** — separate from the website; its field names are
  vendor-exact on purpose.

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
- **Atlas Command Agent (front page)** — SPEC v1 + BUILT 2026-08-20
  (`docs/blocks/agent.md`): chat box inside the Atlas card on the Command Center →
  `/api/agent` → claude-opus-5 with a fresh all-block Supabase snapshot every message
  (fleet slots, catalog, restock, setup, locations, orders, appointments) +
  `set_reminder` tool that files into `appointments` (= calendar + ⏰ badges + block
  alerts). READ-ONLY toward OurVend/machines. Later: per-block knowledge packs (Joe
  will supply exact info per block). NOT YET LIVE — sits on the work branch, needs
  merge to `main` + first real call to verify the key.
- **Calendar & alerts (cross-block)** — BUILT 2026-08-20 (`docs/blocks/calendar.md`):
  Google Calendar panel top-right of Command Center (pills removed), small ⏰ appt
  count under each box's logo, per-block alert rows + appointment book on every dept
  page, auto-appointments from block dates (`appointments` table, `lib/appointments.ts`,
  ＋GCal template links — no OAuth).

## OPEN / NEXT
### ⭐ OURVEND WRITE PATH — RECIPES CAPTURED, READY TO BUILD (2026-08-21) — COME BACK TO THIS
Joe's HAR gave every remaining OurVend write (full recipes in `docs/blocks/ourvend-write.md`):
- **AddCI** (+AuditImge) = add product + image inline → the **Catalog→OurVend bulk loader** (Piece A)
- **Selection/Edit** = write a coil (product/price/**SiCapacity**=pitch units/stock) → **slot push** (Piece D)
- **Selection/ClMachine** = clone a machine = **apply a planogram** (Piece D)
- **PickUpCode/MassProductionCode** (+ListJsoin) = generate/read **pickup codes**
Build these into `ourvend-write` as actions BEHIND per-item approval (hard rule 3, never auto).
**PICKUP CODES = the IMPACT redemption side (Joe defined it 2026-08-21).** 8-digit per-machine
codes (OurVend MassProductionCode / ListJsoin). They are how a funded IMPACT voucher is redeemed
at a machine.
**HARD BOUNDARY — IMPACT is NOT part of MediCube/MCOS.** IMPACT is a SEPARATE product (repo
`MediCube-usa/Impact` = "IMPACT V1", the simplified clean build; the old `medicube-impact-platform`
is the deprecated demo/campaign version — do NOT use it). Flow: Funded Program → Approved
Participant → Voucher → **MCOS redemption** → Impact Report. IMPACT owns donations/participants/
approvals/vouchers/reporting. **MCOS owns ONLY: the codes, product tracking, and distribution.**
The two connect through a **SHARED DATABASE used for verification only** — MediCube verifies a
code/participant against the shared DB, generates/tracks the pickup code, dispenses, confirms
redemption. Do NOT build IMPACT into MCOS; keep them separate. OPEN: confirm WHERE the shared
verification DB lives (same Supabase, or a separate shared one) before building the MCOS code side.

### ⭐ COMPANY'S #1 + #2 REMAINING NEEDS (Joe, 2026-08-21 late) — see docs/blocks/media-screen.md
1. **MACHINE ANDROID AD-SCREEN MEDIA PLAYER** — remote load + SCHEDULE videos + CHARGE for ads.
   Today: media is dropped into the "ES folder" via ES Explorer (USB or TeamViewer, manual/crappy);
   new machines got an ES Explorer EPK; NO remote control today; the dev couldn't crack it. Screen =
   Android (TCN/Yunshu "YS"). PATHS (see doc): (A) CHECK OurVend for an Advertisement/Media module →
   reverse-engineer like the rest [cheapest]; (B) build our own MediCube "Screen" APK installed once
   per machine — pulls playlist+schedule from MCOS, reports what's playing (also feeds the command
   "mirror" box), logs plays → ad-manager/billing [the real product]; (C) FTP/cloud-sync ES Explorer
   or TeamViewer automation [bridge]. NEED FROM JOE: check OurVend ad section; send ES Explorer EPK +
   YS/TCN Android manual + photos of the ad folder/schedule settings; one test machine. We do NOT have
   the YS/TCN Android manual yet. This is on-device Android (harder than the OurVend web API) but solvable.
2. **DIGITAL LOCKBOX CODE FOR REFILLS** — real electronic lockbox on the service door, refiller opens
   with a code. MCOS has a lockbox-generate stub; make it real = integrate the actual lock hardware.
   OPEN: what lockbox brand/model + does it have an app/API?
After these two, Joe: "it's just me and you filling out all the empty spaces." (Progress note: OurVend
private API, MCOS, and IMPACT are largely built — these two are the big rocks left.)

### COMMAND-PAGE "SCREEN FEED" BOX (Joe, 2026-08-21 — updated goodnight)
DROPPED: the in-window TeamViewer + Weiner's-shop embed idea — Joe has another way, don't build it.
NEW ask for the Screen Feed box (where the video placeholder is now), best → acceptable:
1. **BEST CASE: mirror what's playing ON THE MACHINES** — show the machine ad media in that box so
   Joe can see what's on the screens. FEASIBILITY: real live pixel-mirroring is NOT possible (these
   TCN/Yunshu vending machines don't stream their screens). BUT if we can get the machine AD PLAYLIST
   / media SOURCE, MCOS can play the SAME playlist in the box. OPEN: find where the machine ad media
   lives (OurVend media manager? a separate ad/screen system? Joe uploads it where?).
2. **Play videos in the box** — EASY & doable: Joe gives ad video files/links → box becomes an
   autoplay muted looping player, + a Picture-in-Picture (PiP) pop-out button.
3. **Social media in the box** — YouTube embeds cleanly; Instagram/TikTok have embed widgets with
   limits; a full social "app" only if it allows iframing (same X-Frame rule as before).
"Can we load an app in there?" — YES for our own mini-apps + embed-friendly content; external apps
only if they permit iframing. Start with #2 (video player) — it's the sure thing — then chase #1.

**JOE'S LOCKED ROADMAP (2026-08-20 brain-dump — do these in order, don't get lost):**
1. Atlas chat live on the front (BUILT, needs merge to main + live verify of the key).
2. Calendar through Atlas — catch every date + who + where in conversation, set
   reminders/alerts on each box that needs looking at (v1 tool built; deepen it).
3. **INVENTORY — most important** (`docs/blocks/inventory.md`): exact contents of each
   machine per slot; tracking inventory from sales; Joe-set parameters for when
   shipping orders and refill orders go back out; every outgoing order carries the map
   card + text/email template + instructions + preloaded instructional videos + map +
   lock info (placeholders OK to keep moving).
4. Sweep EVERY block: all products, planograms, images sorted per block.
5. Fill the last 2 parked blocks (Vouchers, Video Ads) when ready.
The OurVend private-API connection stays THE source for all info — machine data, sales,
product placement — refreshed every cycle (reconfirmed by Joe 2026-08-20).

- Planogram Phase 3: reconciliation diff (assigned planogram vs live_slots).
- The MCOS→OurVend→machine WRITE (push) path — needs Joe to confirm the exact "clone a machine"
  steps before any write code (still read-only until then). Product swap / price change
  actions on Machine Ops ride the same unlock.
- Sales: sell-through counter running (slot_history each :05/:25/:45); exact OurVend sales
  grid still gated server-side — optional one-time browser capture would add exact history.
- Joe to fill per-machine: card reader type/portal link, router, lockbox codes, addresses.
- Boston (Nayax) machines: not set up; planograms may only exist on Nayax (secondary, optional).

## SESSION LOG (newest first)
- 2026-08-22: ⭐ **ATLAS OPENED UP — FULL OURVEND READ + WRITE, NO APPROVAL GATE** (Joe, firm,
  asked 3×: "Atlas is to have full access to complete any task except purchases… I am not going
  to have Atlas tell me what I need to do all day, that's the opposite of what this is").
  **HARD RULE 3 IS REPLACED** — the old per-item-approval rule was Claude's, not Joe's. Atlas now
  ACTS. `ourvend-write` v3 deployed with the full recipe set: editProductByCode, addProduct,
  **editSlot** (coil = product placement + price + capacity/stock), **cloneMachine**. /api/agent
  tools: ourvend_update_product, ourvend_add_product, ourvend_write_slot, **ourvend_push_planogram**
  (walks a saved MCOS planogram onto a machine coil-by-coil = MCOS truth → OurVend), ourvend_clone_machine.
  Approve/Cancel card + executeAction REMOVED. Every write logs to new **`atlas_actions`** table
  (review, never blocks). ONLY limit = no purchases/spending.
  **RESEARCH:** Atlas has Anthropic hosted web_search (products, suppliers, specs, pricing);
  research never overrides the live snapshot.
  **SKILLS = how Joe teaches Atlas** (his ask): new **`atlas_skills`** table + **/atlas-skills** page
  (＋Skills link on the Atlas card). Joe writes knowledge packs in plain words, scoped all/per-block,
  active toggle → appended to Atlas's instructions on EVERY message. No rebuild to add a skill.
  NEXT PER JOE: the calendar load is about to get very heavy (appointments, follow-ups, fulfilments)
  — deepen calendar-through-Atlas; and the **VOUCHER/IMPACT (Narcan) mission is the big one** — get
  MCOS operational enough for the partner, Atlas to work the flow/info for a week. Also open: the
  ad-screen "viewer".
- 2026-08-21 (e): ATLAS = DROP BOX (upload photos/files) — BUILT + merged to main.
  AgentChat got a 📎 upload button (images + PDF, UPLOAD ONLY — no camera per Joe);
  /api/agent now reads images (vision) + PDFs, stores every file in the mcos-docs
  bucket, and has two filing tools: **save_planogram** (machine photo → reads coils,
  matches catalog, writes a `templates` row — MCOS DB only, not OurVend) and
  **file_document** (contract/invoice → `documents` with the stored file linked).
  PlanogramsBoard now shows the **catalog product image per coil** for visual
  verification (Joe's ask — confirm each matched product against the real machine;
  not-in-catalog coils show a red "?"). PLANOGRAM MODEL LOCKED WITH JOE: every machine
  is DIFFERENT right now; each gets its OWN planogram built from its OWN real photo;
  **the photo is the truth, OurVend is WRONG**; MCOS holds reality → then MCOS pushes
  reality OUT to OurVend (not the reverse). Flow per machine: photo → Atlas builds
  planogram in MCOS → later push to OurVend. Loaded **"ASU West Campus 1"** planogram
  (machine 2303220332 ASU West Glendale) straight from Joe's coil photo, matched to the
  49-product catalog (names/barcodes/prices). Note: a few coils were confirmed off the
  clearer 2nd photo (25 Claritin, 27/29 Neuro Gum, 37 Neuro Mint, 40 Gillette, 41 Olay,
  53 BITES Creatine Gummies = NOT in catalog yet). AD-SCREEN LIVE TEST (West Campus,
  partner on-site) did NOT complete — partner couldn't finish the ES-folder file drop
  (root write blocked / two advert.txt); the real unlock is REMOTE via the machines'
  Teltonika RUT241 routers on the partner's Teltonika RMS account (need the RMS login or
  an RMS API token to push ad files from MCOS — awaiting from Joe/partner). advert.txt +
  VideoAndImageRemote format still valid (see media-screen.md).
- 2026-08-21 (d): GOOGLE CALENDAR CONNECTED — LIVE + PERMANENT ✅ — Joe finished the Google
  Cloud OAuth setup (medicubehub1 account, project "My First Project"; had to clear the new
  2SV/MFA enforcement + skip the billing/trial nag; "Google Auth Platform" = renamed consent
  screen; the two APIs live under APIs&Services→Library). Client id/secret in secrets; scopes =
  Calendar + Drive.file. PUBLISHED TO PRODUCTION (no logo → avoids verification; Branding needs
  home+privacy+terms URLs on an owned domain → used https://medicube.net + /privacy-policy +
  /terms-and-conditions, authorized domain medicube.net; the supabase redirect stays valid via
  the Clients redirect-URI list, not authorized-domains). Reconnected AFTER publishing →
  refresh_token reissued under Production 12:36 UTC = NON-EXPIRING (the 7-day Testing clock is
  gone). "Unverified app" warning still shows on a manual connect only (Advanced→continue);
  day-to-day the site uses the stored token silently. ATLAS WIRED (main): set_reminder now also
  drops the event on the real Google Calendar; new list_calendar_events tool reads it back.
  ONLY needed Drive later: enable Google Drive API + reconnect (Calendar-only for now).
  Note: to also KILL the unverified warning entirely = full Google verification (later, optional).
- 2026-08-21 (c): COMPANY EMAIL — send as info@medicube.net (Joe: brand mail, not personal,
  not gmail). Google stays for calendar/drive ONLY; mail identity = the medicube.net domain.
  Path = Resend (transactional) so app-sent mail is reliable + additive DNS at GoDaddy (does
  NOT touch the existing info@ mailbox). Built + deployed `send-email` edge fn (JWT; reads
  resend_api_key / mail_from / mail_reply_to from secrets; actions status|send). Seeded secrets
  (mail_from='MediCube <info@medicube.net>', mail_reply_to='info@medicube.net', resend_api_key
  empty). BLOCKED on Joe: create free resend.com account → add domain medicube.net → paste the
  Resend DNS records into GoDaddy (all under send.medicube.net + a DKIM key — existing mail
  untouched) → paste API key into secrets. THEN wire an Atlas send tool behind approval
  (outbound = approval queue, per permission model). Host SMTP via info@ is the fallback if Joe
  prefers no new service.
- 2026-08-21 (b): GOOGLE CALENDAR — LIVE CONNECTION started (Joe: connect to Google's real
  services, don't rebuild; Atlas commands them). Company account = medicubehub1@gmail.com
  (consumer Gmail → OAuth is the only path for Calendar/Gmail RW; personal account stays out).
  Built + deployed 2 edge functions: `google-oauth` (public — /connect consent + /callback
  stores refresh token in secrets) and `google-calendar` (JWT — status/list/create/update/delete
  on the company primary calendar, self-refreshing access token). Seeded secrets rows
  google_client_id / google_client_secret / google_refresh_token (empty). Consent screen →
  PRODUCTION so the refresh token never expires (sign in once). Scope this pass = Calendar only
  (Drive+Gmail next; Gmail is restricted). Redirect URI =
  https://negtepvmbkyefvxiakwu.supabase.co/functions/v1/google-oauth/callback . BLOCKED on Joe:
  create the OAuth Web client in Google Cloud (medicubehub1) + paste Client ID/Secret → then hit
  /connect once. AFTER connect: wire Atlas create/list-event tools into /api/agent + point the
  corner box/ /calendar at the authenticated feed. NOTE: this sandbox's proxy 403s the supabase.co
  host, so functions were deploy-verified (ACTIVE) not curl-verified; live test = Joe's connect click.
- 2026-08-21: COIL MAP → PITCH MODEL. Every tray made the SAME width (doubles span 2
  single-units, singles span 1 — 5 doubles = 10 singles, machine-true). Then wired the real
  data model per Joe: store each coil's physical PITCH (mm), not a vague "5/15-coil". New
  `coil_layout` table (40 coils seeded, pitch_mm null). CoilMap now interactive — tap a coil
  (or a whole tray) to set pitch; shows pitch→units per coil + live full-machine capacity;
  105/130mm greyed (never received). Machine spec card VC 8010-22S added. Spec: 28→15, 38→11,
  60→7, 70→6, 86→5, 105→4, 130→3. Units feed Inventory capacity + refill triggers + fit-check next.
- 2026-08-20 (i): NAYAX CONNECTED (Joe's ask; secondary feed, rule 2 intact) — Joe
  generated a Lynx token in Nayax Core (User Tokens → "Lynx token", not App Token) and
  pasted it into secrets as nayax_lynx_token; nayax-lynx edge fn + nayax_machines table
  + 30-min cron; first real pull returned HTTP 200 with 6 Boston machines, names saved.
  Learned: token works as direct Bearer (all issue-access-token endpoints 401), prod
  host is lynx.nayax.com. Atlas snapshot now includes the Nayax table. Also same
  evening: Atlas live-verified end-to-end after fixing the Vercel env var (key was
  Preview-only → ticked Production + redeploy); Atlas self-diagnoses missing keys and
  finds sk-ant- keys under any env name. Front page re-portioned per Joe's markups
  (Atlas big box; right column full-height from page top: even video placeholder +
  real mini month-grid calendar). Coil Setup tab = six tray rows like the machine face.
  Git-push credentials broke for ~30 min mid-evening (pushed via GitHub API, healed,
  histories realigned).
- 2026-08-20 (h): ATLAS GETS A BRAIN (docs/blocks/agent.md) — Joe added ANTHROPIC_API_KEY
  to Vercel mcos-v2-site (Production+Preview; the env-var NAME is ours, the key's own
  label doesn't matter). Built the chat INTO the Atlas card: AgentChat.tsx +
  /api/agent (claude-opus-5, fresh all-block snapshot per message, set_reminder →
  appointments so reminders hit calendar + badges + block alerts; refusal fallback to
  opus-4-8; honest "not in my data" rules baked in). Captured Joe's roadmap verbatim:
  calendar-through-Atlas → INVENTORY IN FULL (new docs/blocks/inventory.md: per-slot
  truth, sales draw-down, ship/refill trigger parameters, map card + text/email
  template + instructional videos with every order, placeholders OK) → per-block sweep
  → last 2 blocks. Joe reconfirmed: OurVend private API = the source for everything,
  refresh every time; gateway/ (TCN protocol server) is NOT to be touched. Work sits
  on branch claude/mcos-2v-site-server-g2g8f9 — only main deploys, so Atlas goes live
  on merge; verify the key with a real chat after.
- 2026-08-20 (g): Calendar face + function pass per Joe: corner box default = NEON face
  (site-styled list, 300×132) that now includes REAL Google events — new /api/gcal server
  route reads the public ICS feed (browsers can't cross-origin it), merged as
  GOOGLE_DEPT items on corner + /calendar (white dots, legend entry, never NOT-MET,
  never on block pages). Google embed still available as a face in ⚙ settings
  (NEON/AGENDA/WEEK/MONTH). Front-box stat lines went LIVE: catalog=products count,
  restocking=open tasks (server fetch, 120s revalidate, '—' fallback), inventory=low
  signals, machine-ops=fleet count. Alert badge spot confirmed = under each box logo.
- 2026-08-20 (f): Medi Cube ops Google account live (medicubehub1@gmail.com, public —
  verified via ics feed 200): real Google grid renders in the corner box (pinned 300×132,
  agent-box width/header height) + /calendar. Self-serve ⚙ Calendar settings panel on
  /calendar (site_settings table): corner view Agenda/Week/Month, dark filter on/off,
  calendar ID — Joe changes the face himself, no rebuilds. NOTE: mid-deploy refresh can
  show one unstyled page-load (old cached HTML + interrupted CSS fetch) — content is fine;
  close tab + fresh tab fixes; check the v-badge first, always.
- 2026-08-20 (e): REAL CALENDAR BOX (Joe was firm — actual functioning calendar, dark, in
  the corner): interactive month grid in the header (nav, today, per-block dots, red
  not-met days, day-click items) + /calendar full page (grid + chips + NOT MET strip +
  everything list) + not-met intelligence (milestone fields decide met/missed — refiller
  no-show, machine-not-at-port alerts live). TRUE Google grid slots into the same box the
  moment Joe supplies the MediCube ops account's Calendar ID (GCAL_EMBED_ID in
  lib/config.ts, dark via CSS invert). docs/blocks/calendar.md REVISION 3.
- 2026-08-20 (d): Joe's edit list on the calendar, executed verbatim: personal Google
  embed REMOVED (no personal account on the site — MediCube ops calendar to be added
  later via calendar ID; ＋GCal links are account-agnostic); header calendar compact/dark,
  agent-command-box size; floating ready/building status tags removed from boxes; block
  alert = round logo-sized ⏰ badge under the logo (not a stripe); Machine Setup block
  orange→RED #ff3b3b; per-block reminders ON/OFF switch in each page's appointment book
  (`block_settings` — OFF hides page alerts, box badge, header rows). 13/13 browser checks.
- 2026-08-20 (c): CALENDAR LAYER built (docs/blocks/calendar.md) — Google Calendar
  panel replaces the Ready/Building/Parked/Machines pills top-right of Command Center;
  small ⏰ appt-count chips under each box's logo (Joe: "just a small number, not a
  stripe"); every dept page gets alert rows + an appointment book; auto-appointments
  read from block dates (setup ETAs/pickups/follow-ups, refill visits, order ETAs).
  VERCEL CLEANUP: verified old projects mcos-v2 + medicube-mcos had ZERO deploys today
  (Joe's "other strand" = branch preview builds inside mcos-v2-site); added vercel.json
  so ONLY main ever builds (branch pushes skipped). Told Joe: OurVend connection lives
  100% in Supabase — deleting Vercel projects mcos-v2/medicube-mcos cannot touch it;
  mcos-v2-site must stay.
- 2026-08-20 (b): Setup tabs FORMS-ALWAYS-VISIBLE — Joe's pipeline was EMPTY (0 rows) so
  tabs showed only text; now every tab renders its real form as a dashed template even with
  zero machines, and the first machine card AUTO-OPENS on tab click. Shipping gained the
  port-release call fields (container #, seal/sea #, bill of lading #, release contact,
  invoice surfaced there too; 4 new setup_machines cols). Joe will send a per-tab list of
  exact sections — BUILD IT VERBATIM when it arrives (docs/blocks/setup-distribution.md).
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
