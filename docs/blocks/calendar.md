# Calendar, appointments & alerts (cross-block layer)

Status: SPEC + BUILT 2026-08-20 (Joe: "google Calendar front page top right corner…
set appointments for every department… alerts and reminders that appear as alerts
in the front page of each block" + refinement: "not a stripe, just a small alert
under the logo in each box… just a small number — that is the command center's
purpose of the front boxes").

## What it is
- **Command Center, top right:** the Ready/Building/Parked/Machines pills are GONE.
  In their place the Google Calendar panel: Joe's live Google agenda (embed renders
  when signed into Google in that browser), an "open ↗" link to calendar.google.com,
  and the next appointments rolling up from every block — each with a one-click
  **＋GCal** add-to-Google-Calendar link.
- **Command Center boxes:** a small ⏰ count under each block's logo — the number of
  that department's appointment alerts (overdue / today / inside reminder window).
  Nothing shows when there's nothing to flag. The existing one-line alert in the
  box's blank space stays.
- **Every block page:** compact alert rows at the top (OVERDUE red / TODAY amber /
  COMING UP cyan) + a collapsible "Appointments & reminders" book: set new ones
  (what/date/time/alert-me/location/notes), mark done, remove, ＋GCal each.

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
