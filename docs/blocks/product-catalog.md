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

### Nayax in the planogram/push path (Joe: "check planogram with nayax")
- Nayax is the **card-reader / payment terminal** on the machines (per our specs, alongside
  Cantaloupe/Preva). Joe flagged that the **planogram must be checked/synced with Nayax** too.
- Likely meaning: on Nayax-equipped machines the product→selection→price list also has to
  match in **Nayax** (Nayax Core / MoMa portal), so a real push may be
  **MCOS → OurVend AND Nayax → machine**. This may BE "the strange way."
- BLOCKER: MCOS currently has **no Nayax connection** — no login, credentials, or API. We can
  reach OurVend (stored cookie) but not Nayax.
- NEED FROM JOE:
  1. Which machines use Nayax vs another reader (Cantaloupe/Preva)?
  2. Does the planogram/price actually live in Nayax too, or is Nayax read-only telemetry?
  3. Do we have a **Nayax portal login or API** we can connect the same way we did OurVend
     (capture the session / get an API token)? Without that, MCOS can't read or push to Nayax.

### CONFIRMED: Nayax Lynx API exists (from old Medicube-MCOS repo)
- Real REST API: base `https://lynx.nayax.com/operational`, Bearer-token auth, `/v1/...`
  endpoints. Code: `Medicube-MCOS/lib/integrations/nayax/lynx.ts` (+ probe route + agent).
- Auth env vars: `NAYAX_API_TOKEN` (or `NAYAX_LYNX_TOKEN`), `NAYAX_API_BASE_URL`.
- GAP 1 — token NOT in MCOS-V2: our Supabase `secrets` holds only `ourvend_cookie`. The Lynx
  token lives as an env var in the OLD app's deployment. **MCOS-V2 is not connected to Lynx
  yet.** To connect: store the Nayax token in `secrets` (same pattern as ourvend_cookie), and
  the edge function / a new Lynx reader uses it.
- GAP 2 — only `/v1/devices` was wired. No Lynx planogram/product-push endpoint built yet. In
  the old app, planograms came from **OurVend SoltInfo**, not Nayax. Lynx does expose
  product/machine-map endpoints on its API — to be wired once connected.
- KEY QUESTION: is the planogram pushed to the machine via **Lynx** or via **OurVend**? That
  decides where the write path is built.
- ACTION: Joe to provide the Nayax Lynx API token so MCOS-V2 can connect and probe what
  planogram/product data Lynx exposes for the account.

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
