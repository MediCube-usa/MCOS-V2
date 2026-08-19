# Block spec — Machine Setup / Ordered & Distribution

Status: SPEC v1 (Joe brain-dump 2026-08-19) — BUILT same day on `/setup-distribution`
(SetupBoard reworked to this pipeline).

Joe: "this is really ordered and distribution." The lifecycle of a machine BEFORE it is
live: TCN order → shipping/port → Brendamour pickup → warehouse → contract → campus
distribution with the MAP CARD → setup (router/TCN/decals) → verified → hands off to
Machine Operations.

## The pipeline (stages, in order)

1. **Ordered** — ordered from TCN, verified what machine: model, **how many (qty)**,
   **color**, description, **type: fridge or non-fridge**. The purchasing protocol list is
   checked here (model/color/locks verified — these can still change: "may change machines
   or color or locks"). **Invoice** kept on the order (link/upload).
2. **Shipping** — port direction (**mostly Los Angeles** — default), all shipping info,
   paperwork, and calendar dates (order date, ETA).
3. **Arrived** — arrival at port; **Brendamour** does the pickup to the warehouse
   (pickup date).
4. **Warehouse** — received/staged (warehouse date).
5. **Contract** — after the campus contract, machines get shipped to campus (contract
   date, ship-to-campus date).
6. **Map card (distribution)** — "a big part of this." The map card is the **pinged
   location at the school — the actual WALK-OUT location**, not just the address:
   Google Maps pin/link, photos **uploaded on the Google Maps site**, directions with
   **time of access**, **contact numbers**, **calendar follow-up date**, and "map card
   sent" state.
7. **Setup** — machine set up on site and brought ONLINE with the router; **verified with
   router**, **registered with TCN**, **decals verified**.
8. **Verified** — done; the machine gets its TCN machine ID linked and lives on Machine
   Operations from here.

## Data
- `setup_machines` extended (2026-08-19) with: machine_type (fridge/non), qty, color,
  description, invoice_url, port (default Los Angeles), shipping_info, paperwork_url,
  order_date, arrived_date, pickup_date (Brendamour), warehouse_date, contract_date,
  campus_ship_date, walkout_location, google_maps_url, photos_uploaded, directions,
  access_time, contact_numbers, follow_up_date, map_card_sent, machine_id (TCN ID once
  known), router_verified, tcn_registered, decals_verified. `checklist` jsonb keeps the
  purchasing-protocol list (Model/Color/Locks/Invoice/Paperwork verified).
- When a machine is **verified** and has its TCN machine_id, it appears in the `machines`
  registry (Machine Ops) — address/access data is entered there (machine_locations feeds
  the Maps block). Map-card info lives on the setup record for the distribution run.

## Later / open
- File uploads for invoice/paperwork/photos ("upload there maybe later") — links for now.
- Calendar sync for ETA/follow-ups (shows as date fields now).
