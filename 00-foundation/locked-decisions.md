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

## Decision 10: MCOS V2 Is the Final Application

Status: LOCKED  
Date: 2026-08-04

MCOS V2 owns the permanent dashboard, data model, machine digital twins, workflows, approvals, reporting, and integrations. MCOS V1 remains temporary reference evidence and is archived only after V2 acceptance.

## Decision 11: Preserve Working Machine Behavior

Status: LOCKED  
Date: 2026-08-04

The working Yunshu/TCN touchscreen, vending behavior, payment behavior, and OurVend connection must not be replaced during the first MCOS V2 integration.

## Decision 12: MCOS Transparent Relay

Status: LOCKED  
Date: 2026-08-04

The first live-machine architecture places a transparent MCOS gateway relay between the machine and OurVend. The relay forwards upstream requests and downstream responses unchanged while copying both directions for MCOS processing.

## Decision 13: No Invented Machine Responses

Status: LOCKED  
Date: 2026-08-04

MCOS may not fabricate acknowledgements, success responses, dispense approvals, configuration responses, or other machine protocol behavior. Unknown behavior is forwarded to the proven upstream or quarantined outside the live path.

## Decision 14: Gateway and Application Ownership

Status: LOCKED  
Date: 2026-08-04

The gateway owns relay, raw capture, connection health, protocol classification, and translation delivery. MCOS V2 owns normalized data, digital twins, workflows, approvals, alerts, and the dashboard.

## Decision 15: Protocol Layers Remain Separate Until Proven

Status: LOCKED  
Date: 2026-08-04

The documented Yunshu V2.5 HTTP `FunCode` protocol and previously observed `###...` gateway frames are separate evidence layers until live capture proves their relationship.

## Decision 16: Blueprint and Build Before Machine Connection

Status: LOCKED  
Date: 2026-08-04

Complete and approve the MCOS V2 blueprint, build and verify staging, then connect one machine through the relay as a controlled canary. MCOS V1 will not be reconnected for testing.

## Decision 17: Functional Build Before Visual Redesign

Status: LOCKED  
Date: 2026-08-04

Complete architecture, data contracts, workflows, and functional application behavior before final logo, color, and dashboard visual redesign.
