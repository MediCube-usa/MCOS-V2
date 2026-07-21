# MCOS V2 Locked Decisions

## Decision 1: Clean V2 Source

Status: LOCKED

MCOS V2 will be set up as a clean source of truth, separate from the old MCOS repo.

## Decision 2: Blueprint First

Status: LOCKED

Jordan will review and approve detailed blueprints before Codex begins the site build.

## Decision 3: Command Center First

Status: LOCKED

Blueprinting begins at the Command Center / Main Dashboard, then moves page by page through the rest of the MCOS interface.

## Decision 4: Operating Dashboard, Not Marketing Site

Status: LOCKED

The MCOS V2 interface is a private operating system dashboard. It is not a public marketing website.

## Decision 5: Top Bar Is Company Communications

Status: LOCKED

The top bar should not be a generic search bar. It should function like a company communication dashboard with messages, support items, customer/phone messages, calendar events, meeting links, reminders, machine arrivals, product shipments, setup appointments, restocks, and urgent operating items.

## Decision 6: Sidebar Tabs Stay Consistent

Status: LOCKED

Sidebar tabs run down the side and remain consistent across pages.

## Decision 7: Command Center Blocks Mirror Pages

Status: LOCKED

Every major department appears as a Command Center block/card. Clicking a block opens the same destination as the matching sidebar tab.

## Decision 8: Agents Do Not Own Data

Status: LOCKED

Agents act on central MCOS data. They do not own the source of truth.

## Decision 9: Vercel Plus DigitalOcean

Status: LOCKED

Vercel serves the site. DigitalOcean is used for server-side services and machine/backend workloads where appropriate.
