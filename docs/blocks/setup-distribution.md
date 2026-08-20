# Block spec — Machine Setup / Ordered & Distribution

Status: SPEC v1 (Joe brain-dump 2026-08-19) — BUILT same day; REDESIGNED same day per Joe:
the 8 stages are COLORED COMMAND TABS (Order amber, Shipping cyan, Arrived blue, Warehouse
violet, Contract pink, Map card green, Setup lime, Verified mint). LIVE-USE REWORK
2026-08-20 per Joe ("no placeholder examples — I am finishing this site"): stage panels are
SOLID/opaque like the landing page (map backdrop no longer bleeds through), and every tab
renders its stage's ACTUAL WORKING FORM — not a description of it. A machine card opened on
a tab shows that stage's own fields first (Order = order form + protocol checklist; Shipping
= port/info/ETA; Contract = dates + campus; Map card = the full card fields; Setup =
TCN ID + router/TCN/decals checks; Verified = read-only recap + Machine Ops link), with a
"Show full record — every stage" toggle for everything at once. Invoice, paperwork, and the
signed contract each have a REAL document space: paste a link or upload the actual file
(Supabase Storage bucket `mcos-docs`, public read, anon upload verified live). Advancing
still follows the card to the next colored tab. Browser-verified with mocked rows: 13/13
checks (opaque panels, per-stage forms, uploads present, full-record toggle, no overflow).

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

## Data (additions 2026-08-20)
- `setup_machines.contract_url` — the signed contract file/link lives on the Contract tab.
- Storage bucket `mcos-docs` (public) — pipeline documents uploaded straight from the tabs
  land at `setup/<machine-id>/<kind>-<ts>.<ext>`; anon insert/select/update policies.

## Later / open
- Photo uploads on the map card (photos go up on the Google Maps site per the flow; the
  card tracks the "uploaded" state).
- Calendar sync for ETA/follow-ups (shows as date fields now).
