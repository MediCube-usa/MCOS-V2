# Block spec — Restocking

Status: SPEC v1 (Joe brain-dump 2026-08-19) — task pipeline BUILT same day on `/restocking`
(RestockBoard). The agent/automation layer (push, QR verify, auto email/Drive filing, text
bot) is specced here and wires up when the agent layer comes online.

Joe: "restocking is a tricky one."

## The flow (Joe, 2026-08-19)

1. **Trigger** — a restock is ordered/triggered → **alert sent to the refiller** with time
   and date. The first message can go to **Instawork, Aramark, or a random person/student —
   must be set up** as the refiller on the task.
2. **Accept / re-offer** — refiller accepts the time+date. **If no accept → it rolls to the
   following day** (re-offer).
3. **Map card** — once confirmed, the refiller receives the **machine map card** — the same
   mapping card used across departments (it "goes to a lot of different departments"):
   machine name, location, Google directions, **what times it must be filled**, contacts +
   numbers, photos of the machine hallway/location. The map card also carries **refilling
   videos, notes, documents**, and directions to the machine and through the machine.
4. **At the machine** — refiller checks in by **QR code or push notice to the backend** →
   verified → THEN the **key code to access the machine** is released (the lockbox code on
   the machine record).
5. **Replenish** — door opens, the machine's **replenish screen** shows exactly the product
   + amount to be replaced; refiller adds product per the screen. A **refill code for the
   replenish screen is sent through the agent after on-site verification**.
6. **Close out** — inventory verified → door closed → **photo taken and sent to the agent**
   → agent **files the code+photo into Google Drive and sends through email** → done.
7. **HARD RULE — refill never changes prices or slots.** Those are done through the
   departments (Catalog/Planograms/Machine Ops) BEFORE anything is sent to the machine.

## Second tab — Shipping refill
Same flow, but the refiller goes to **another location on campus first**: check in to
receive the shipment → then to the machine to refill → then **back-storage fill**. Needs
its own contact/instructions for the pickup point, and full directions for the whole run.

## Text bot (future, agent layer)
A **text bot available at the machine via QR code** for additional assistance; those agents
are equipped with campus/machine info, instructions, and contacts.

## Built now vs agent layer
- BUILT: `restock_tasks` pipeline (requested → alert sent → accepted → map card → at
  machine → filling → filled → filed/done), refiller setup (Instawork/Aramark/student/other
  + contact), scheduled date/time + accepted + roll-to-next-day re-offer date, map-card
  panel (links + refill videos/docs stored on the machine record), on-site verified toggle
  (QR/push later), lockbox key code reveal AFTER verify, refill-code generate + sent flag,
  **replenish list prefilled from the machine's live slots** (editable amounts; real
  capacities only — 199/99 defaults left blank), inventory-verified + photo link + Drive/
  email filed flags. Shipping-refill tab with pickup location, check-in contact,
  instructions, back-storage note.
- AGENT LAYER (later): actual SMS/push alerts to refillers, QR check-in, auto release of
  codes, photo intake, auto Google Drive filing + email, the at-machine text bot.

## Data
- `restock_tasks` (2026-08-19): task_type refill|shipping_refill, status, refiller_*,
  offer/schedule/re-offer dates, mapcard_sent, onsite_verified, access_code_sent,
  refill_code(+sent), replenish jsonb, inventory_verified, photo_url, filed_drive,
  filed_email, pickup_location, checkin_contact, checkin_instructions, backstorage_note.
- THE MAP CARD is canonical on the **Maps & Routes page** (`machine_locations` = the card
  table + refill videos/docs links on `machines`). Restock tasks show a read-only summary of
  the card and link to Maps & Routes for edits — one card, many departments, no doubles.
  Card contents: name/ID/campus, address, Google pin (directions there), WALK-OUT location,
  directions to the machine, directions THROUGH the machine, fill times, time of access,
  follow-up date, contacts + numbers (+extra), photos (machine/hallway/location), refilling
  videos + documents + notes, access notes. The lockbox KEY CODE is never on the card —
  it releases only after on-site verification.
