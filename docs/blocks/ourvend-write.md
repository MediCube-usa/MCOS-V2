# OurVend WRITE path — recovery record & plan

Written 2026-08-20 after Joe reported the write capability "lost". This file is the
permanent truth so this never has to be re-figured-out again.

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
