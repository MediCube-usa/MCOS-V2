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

Status: SUPERSEDED on 2026-08-11 by Decision 10.

Original text, kept for the record: "Vercel serves the site. DigitalOcean is used for server-side services and machine/backend workloads where appropriate."

## Decision 10: DigitalOcean Plus Supabase Plus GitHub

Status: LOCKED

Authority: `00-foundation/source-captures/2026-08-11-block-decisions.md`

DigitalOcean runs the server. Supabase holds the data. GitHub holds blueprint and code. **Vercel is out, permanently.**

Supabase is the destination for MCOS 2 data, but stays empty until the machine write loop is proven on a real machine.

## Decision 11: ATLAS Is The Command Center Agent

Status: LOCKED

Authority: `00-foundation/source-captures/2026-08-11-block-decisions.md`

The Command Center agent is named ATLAS and sits top-right, where the logo currently is. It connects to every block, and each block's own agent reports up to it.

Which AI actually runs the ATLAS role is deliberately deferred until every block is laid out. That deferral is itself the decision.

## Decision 12: Each Block Runs As Its Own Workspace

Status: LOCKED

Authority: `00-foundation/source-captures/2026-08-11-block-decisions.md`

Every block has its own agent or agents, its own workflows, and its own workspace, built to one shared skeleton (`01-blueprints/block-anatomy.md`).

Floating blocks show live alerts on the face. Opening a block gives the full department workflow, not a preview of it.

## Decision 13: An Agent Is Configuration Only

Status: LOCKED

Authority: `00-foundation/source-captures/2026-08-11-block-decisions.md`

Extends Decision 8. An agent is skillset, workflow, and instructions — nothing else. It holds no data of its own.

This is what makes a block duplicatable, templatable, and leasable: copy the agent config, point it at a fresh empty data space, and no live business data travels with it.

## Decision 14: Machine Actions Go Through A Job Queue

Status: LOCKED

Authority: `00-foundation/source-captures/2026-08-11-block-decisions.md`

Nothing that acts on a machine is synchronous. Every machine-facing action is created as a job, sits pending, is picked up by the on-machine agent on its next check-in, and is then confirmed.

Every "do X to a machine" control is built as create-job → pending → confirmed. The serving side already exists: `services/mcos-agent-api` in `Medicube-MCOS`.

## Decision 15: Restocking Is A Routing Layer, Not An Employee Model

Status: LOCKED

Authority: `00-foundation/source-captures/2026-08-11-block-decisions.md`

Restocking routes work to whichever channel already serves a facility — Aramark, Sodexo, InstaWork, or a campus student initiative — and the facility record stores which. MCOS never touches the money that flows through those channels.

Access is by digital lock code, generated per visit. No physical keys, ever.

## Decision 16: Location Type Is One Shared Taxonomy

Status: LOCKED

Authority: `00-foundation/source-captures/2026-08-11-block-decisions.md`

`dorm / gym / campus-general / VA-military-stadium` recurs across Product Catalog, Facilities, and Templates. It is defined once as a shared reference and read by every block that needs it. It is never redefined per block.
