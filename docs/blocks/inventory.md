# Inventory — the full system

SPEC v0 — Joe's brain-dump captured 2026-08-20. **This is the next big build after
Atlas.** Joe: "most important." Nothing below is built yet unless marked; this file is
the anti-forgetting insurance so we "can not get lost at the last min."

## The problem, in Joe's words
We do not have a way to find out what is EXACTLY in each machine. The inventory system
needs to be set up in full: each machine, what each machine has in each slot.

## What the full system must do
1. **Exact per-machine contents** — for every machine, every coil: what product, how
   many, verified — not just the OurVend stock counter. (Investigate first: how close
   is `live_slots` stock to truth; where it drifts; what a physical-count workflow
   adds. The OurVend private API connection refreshes everything ~20 min — that stays
   the source; see CLAUDE.md THE OURVEND CONNECTION.)
2. **Tracking inventory from sales** — sales draw down the counts. Sell-through
   counter already running (`slot_history` snapshots each :05/:25/:45 +
   `product_sales_estimate` view); exact OurVend sales grid still gated server-side
   (one-time browser capture would unlock exact history — see product-catalog.md).
3. **Trigger parameters** — Joe sets the rules for WHEN things go back out:
   - when a SHIPPING (warehouse → campus back-storage) order goes out
   - when a REFILL order (refiller visit) goes out
   Thresholds per machine/product (e.g. stock % or units), creating the task
   automatically when crossed → lands in Restocking as a task.
4. **What ships WITH every order** — when a refill/shipping order goes out, the
   package that goes to the refiller must include, together:
   - the MAP CARD (machine_locations — already built on Maps & Routes)
   - a TEXT or EMAIL TEMPLATE carrying the instructions
   - preloaded INSTRUCTIONAL VIDEOS (links on the machine record)
   - the map link, the directions, the LOCK instructions (key/refill codes still only
     after on-site verify — restocking.md rule stands)
   Placeholders are OK to keep moving ("even space holder to move ahead") — build the
   template + wiring with placeholder video links Joe fills later.

## Then: the whole-site sweep (after inventory)
Go back through EACH AND EVERY block: get all the products, the planograms, the
images — sort out everything per block. Fill in the last 2 parked blocks (Vouchers,
Video Ads) when we are ready. Over each department, get all of these things done.

## Existing pieces to build on (do not rebuild)
- `live_slots` (~204 slots, 20-min fresh) + `lib/live-slots.ts` fallback logic
- `slot_history` sell-through snapshots + `product_sales_estimate`
- `restock_tasks` pipeline + refiller flow (restocking.md)
- Map cards on `machine_locations` (maps.md) + refill videos/docs links on `machines`
- Storage bucket `mcos-docs` for uploads
- Atlas (`/api/agent`) can read all of it and set reminders
