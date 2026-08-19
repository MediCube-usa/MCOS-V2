# Block spec — Planograms / Templates

Status: SPEC v1 locked (2026-08-19). Phases 0–2 ready to build; Phase 4 push BLOCKED.
Last updated: 2026-08-19 (moved out of product-catalog.md — Joe: "planograms and templates
will be on another block"; the Catalog block keeps products/sales/research only).

This block OWNS: planogram authoring, assignment to machines, go-live tracking,
reconciliation vs live_slots, and (once unblocked) the push via OurVend clone-a-machine.
It CONSUMES products from the Product Catalog block — a product must exist there (and pass
the OurVend gate) before it can be placed in any planogram.

---

## PLANOGRAM SPEC v1 (locked with Joe, 2026-08-19)

1. **Planograms are for NEW machine setup, not retro-fits.** The current live machines keep
   the layouts they have. New machines get a planogram assigned in MCOS and edited as needed;
   a machine goes LIVE when refill staff place the products and set the **beginning inventory
   count at the machine**. (Live ≠ assigned: assignment is an MCOS state; live requires the
   physical fill + begin count.)
2. **Current live machines → Machine block now.** They stay live untouched; they need to be
   added/registered in the Machine block, and their inventory begin count is updated at the
   machine.
3. **CLONE ONLY (Joe, confirmed).** In OurVend a planogram gets onto a machine ONLY by cloning
   a machine. We set up template machines (not in use) and clone the template onto real
   machines. There is no per-slot push path to design around.
4. **IMAGES ONLY FROM THE PRELOADED CATALOG (Joe, confirmed).** OurVend accepts product
   images only from the preloaded catalog (Commodity Management), and products are loaded
   there **one at a time**. In MCOS we can hold whatever we want, but anything destined for
   OurVend must be generated from preloaded catalog products (image + description already in
   OurVend). The planogram editor therefore restricts slot products to catalog entries.

**Fleet observation (OurVend roster, verified 2026-08-19):** 14 machines sync. 7 report
slots — 5 fully configured (36–40 slots), 2 partial (10 and 1 slots) — and 7 report 0 slots
(presumed the new/unset machines). Joe says 13 machines are to be set up as planograms;
role flags in Phase 0 will reconcile the count.

**Standard coil layout (verified from live_slots, all machines share it):**
coils 1–29 odd-numbered (15 wide slots — bigger products), 31–51 continuous (21 standard
slots), 53–59 odd-numbered (4 wide slots) = 40 coils. Replace products like-for-like by
slot width. The visual coil map lives on the Product Catalog page (Coil Setup tab).

### Build plan (phases)
- **Phase 0 — Machine registry & roles.** A `machines` registry (machine_id, name, role:
  `live | new | template`, campus, notes), seeded from the 14-machine roster; Joe flags each
  machine's role in the UI. Puts the current live machines in the Machine block (Joe's #2).
- **Phase 1 — Planogram authoring (our DB only).** Create/edit planograms on THIS block:
  grid of coil → product → price → capacity. Product picker limited to `products` (the
  catalog gate, incl. images rule #4). Store in the existing `templates` table
  (id/name/description/status/slots jsonb). Status: `draft → ready`.
- **Phase 2 — Assignment & go-live tracking.** Assign a planogram to a `new` machine;
  status `assigned`; goes `live` when refill places product + begin count set at machine
  (manually confirmed at first). Reassignment/changes tracked.
- **Phase 3 — Reconciliation (read-only).** Once an assigned machine reports slots via the
  20-min sync, diff planogram vs `live_slots` coil-by-coil (product/price/capacity);
  "differs" flags expected for machine-side ES-folder prices.
- **Phase 4 — Push via clone (WRITE, blocked).** MCOS → OurVend → machine rides the
  clone-a-machine mechanism only (Joe's #3): set up the template machine in OurVend, clone
  onto targets. Blocked on Joe walking through the exact OurVend clone steps (screens,
  fields, what price does). Per-push explicit confirm. Everything stays read-only until that
  walkthrough happens.

### PLANOGRAM 01 — UNLV Tonopah (imported 2026-08-19, DRAFT)
- Source: Joe's `UNLV_Tonopah_Slot_Setup_1.xlsx` → `templates` row **"UNLV Tonopah 1"**
  (status `draft`, 40 slots: coil, product, capacity, purchase_price, retail_price,
  description, catalog barcode where matched).
- **Gate check vs the 49-product OurVend catalog:** 28 clean matches · 7 "check variant"
  (probable same product, size/form differs — Playtex 8 vs 10ct, Tylenol Extra Strength vial
  vs 8ct, Pepto 12 vs 8ct, ReNu 2oz vs 1oz, Degree Shower Clean vs Womens, AXE Roll vs Solid,
  Always Liners vs Pads) · **5 NOT in OurVend** (hard blockers, must be loaded one at a time
  with image + description): Clear Blue Pregnancy Test, Beast Bites 30 Gummies, Creatine
  Gummies 30, Dove Bar Soap, Chapstick Cherry.
- **5 sheet prices differ from OurVend cloud:** My Choice 17.99 vs 18.99 · ReNu 5.99 vs 6.99 ·
  Cottenelle 2.99 vs 3.99 · AXE Spray 2.99 vs 4.99 · Emergen-C 4.99 vs 3.99. Joe decides
  which side is right.
- Sheet's IMAGE column was broken (#VALUE!) — irrelevant: per rule #4 images come only from
  the preloaded OurVend catalog anyway.

### Still open for the push path (need Joe)
- The exact OurVend clone-a-machine steps (which screens/buttons, what gets copied).
- Creating a product in the OurVend catalog: exact screen + required fields (one at a time).
- Whether clone also sets price, or price stays machine-side (ES folder).
- Confirmation flow: per-push confirm before anything goes out (assumed yes).

### UI home
- Planogram authoring/assignment UI lives on the **Templates & Config** block
  (`app/templates-config`), NOT on Product Catalog. The `templates` table is its store.
