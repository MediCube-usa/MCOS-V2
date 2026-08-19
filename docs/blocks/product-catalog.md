# Block spec — Product Catalog & Sales (+ Planograms/Templates)

Status: SPEC (captured from Joe, not yet coded)
Last updated: 2026-08-18

This is the source-of-truth spec for the Product Catalog block. Written before code so
nothing is lost between sessions. When we code, we code to this file.

---

## What this block must do

### 1. Full product catalog — images + descriptions
- **All products loaded** into MCOS (not just what's currently in machines).
- Every product carries its **image** and **description**.
- Source of the images/descriptions: **OurVend Commodity Management**.
  - Data endpoint discovered (via our stored session, read-only): `/CommodityInfo/ListJson`
    (the grid data under Commodity Management). Returns the product master.
  - Image host discovered: `https://ourvend-image.oss-cn-qingdao.aliyuncs.com/`
    (public Alibaba OSS bucket; `Regular/` folder seen in the page). Full image URL =
    that base + the product's image path.
- First pass is a **one-time import** to populate MCOS so Joe can SEE it all. Not a rigid
  auto-overwrite rule yet — some OurVend data is stale and we review it together first.

### 2. Planograms (a.k.a. Templates) live ON this block
- Planograms belong on the Product Catalog block (bring the Templates/Config content here).
- Must be able to: **create new planograms, edit existing ones, assign a planogram to a
  machine, and change assignments.** Full build/manage, not read-only display.
- A planogram = the coil→product→price→capacity layout for a machine (what we already read
  per machine via `/Selection/SoltInfo`).

### 3. The push path — MCOS → OurVend → machines  ⚠️ MOST IMPORTANT, and a WRITE path
- Rule in OurVend: **a product must have its image + description loaded in OurVend before
  OurVend will accept the product.** So images/descriptions have to exist in OurVend first.
- We can build/edit on the MCOS side, but pushing OUT to OurVend and then onto the physical
  machines **"is done a strange way"** (Joe's words). We need to build the bridge so that a
  change made in MCOS flows: **MCOS → OurVend → machine.**
- This is the priority piece right now.

---

## ⚠️ OPEN — need from Joe before we build the push path

The push path is a **write** to OurVend and to **live, partner-run machines**. Everything so
far has been strictly read-only for safety. Before writing any push code I need to understand
"the strange way," exactly, so I don't guess (guessing here could change a live machine):

1. **How does a product/planogram actually get from OurVend onto a machine today?**
   - Is it an OurVend screen action (e.g. edit slot → save → machine pulls it)?
   - Or an export/import (the "ES folder" you mentioned for prices)?
   - Or a "send to machine" / "issue" button that pushes config down?
2. **Creating a product in OurVend** — which screen/steps, and what fields are required
   (image + description confirmed; barcode? category? supplier? price?).
3. **Assigning a product to a slot / applying a planogram** — is that per-slot edit, or a
   whole-machine template apply? What's the OurVend action?
4. **Pricing** — you said prices are set at the machine via the ES folder, not always pushed
   to OurVend. Does the push path also set price, or is price still machine-side only?
5. **Authorization** — these are live partner machines. Confirm we build the write path, and
   whether each push should require an explicit per-push confirm before it goes out.

### DECISION — OurVend is the system. Nayax is secondary. (locked by Joe, 2026-08-18)
- **OurVend is the single source of truth.** All catalog, planogram, inventory, and push data
  flows **to and from OurVend.** The push path we build is **MCOS → OurVend → machine.**
- **Nayax is secondary and does NOT replace OurVend — ever, not even part-time.** It is only
  present on a few campuses, it does not serve the rest of the company, and Nayax's interest is
  to own the client relationship. We do not build on Nayax as the primary, and we do not split
  logic across it.
- **Do NOT propose switching to Nayax, using it "for some machines," or syncing planograms
  through it instead of OurVend.** This is settled. Any Nayax use is reference/reconciliation
  only, never the source and never the push path.
- Nayax Lynx connection *does* exist (`Medicube-MCOS/lib/integrations/nayax/lynx.ts`, Bearer
  token, `https://lynx.nayax.com/operational/v1/...`) — kept only as a secondary read for the
  Nayax campuses if ever needed. It is NOT part of the catalog/push build. Not connected in
  MCOS-V2 and does not need to be for this block.

---

## HOW OURVEND ACTUALLY WORKS (Joe, 2026-08-18) — read before building push/templates
- **Catalog is the gate.** A product cannot be used in ANY template — even a single item —
  until it exists in the **OurVend catalog with image + description loaded.** No image/desc =
  OurVend will not load it. So: fully load the catalog first, always.
- **The catalog is a DIFFERENT place than the slots.** Slots come from Selection/SoltInfo;
  the catalog comes from Commodity Management. They are separate. (This is why the catalog
  reader is its own thing.)
- **OurVend has NO standalone planogram/template object.** A full planogram template in
  OurVend is made by **cloning a machine.** You set up a machine that is *not in use*, name it
  "Template" / "Planogram X", and push it onto real machines by cloning that machine.
  → In MCOS: planogram templates are represented as **machines flagged as templates (not in
     use).** MCOS makes authoring them easy; but to push through OurVend onto real machines it
     must ride the **clone-a-machine** mechanism. Build the push path around cloning, not around
     a (non-existent) template API.
- **Boston campus machines** are **not set up yet** and are on **Nayax**. Joe asked whether we
  could pull their planograms from Nayax. ANSWER: possible ONLY if we connect Nayax Lynx (need
  the token stored here). This is a **bounded, secondary** source — just to source planograms
  for the un-set-up Boston machines — NOT a switch away from OurVend, NOT for the rest of the
  fleet. OurVend stays the system.
- **Joe wants ongoing narration:** keep him informed of what is being built as we go.

## ✅ DONE (2026-08-19) — OurVend AUTO-LOGIN (self-renewing session)
- The connection now logs itself in. Edge function `ourvend-login` replicates the OurVend
  login page: POST `/Account/GetPubKey` → RSA/PKCS#1-v1.5 encrypt the password (node-forge,
  same as the page's JSEncrypt) → POST `/Account/Login` (`userAccount`/`userPwd`/`LoginUrl`) →
  captures the fresh cookie jar (`aliyungf_tc`, `acw_tc`, `ASP.NET_SessionId`) and writes it to
  `secrets.ourvend_cookie`. Verified: login ok, and the catalog then reads with the STORED
  cookie (no manual paste).
- Credentials live ONLY in `secrets` (`ourvend_username` / `ourvend_password`) — never in code,
  repo, logs, or responses.
- Self-heal: `ourvend-refresh` (slots) and `ourvend-catalog` call `ourvend-login` and retry the
  instant they detect an expired session. So re-login is on-demand, not on a timer.
- Schedules (pg_cron): `ourvend-fleet-sync` every 20 min (data), `ourvend-auto-login` hourly
  (session refresh), `ourvend-catalog-sync` daily. Data freshness = 20 min regardless.
- Files: `supabase/functions/ourvend-login/index.ts`, updated `ourvend-refresh` + `ourvend-catalog`.

## ✅ DONE (2026-08-19) — Catalog images + descriptions imported
- 51 products pulled from OurVend Commodity Management → MCOS `products` table.
  All 51 have images (verified HTTP 200), 49 have descriptions. Catalog now 53 rows
  (51 synced + 2 pre-existing not in current OurVend list).
- What cracked it:
  - **Fresh browser cookie** with the WAF tokens (`aliyungf_tc`, `acw_tc`) + current
    `ASP.NET_SessionId` — passed to the edge function in the POST body `{ "cookie": "..." }`.
    The stored slot-sync cookie lacked the WAF tokens, so the Commodity module returned empty.
  - **Key on `PrID`** (OurVend product GUID) — matches the existing catalog rows so re-import
    MERGES, not duplicates. (`PrCode` = human code "1007"; not the key.)
  - **Image URL = `https://ourvend-image.oss-cn-qingdao.aliyuncs.com/Regular/` + `PrImgUrl`.**
    The `Regular/` folder was the missing prefix (without it → 404). Public bucket, loads in browser.
  - Body params: `Type=0` (Local warehouse), `PrType=0`, `sidx=PrTopping&sord=desc`, plus a
    priming GET to /CommodityInfo/Index.
- Field map: PrID→barcode(key), PrName→name, PrImgUrl→image_url, PrSpecification→description
  (this is size/spec, e.g. "10pk"), PrRetailPrice→default_price, PrCostPrice→cost,
  CiManufacturer→supplier. (Also available but not yet stored: CiType=category, CreateDate.)
- CatalogBoard.tsx already renders image_url + description, so the live Product Catalog page
  shows them now.
- RE-SYNC caveat: the WAF cookie expires, so an automatic/scheduled catalog re-sync needs a
  fresh cookie. Until login-capture is built, re-syncing = paste a fresh `ListJson` cookie again
  (2-min job). The 20-min SLOT sync is unaffected (separate module, its stored cookie works).

## (resolved) OPEN BUG — Commodity catalog (ListJson) returned empty to our server
- `/CommodityInfo/ListJson` (POST) returns HTTP 200 with an EMPTY body from the edge function,
  for both Local (Type=0) and Cloud (Type=1) warehouses — even though the same session cookie
  works for Selection/SoltInfo and the grid loads fine in Joe's browser.
- Params sent match the page's jqGrid postData: PrCode, PrName, Type (warehouse), PrType, plus
  _search/nd/rows/page/sidx/sord. Priming GET /CommodityInfo/Index first did not help.
- Hypothesis: the catalog is scoped to a selected **account / merchant / sub-warehouse** that
  the browser has in session but our server call does not. Next: find how that selection is set
  (a cookie, a session-setting endpoint, or an account id param) and include it.
- CONFIRMED (2026-08-19): sibling commodity endpoints (`GetType`, `getSession`, `GetCitype`)
  return **403 Forbidden (Alibaba WAF "访问受限")** to our server, and `ListJson` returns a
  200 with an EMPTY body. The Commodity module is behind the bot-wall harder than the Selection
  (slot) module, which is why SoltInfo works but the catalog does not. Our server request lacks
  the browser's WAF JS-challenge cookie (e.g. `acw_sc__v2`) and live commodity session.
- RESOLUTION PATH: one-time capture of the working `ListJson` request from Joe's browser
  (Network tab → ListJson → Copy as cURL). That carries the exact cookies (incl. WAF cookie),
  form fields, and account context. Replicate it in the `ourvend-catalog` edge function → the
  full catalog (images + descriptions) imports and stays permanent, same pattern as the slots.
  This is the same capture method that established the original OurVend connection.
- Reader is deployed as edge function `ourvend-catalog` (dry-run default; `?commit=1` imports;
  `?raw=1` shows raw; `?warehouse=0|1`). Source: `supabase/functions/ourvend-catalog/index.ts`.

## What we already have (no new work needed)
- Live read connection to OurVend (edge function + cron, every ~20 min) → `live_slots`.
- `products` table: barcode, name, description, image_url, category, default_price, cost,
  supplier, notes.
- `CatalogBoard.tsx` already renders images + descriptions and supports add/edit.
- Per-machine planogram data already flows into `live_slots` (coil, product, price, capacity, stock, img_url).

## Agent for this block
- TBD with Joe (which agent runs catalog/planogram logic, and what it watches/does).

---

## Build order once the OPEN questions are answered
1. One-time catalog import: `/CommodityInfo/ListJson` → `products` (image_url from OSS base + path, description, name, barcode, price). Review together.
2. Bring planogram management onto this block: build/edit/assign planograms to machines.
3. Build the MCOS → OurVend → machine push bridge (write path) — per the "strange way" once documented, with the agreed confirm step.
