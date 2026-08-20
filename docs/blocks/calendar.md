# Calendar, appointments & alerts (cross-block layer)

REVISION 3 (2026-08-20, Joe: "I want an actual real google calendar box in that corner,
dark mode, real and functionable… stay right here until this is completely working"):
- The header corner box is now a REAL INTERACTIVE MONTH CALENDAR (dark, agent-box width):
  month grid, ‹ › month nav, today marked, colored dots per block's items, red outline on
  NOT-MET days, click a day → its items, title click → /calendar.
- **/calendar page** — "see every single thing": full month grid, chips colored by block
  (click → the block), NOT-MET strip up top, legend, and the complete ordered list of
  every item. Linked from the header box.
- **NOT-MET intelligence**: every auto item knows whether its milestone actually happened
  (ETA↔arrived_date, pickup↔warehouse_date, ship-to-campus↔stage, follow-up↔map_card_sent,
  refill visit↔onsite_verified, re-offer↔accepted, order ETA↔status). Met = drops off the
  calendar. Date passed + not met = red NOT MET alert (page, box badge, calendar, /calendar
  strip) — "refiller didn't show / machine didn't reach port" alerts, live now.
- **Google hookup** (pending ONE input from Joe): create the MediCube ops Google account →
  Google Calendar → Settings → "Integrate calendar" → copy the Calendar ID → make the
  calendar public (Settings → Access permissions) → give the ID to Claude. Set it in
  `lib/config.ts` GCAL_EMBED_ID (or env NEXT_PUBLIC_GCAL_ID) and the TRUE Google grid
  renders in the corner box + /calendar, forced dark via CSS invert filter (.gcal-dark).
  Phase 2 (after account exists): Apps Script bridge on that account so MCOS writes events
  into Google automatically + invites workers (they RSVP; agents chase no-shows).

Status: SPEC + BUILT 2026-08-20 (Joe: "google Calendar front page top right corner…
set appointments for every department… alerts and reminders that appear as alerts
in the front page of each block" + refinement: "not a stripe, just a small alert
under the logo in each box… just a small number — that is the command center's
purpose of the front boxes").

## What it is (REVISED 2026-08-20 per Joe's edit list)
- **Command Center, header top right:** a COMPACT dark calendar panel, the size of the
  Command Agent box — next 3 appointments across all blocks, ＋GCal on each, link to
  Google Calendar. **NO embed, NO white background, NO personal Google account** —
  Joe explicitly does not want his personal calendar on the site. The embed of
  me.joejordan@gmail.com was removed. A MediCube ops Google account/calendar can be
  added later (Joe supplies the calendar ID); ＋GCal links land in whichever Google
  account the browser is signed into.
- **Command Center boxes:** the floating ready/building status tags are REMOVED (Joe:
  "I didn't ask for it"). The calendar alert is a ROUND BADGE the size of the block's
  logo, directly under the logo (⏰ + count) — not a stripe. Nothing shows at zero or
  when the block's reminders are off. Machine Setup block recolored ORANGE → RED
  (#ff3b3b, the only red on the page, per Joe).
- **Every block page:** compact alert rows at the top (OVERDUE red / TODAY amber /
  COMING UP cyan) + a collapsible "Appointments & reminders" book: set new ones
  (what/date/time/alert-me/location/notes), mark done, remove, ＋GCal each, and the
  **per-block reminder switch** — "🔔 Reminders & alerts for this block ON/OFF"
  (`block_settings` table): OFF kills the alert rows on the page, the box badge, and
  the block's rows in the header calendar. Set per page, exactly as Joe wanted.

## Data
- `appointments` table: department, title, starts_at, has_time, location, notes,
  remind_days_before, done. RLS public policies (site is password-gated).
- **Auto-appointments** — dates already typed into block forms appear by themselves,
  tagged with their source; edit the form and the appointment follows (never duplicated):
  setup_machines (ETA→"arrives at port", Brendamour pickup, ships to campus, map-card
  follow-up), restock_tasks (refill visit incl. time, re-offer date), machine_locations
  (location follow-up), warehouse_orders (order ETA).
- `lib/appointments.ts` = the one library (types, alert levels, Google Calendar URLs,
  fetchers, shared per-page cache for the 16 box counters).

## Google Calendar model (honest)
Link-based, no OAuth: ＋GCal opens Google's event template pre-filled; one click saves
it and Google fires its own phone/email reminders. The embed shows the live agenda.
MCOS alerts (box counts + block alert rows) come from our own table + block dates and
work with no Google login at all. If Joe later wants MCOS to write straight into his
Google Calendar server-side, that's an OAuth/service setup — ask first.
