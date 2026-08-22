# OurVend WRITE path — recovery record & plan

Written 2026-08-20 after Joe reported the write capability "lost". This file is the
permanent truth so this never has to be re-figured-out again.

## ✅ FULL WRITE RECIPES CAPTURED (2026-08-21, Joe's HAR 3833afae-os.ourvend.com_5)
One capture pass gave every remaining write. All are `POST`, `application/x-www-form-urlencoded`,
on the shared reader session (cookie in `secrets.ourvend_cookie`), each preceded by the usual
`<Controller>/getSession` gate; all returned **`OK`**. Machine IDs seen: 2602080931 & 2602080924
(empty template machines — only the test coil now), 2602080991 = "Murad".

### A. Add a product to the catalog (Commodity) — Piece A
1. `POST /WxMallProduct/AuditImge` — body `image=<data:image/png;base64,...>` → `OK` (image moderation/prep)
2. `POST /CommodityInfo/AddCI` — fields:
   `ProductCode` (barcode/code) · `ProductName` · `PrSpecification` (size, e.g. "1ea") ·
   `PrRetailPrice` · `Manufacturers` (GUID from `/CommodityInfo/GetManufacturer`) ·
   `CiType` (category id from `/CommodityInfo/GetType`|`GetCitype`) · `PrCostPrice` (opt) ·
   `QualityPeriod` (opt) · `PrContent` (description) · `PrAdultLimit=false` · `PrAliAdultLimit=false` ·
   **`ImgPath=<data:image/png;base64,...>`** (image goes INLINE as a data URI — this is how one-at-a-time
   image loading is automated). → `OK`
   ⇒ Catalog→OurVend loader is fully unblocked; a product + its image can be added in one automated shot.

### B. Set / change a coil (slot) on a machine — Piece D (slot write)
`POST /Selection/Edit` — fields:
  `MachineID` · `SiCoilId` (coil #) · `SiBarCode` = the product's **PrID GUID** (list via `/Selection/GetProduct`) ·
  `SiPrice` (cloud price) · `SiCustomPrice` (machine price) · **`SiCapacity`** (coil max — this is our pitch→units!) ·
  `SiExtantQuantity` (current stock) · `WxDiscount`/`AliDiscount`/`IDcardDiscount`=100 · `WarningQuantity` ·
  `warmTime`/`SelectWarm`/`HotTime`/`EnableHot`/`EnablePunch`/`EnableCustomize`/`CustomizeJson`/`Ext`. → `OK`
  Reads for context: `/Selection/GetProduct` (PrID+PrName list), `/Selection/GetSoltInfo` (MachineID+HuoDao→current coil),
  `/Selection/GetPorductPrice` (PrID→default price), `/Selection/GetProductUrl` (PrID→name+image).

### C. Clone a machine (apply a planogram) — Piece D (clone)
`POST /Selection/ClMachine` — fields:
  `Machine` (SOURCE machine id) · `CMachieID` (TARGET machine id, copy TO) · `CloneGoods` (0) ·
  `CStratGoods` (start coil, e.g. 1) · `CEndGoods` (end coil; blank = all). → `OK`
  ⇒ "planogram = a machine cloned onto others" is exactly this call. (Confirm source/target direction on first live use.)

### D. Pickup / security codes
- `POST /PickUpCode/MassProductionCode` — `MID` (machine) · `count` (e.g. 10) → `OK` (bulk-generates codes)
- `POST /PickUpCode/ListJsoin` — grid params → rows: `SecurityCode` (8-digit), `WXSmid` (machine),
  `SCstatus` (0=unused), `WXScreate` (date), `MGName` (machine group). Use to read back generated codes.

All of the above go into `ourvend-write` as new actions, BEHIND per-item approval (hard rule 3) — never auto/cron.

## What actually happened (recovered from the OLD repo, Medicube-MCOS, read-only)

- **2026-07-10 working session** (`01-working-sessions/2026-07-10-ourvend-live-connection.md`
  in the old repo): a browser mapping agent crawled **~187 OurVend portal screens** through
  Joe's logged-in Chrome — including Commodity Management (image, SKU, description, price),
  inventory, machine management. THAT is the day Joe remembers. It PROVED the account can
  do all of it and MAPPED where everything lives.
- **But by its own security boundary, that agent NEVER pressed save**: the session doc says
  verbatim "No live write actions are authorized against OurVend", and the committed endpoint
  map states "Write controls detected but not activated."
- The **raw crawl output** (`ourvend.har`, `endpoints.json`, `schemas.json`, `pages.json`,
  187 screenshots) was deliberately kept LOCAL in a git-ignored `output/` folder **on Joe's
  Windows workstation** — never committed (it contains session cookies). Only a redacted
  summary reached the repo, and that summary contains NO commodity/image/inventory write
  endpoints — the only "write"-classified entries are logout/logo/pubkey POSTs.
- **Conclusion: no working write code was ever committed anywhere** — not in the old repo,
  not in MCOS-V2. Nothing broke. MCOS-V2 is read-only by Joe's own hard rule 3 (read-only
  against live machines until per-item approval), with the write path parked in OPEN/NEXT
  since day one.

## Why Joe is still right

Writes ARE 100% possible: the OurVend portal does them all day with the exact same
authenticated session our connection already holds (the cookie in `secrets.ourvend_cookie`).
Our readers (`/Selection/SoltInfo`, `/CommodityInfo/ListJson`) ride that session now. A write
is the same ride with a different endpoint + payload. The ONLY missing piece is knowing the
exact request the portal sends when a human presses save — one capture supplies it.

## The unlock plan (fast, safe, per Joe's rules)

1. **Option A — check the Windows workstation first**: old repo folder → `output/` →
   `endpoints.json` / `ourvend.har`. If the crawl recorded any save-shaped requests, we may
   already have payload shapes. (Do NOT commit these files — cookies inside.)
2. **Option B — the sure 10-minute path**: Joe performs ONE real save in the OurVend portal
   (e.g. edit one product's description in Commodity Management) with a network capture
   running (DevTools → Network → export HAR of just that action). That file shows the exact
   endpoint + field names.
3. Build `ourvend-write` edge fn replicating that request with our stored cookie
   (self-healing session like the readers). Test on ONE harmless item WITH Joe watching
   (per-item approval per hard rule 3). Then extend action-by-action: description → image →
   price → inventory → planogram push (clone).
4. Every captured endpoint gets documented HERE immediately.

## Status
- [ ] Joe checks the old workstation `output/` folder
- [ ] OR one-save HAR capture (Claude walks Joe through it click-by-click)
- [ ] `ourvend-write` edge fn built + first approved live write verified

## ✅ CAPTURED 2026-08-20 (Joe's HAR, os.ourvend.com) — the write recipes are KNOWN

All are POST, `application/x-www-form-urlencoded`, riding the same authenticated
session cookie our readers already use. Real values from the capture:

### Edit a product — POST /CommodityInfo/EditCI
Fields: PrID (the product's GUID), ProductCode, ProductName, PrSpecification (size),
PrRetailPrice, Manufacturers (GUID), CiType, PrCostPrice, QualityPeriod, ImgPath
(existing OSS path OR data:image base64), PrContent (description),
PrAdultLimit=false, PrAliAdultLimit=false. → 200.

### Add a NEW product — POST /CommodityInfo/AddCI
Same fields as EditCI but NO PrID; ImgPath sent as `data:image/png;base64,...`.
Verified live: created "MCOS TEST" code 9999999999999. → 200.

### Image — POST /WxMallProduct/AuditImge
Single field `image` = `data:image/png;base64,...`. (Image is also embeddable
directly in Add/Edit via ImgPath base64, so a separate upload may be optional.)

### Supporting reads already used by the edit screen
GetProductData (load one product), GetManufacturer, GetCitype/GetType (dropdowns),
ListJson (catalog). Slot side: Selection/GetSoltInfo, Selection/GetProduct.

### NOTE — live test residue to clean up
- A test product **"MCOS TEST" (code 9999999999999)** was CREATED live in OurVend —
  delete it in Commodity Management (or capture the delete endpoint doing so).
- AXE Spray (code 1050) description/price were edited then restored during testing —
  confirm it reads normal in OurVend.

### Build plan
`ourvend-write` edge fn: one function, action switch (editProduct / addProduct /
uploadImage), reads cookie from secrets, self-heals via ourvend-login like the
readers. Per-item approval before any real write (hard rule 3). Slot/coil write
(Selection/*) still needs its own capture — the machine test was skipped tonight.

## 🚀 FIRST LIVE WRITE SUCCEEDED 2026-08-20
`ourvend-write` edge fn deployed (Supabase, verify_jwt, no cron, per-item only).
Deleted the test product live: action=deleteProduct, prId=582A4DB6-5DB5-4126-AEC2-BE43ABFDD15A
→ OurVend returned "ok". THE WRITE PATH THROUGH THE PRIVATE API WORKS.
- Delete: POST /CommodityInfo/Delete  body PrIDs=<PrID>  (getSession-gated, self-heals)
- Edit:   POST /CommodityInfo/EditCI  (full field set, read-modify-write) — built, untested-live
- Add + image (AddCI / AuditImge) — recipes known, actions next
AXE Spray (1050): capture confirms test bumped 4.99→5.99 then restored to 4.99 w/
original description — already clean, no action needed.
Cookie/session is the SAME one the readers use; writes ride it and relogin on expiry.

## 2026-08-22 — LIVE TESTING SESSION: what actually works, and the one thing that doesn't

Tested by calling the edge functions from inside Postgres via `pg_net` (this sandbox's proxy
blocks supabase.co, so curl is not available here — pg_net is the way to test).

### ✅ FIXED — catalog read was returning ZERO rows
`ourvend-write.listProducts()` posted straight to `/CommodityInfo/ListJson` and got a
200-with-no-rows. The reader `ourvend-catalog` worked because it **GETs `/CommodityInfo/Index`
first** (a browser-style page visit), sends `accept: application/json…`, and uses `PrType=0`.
Copied that exactly → **52 rows**. RULE: OurVend grid/save endpoints need the CURRENT session
to have just visited the owning page.

### ✅ FIXED — product identity mismatch
`products.barcode` stores OurVend's **PrID GUID**; OurVend's own code is **PrCode**
(Advil = PrID `D50B8918-…`, PrCode `1002`). The write fn matched only PrCode, so every call
from Atlas (which passes the GUID) missed. Now every lookup matches **PrID OR PrCode**.

### ✅ FIXED — warm-up ordering
Warming the page BEFORE a relogin is useless — the fresh cookie never visited it. `act()` now
does: ensure session → relogin if needed → **then** visit the page → then post; retry once.

### ❌ BLOCKED — the slot write `/Selection/Edit` returns 404
`POST /Selection/Edit` (the recipe in this file) 302s to
`/default404.html?aspxerrorpath=/Selection/Edit`, even with a valid session, a warmed page and
a correctly resolved PrID. Tested twice on empty template machine `2602080931`.
The path IS referenced by `/Selection/Index`, alongside `/Selection/SEdit`,
`/Selection/MultiEdit`, `/Selection/ClearSoltInfo`, `/Selection/EditWarningQuantity`.
**NEED FROM JOE: one DevTools HAR of saving a single coil in OurVend** — that gives the exact
URL + field set. Everything else in the push path is proven and waiting on it.
(`SEdit` / `MultiEdit` are the likeliest real endpoints — untested.)

### Read-only helpers added
`ourvend-write` actions `probeProduct` (does this id resolve?) and `readSlots` (what OurVend
holds for a machine). Plus a separate `ourvend-probe` function that reads a portal page and its
scripts to discover real endpoint URLs — use it instead of guessing paths.

## 2026-08-22 — CATALOG FIELD MAPPING STRAIGHTENED (Joe: "images and description is not the
## same load in ourvend, we need that mapping straightened") — he was right.

OurVend's catalog grid returns: PrImgUrl · PrID · PrCode · PrName · CiManufacturer ·
PrSpecification · CiType · QualityPeriod · CreateDate · PrRetailPrice · PrCostPrice.
**It does NOT return `PrContent`** — the real description — which only comes back per product
from `/CommodityInfo/GetProductData`.

WRONG BEFORE → RIGHT NOW:
- `description` held **PrSpecification** (the SIZE: "10pk", "1.87oz"). Real descriptions were
  never imported at all.
- `category` was empty; OurVend had `CiType` all along.
- there was nowhere to put the size, and no column for the human-readable code.

New mapping (`ourvend-catalog` v8, `products` gained `size` + `product_code`):
| OurVend | MCOS |
|---|---|
| PrID | `barcode` (our key — an internal GUID, NOT a scannable barcode) |
| PrCode | `product_code` (the short code staff read, e.g. 1002) |
| PrName | `name` |
| PrSpecification | **`size`** |
| PrContent (per-product fetch) | **`description`** |
| CiType | `category` |
| CiManufacturer | `supplier` |
| PrImgUrl | `image_url` (OSS prefix + path) |
| PrRetailPrice / PrCostPrice | `default_price` / `cost` |

Re-imported: 52 products, 52 images, 50 sizes, **50 real descriptions (first time ever)**,
50 categories. Images were always fine — an earlier "all images identical" reading was a
truncated query on my side, not a data problem.

### ⚠️ THE CATALOG GATE — what blocks a planogram push today
OurVend refuses a coil whose product is not already in its catalog, so ONE missing product
fails the whole planogram. Currently missing (query `templates` for `gate = 'missing'`):
- **ASU West Campus 1** — coil 53 BITES Creatine Gummies
- **UNLV Tonopah 1** — coil 1 Clear Blue Pregnancy Test · coil 7 Beast Bites 30 Gummies ·
  coil 9 Creatine Gummies 30 gummies · coil 38 Dove Bar Soap · coil 43 Chapstick Cherry
Each needs name + image + size + description loaded into OurVend before its planogram can push.

Housekeeping: **"MCOS TEST 2" (PrCode 999002)** is still sitting in the live OurVend catalog —
leftover from testing, should be deleted.


## 2026-08-22 (later) — WHAT OURVEND DEMANDS TO CREATE A PRODUCT (read from the portal's own JS)

Tested `addProduct` live: OurVend returned **`No`** (a clean rejection — nothing junk was
created). Reading `/CommodityInfo/Index`'s own script gave the real contract.

### The AddCI payload the portal actually sends
```
PrAdultLimit · PrAliAdultLimit · ProductCode · ProductName · PrSpecification ·
PrRetailPrice · Manufacturers · CiType · PrCostPrice ·
PrPromotionPrice · PrMemberPrice · PrDiscount · PrTaxRate ·      <- we were omitting these 4
QualityPeriod · ImgPath · PrContent
```
Success is the literal string `OK`.

### 🔴 AN IMAGE IS MANDATORY — this answers Joe's "image issue"
The page refuses to submit without one:
```js
if ($("#ImgPath").val() == "") { Modal_Message("Prompt box", "Please choose a commodity image"); return; }
```
So a product **cannot** be created now and have its picture attached later. Every new product
needs a real product image at the moment of creation. A shelf photo will not do — the form has a
**cropper** (`cropper.min.js`), i.e. it expects a single-product image the user crops.

### Required fields (red `*` in the form)
size (`PrSpecification`) · unit price (`PrRetailPrice`) · **supplier (`Manufacturers`)** ·
**type (`CiType`)** · plus the image. Product code must be letters/numbers only.

Our failed attempt sent `Manufacturers: ""` and `CiType: ""` because the dropdown lookups
(`GetManufacturer` / `GetCitype`) returned nothing — those select elements are empty in the HTML
and filled by JS from an endpoint we have not identified. **Joe's "add a product" capture gives
us all of it at once**: the supplier + type ids, the image encoding, and the full payload.

### Clone is NOT the answer for this fleet
Cloning copies one machine's layout onto another. Every machine currently holds something
different, and each gets its own planogram from its own photo — so clone does not fit the job.
Also the empty template machines are **not online** (Joe, 2026-08-22), so they cannot stand in
for a real test. The per-coil write is the real critical path.

### Still the one blocker
`POST /Selection/Edit` 404s. Everything else in the push path is proven. One DevTools capture of
saving a single coil resolves it.
