# MCOS-V2 — Living Source of Truth (read this first, every session)

This file auto-loads into context. It is the memory. **Keep it updated as we build** —
when a decision is made or a block is finished, edit this file in the same commit.
Details per block live in `docs/blocks/*.md`. When in doubt, the repo + Supabase are the
truth, not chat history.

MCOS is MediCube's operating system: a neon "Command Center" dashboard that runs MediCube's
TCN/Yunshu vending machines. Deployed on **Vercel** (auto-deploys on push to `main`), backed by
**Supabase** (project `negtepvmbkyefvxiakwu`, "MCOS 2v").

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
  can be used in a template. OurVend has NO template object — a "planogram template" = a MACHINE
  cloned onto others (set up a not-in-use machine named "Template"). Prices can be set at the
  machine (ES folder) and may lag OurVend's cloud price → "differs" flags are expected.
- If Joe changes the OurVend password, update `secrets.ourvend_password` (then run login).

## SUPABASE (project negtepvmbkyefvxiakwu)
- Tables: `live_slots` (fleet slots, ~204), `products` (catalog, 53; 51 from OurVend w/ images),
  `ourvend_sync_log`, `secrets` (RLS-locked), plus block tables (`facilities`, `contacts`,
  `templates`, `setup_machines`, `machine_locations`, `warehouse_orders`, `documents`,
  `campaigns`).
- Edge functions: `ourvend-login`, `ourvend-refresh`, `ourvend-catalog`.
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
- **Machine Operations** — live off `live_slots`. ✅ data wired
- **Inventory** — live off `live_slots`, low-stock signals. ✅ data wired
- **Product Catalog & Sales** — 51 products w/ images+descriptions imported from OurVend. ✅
  Next: planogram management on this block (see `docs/blocks/product-catalog.md`).
- **Planograms/Templates** — NOT built yet. Model: machines-as-templates + clone-to-push.
- Restocking, Setup, Facilities, Warehouse, Payments, Documents, Finance, Marketing, Contacts —
  scaffolded, not deeply built. Vouchers, Video Ads — parked shells.

## OPEN / NEXT
- Planograms: build create/edit/assign-to-machine on the Catalog block; push via OurVend clone.
- The MCOS→OurVend→machine WRITE (push) path — needs Joe to confirm the exact "clone a machine"
  steps before any write code (still read-only until then).
- Boston (Nayax) machines: not set up; planograms may only exist on Nayax (secondary, optional).

## SESSION LOG (newest first)
- 2026-08-19: Built OurVend auto-login (self-renewing session) + self-heal in both syncs +
  hourly login / daily catalog crons. Imported 51 catalog products w/ images+descriptions.
  Wired Machine Ops + Inventory to live_slots. Locked "OurVend is the system, Nayax secondary."
