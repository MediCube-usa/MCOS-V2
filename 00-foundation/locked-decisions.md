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

## Decision 18: Universal Restocking Workflow

Status: LOCKED  
Date: 2026-08-04

MCOS sends every restock assignment and push notification. The restocker accepts the task in MCOS and uses the existing Yunshu Backstage Product Management -> Set Stock function at the machine. Nayax, Cantaloupe, Apriva, or other payment providers do not change the field protocol.

## Decision 19: Weiner's LTD Primary Supplier

Status: LOCKED  
Date: 2026-08-04

Weiner's LTD (`https://weinersltd.com/`) is the primary supplier. MCOS prepares the order from inventory demand, validates supplier and destination rules, and requires Jordan's manual approval before submission through the Weiner's account portal. Other suppliers use the shared supplier template.

## Decision 20: Customer-Facing Boundary

Status: LOCKED  
Date: 2026-08-05

`medicubehealth.net` is the customer-facing account, product/machine discovery, product-request, and support surface. MCOS V2 remains the private operating source of truth and is not exposed directly to customers.

## Decision 21: No-App / No-Wallet Customer Access

Status: LOCKED  
Date: 2026-08-05

Supported customer workflows do not require an installed app or digital wallet. A stable MediCube member number and PIN are the approved account direction, subject to production authentication, recovery, privacy, and abuse controls.

## Decision 22: Maya Customer Care Boundary

Status: LOCKED  
Date: 2026-08-05

Maya may identify cases, link evidence, draft remedies, communicate permitted status, and route work. Maya cannot invent dispense results, expose restricted data, approve its own refund/credit proposal, or close a case without recorded resolution evidence.

## Decision 23: Refund and MediCube Credit Separation

Status: LOCKED  
Date: 2026-08-05

Payment-provider refunds and immediate MediCube credits are separate remedies and separate transactions. Configured rules may allow fast internal credit, but duplicate value for the same loss is prohibited without an explicit corrective approval and reconciliation.

## Decision 24: Product Request Threshold

Status: LOCKED  
Date: 2026-08-05

One hundred verified customer votes creates a product-placement review task. It does not automatically purchase, place, price, or activate a product. Product, facility, supplier, economics, compliance, and machine-template reviews remain required.

## Decision 25: Customer Machine/Product Mapping

Status: LOCKED  
Date: 2026-08-05

Customer-facing views may map permitted facilities, machines, expected products, and sufficiently fresh availability. Sensitive placement instructions, internal stock, staff contacts, machine controls, and operational notes remain private.

## Decision 26: Sponsored Product Benefits

Status: LOCKED  
Date: 2026-08-05

Sponsored Product Benefits are funded, eligibility-controlled product entitlements owned by the Voucher/Impact domain. Campaigns may promote them; Payments, Campaigns, and Customer Care do not own eligibility or redemption evidence.

## Decision 27: MediCube Campaigns Boundary

Status: LOCKED  
Date: 2026-08-05

Marketing owns campaigns, approved outreach, promotions, coupons, competitions, and new-school communications. Campaign rules cannot override facility, compliance, product, pricing, voucher/benefit, inventory, finance, or machine-control ownership.

## Decision 28: Original Seven-Department Count

Status: LOCKED  
Date: 2026-08-05

The original seven-department completion count remains separate from Impact/Sponsored Product Benefits and Campaign workstreams. After the 2026-08-05 consolidation, Warehouse/Purchasing, Customer Care, and Marketing are complete as locked drafts: 3 of 7 complete, 4 remaining.
