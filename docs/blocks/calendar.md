# Calendar, appointments & alerts (cross-block layer)

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
