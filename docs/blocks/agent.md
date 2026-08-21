# Atlas — the MCOS Command Agent (front-page chat)

SPEC v1 — captured from Joe's brain-dump 2026-08-20, built same day.

## What Joe asked for (his priorities, in order)
1. **The chat box goes INTO ATLAS** — the agent card on the Command Center front page.
   Get it up first.
2. **Connect it to the calendar** — Atlas must catch every date, who it's for and where
   it's going, and set reminders/alerts in each block box that needs to be looked at.
3. Later: come back and fill Atlas with **full exact info for each and every block**
   (per-block knowledge packs — not built yet).
4. Then go **directly to Inventory** (most important — see `docs/blocks/inventory.md`).

## How it works (v1, built)
- **Key**: `ANTHROPIC_API_KEY` environment variable on the Vercel project `mcos-v2-site`
  (Joe added it 2026-08-20, Production+Preview; Development locked on his plan — fine).
  Server-side only. Never in the repo, never in the browser (hard rule 5).
- **Route**: `POST /api/agent` (Next.js server route, `app/api/agent/route.ts`).
  Behind the site password gate — middleware.ts matches it, plus the route re-checks the
  cookie itself. `maxDuration = 60`.
- **Fresh data every request** (Joe: "refresh everytime … for all of our info"): the route
  re-reads Supabase on every message — live fleet slots (`live_slots` via getLiveFleet,
  kept current by the OurVend private-API crons), `products`, `machines` registry,
  `restock_tasks`, `setup_machines` pipeline, `machine_locations`, `warehouse_orders`,
  open `appointments`. All of it goes into the system prompt as a snapshot.
- **Model**: `claude-opus-5` (Anthropic API), adaptive thinking, effort medium,
  refusal fallback to `claude-opus-4-8` enabled server-side.
- **Calendar hookup (write path)**: one tool, `set_reminder` → inserts a row into the
  `appointments` table. That single write makes the reminder appear on the header
  calendar, the /calendar page, the ⏰ badge under the block's logo, and the alert rows
  on that block's page — the calendar layer already does all of that from the table.
  Department must be one of the real block ids so the badge lands on the right box.
  Server stores dates in Vegas time (date-only rows anchored to noon −07:00 so the day
  never shifts across timezones/DST).
- **Hard limits**: Atlas is READ-ONLY toward OurVend and the machines (hard rule 3) —
  it cannot change a price, product, or planogram anywhere; its only write is our own
  `appointments` table. It is told to answer only from the live snapshot and to say
  plainly when it doesn't have a number (hard rule 4 — no invented data).
- **UI**: `components/AgentChat.tsx` renders inside the agent card on the front page
  (Atlas badge kept, chat log + input in the card body). Neon styling in globals.css
  (`.atlas-*`).

## Not in v1 (noted, wanted later)
- Google Calendar events feed (the /api/gcal ICS feed) is not yet given to Atlas —
  block appointments and block-form dates are. Add when the knowledge packs land.
- Per-block knowledge packs ("full exact info for each and every block") — Joe will
  come back and fill these; keep a `docs/agent-knowledge/` folder in mind.
- Atlas taking actions in other blocks (creating restock tasks etc.) — one tool at a
  time, each needs Joe's sign-off.

## Roadmap locked with Joe (2026-08-20)
Atlas up → calendar reminders/alerts through Atlas → **INVENTORY in full** (see
inventory.md: exact per-machine contents, sales-driven tracking, ship/refill trigger
parameters, map card + text/email templates + instructional videos) → sweep every
block (products, planograms, images sorted per block) → fill the last 2 parked blocks
(Vouchers, Video Ads) when ready.

## Key troubleshooting (learned 2026-08-20)
The key must be ticked for the PRODUCTION environment in Vercel (Preview-only was
the original miss — the live site is a Production deployment). After any change to
the variable, a fresh deploy is required to load it. Atlas self-reports: ask it
anything and it says exactly whether a key is visible (names only, never values),
and it accepts an sk-ant- key under any variable name.

## ATLAS OPERATOR MODE — Joe's direction 2026-08-20 (read + WRITE + act)
Goal (Joe): Atlas doesn't just answer — it OPERATES the system with him. Update
OurVend, send refill orders, send purchase orders, work alongside him.

Atlas gets action tools, each wired to real backends:
- **OurVend writes** → the `ourvend-write` edge fn (editProduct, addProduct+image,
  deleteProduct; later price + planogram/coil). This is the MCOS→OurVend→machine push.
- **Refill orders** → create `restock_tasks` (already the restock pipeline) + send the
  map card + text/email template + instructional videos (inventory.md).
- **Purchase orders** → create `warehouse_orders` + send the PO to the supplier
  (Weiner's LTD etc. from supplier_links / contacts).

### SAFETY GATE (non-negotiable, = hard rule 3)
Every action that touches OurVend, a live machine, or sends something OUT to a
supplier/refiller is CONFIRM-FIRST: Atlas shows exactly what it will do (the product,
the price, the order, the recipient) and Joe taps approve before it fires. One item at
a time. Reads and our-own-DB writes (reminders, draft orders) need no gate. This is
what makes giving Atlas power safe on live partner machines — approve fast, but approve.

### Build order (proposed)
1. Verify Atlas itself is live (API key / real chat) — prerequisite.
2. Wire OurVend write tools into /api/agent with the confirm gate (edit price/desc/image,
   add product) — the highest-value "update my system" piece.
3. Refill-order tool (draft → approve → create task + send package).
4. Purchase-order tool (draft → approve → create order + send to supplier). Needs Joe to
   confirm send channel (email address/really send vs. draft-for-review) + supplier contacts.
5. Planogram/coil write once that capture exists.

## VOICE (2026-08-20)
Atlas box has 🎤 dictation (browser SpeechRecognition; phone keyboard mic is the universal fallback) + 🔊 spoken-reply toggle (SpeechSynthesis reads Atlas answers aloud). Front-end only, no extra service/cost, works on phone. Mic button only shows where the browser supports speech-to-text.
