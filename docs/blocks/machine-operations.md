# Block spec — Machine Operations

Status: SPEC v1 (Joe brain-dump, 2026-08-19 — captured verbatim-in-spirit, not yet built to
this spec). Build AFTER the Product Catalog block is completely done (Joe's sequencing).

Machine Operations = the LIVE machines, after go-live. "Basically a history and operation of
the machine."

## What this block must do (Joe, 2026-08-19)

A list of the machines; click a machine to open its record. Per machine:

1. **Identity** — name (label), machine ID, campus/location.
2. **Registration** — all machines are registered through OurVend (registration state noted
   on the machine record).
3. **Planogram of that machine** — click in and SEE what's in the machine (products per
   coil). From here: **product swap** and **price change** actions (these ride the same
   write-path rules — read-only until the OurVend push is unlocked; per-change confirm).
4. **Payments hardware** — which credit card reader the machine uses: Nayax / Cantaloupe /
   "Previa" (Joe's word — confirm exact brand, possibly PayRange/Payter).
5. **Connectivity** — the online service / internet the machine uses (what carrier/router,
   anything that goes with the machine).
6. **Access** — lock code / key code and WHERE it is. (machine_locations already holds
   access_code / access_notes — reuse, don't duplicate.)
7. **Apps** — any apps or software we put on the machine, noted per machine.
8. **Maintenance & history** — service history, issues; more to come later ("there'll be
   things that will come up later").

## Data notes
- `machines` registry (built 2026-08-19 on the planogram work) already holds: machine_id,
  label, role, campus, notes, assigned_template_id, go_live_confirmed. Machine Ops extends
  it (reader type, connectivity, apps, registration state) rather than making a new table.
- `machine_locations` holds address/lat-lng/access codes — the Machine Ops record should
  join both, plus `live_slots` for the live planogram view.
- Real labels are known (UNLV Tonopah Hall, UNLV Dayton Complex, ASU West Glendale, ASU
  Noble Library, ASU PolyTech South, ASU Breezeway Main Campus, ASU Downtown City Center,
  ASU Hayden Library, Murad, CSUDH Front Hall + 4 unassigned) — seeded into `machines`.

## Build order (when this block starts)
1. Extend `machines` with: reader_type, connectivity, apps, registered_ourvend (+ dates).
2. Machine list page (live role first) → machine record: identity, registration, payments,
   connectivity, access (from machine_locations), live planogram (from live_slots),
   maintenance log (new table `machine_events`).
3. Product swap / price change actions — UI only + queued intent until the OurVend write
   path is unlocked (clone/push rules per docs/blocks/planograms.md).
