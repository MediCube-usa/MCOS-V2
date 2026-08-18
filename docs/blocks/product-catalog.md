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
