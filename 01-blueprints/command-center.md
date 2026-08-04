# Command Center Blueprint

## Status

Status: LOCKED P0

The information hierarchy, navigation, department summary, alert, approval, communications, agent, and page-state contracts are locked in `01-blueprints/command-center-contracts.md`.

## Purpose

The Command Center is the MCOS V2 main operating landing page.

It shows the whole company at a glance:

- all major departments
- urgent alerts
- open tasks
- progress
- calendar/company communications
- machine and operational status
- agent summaries

It is not a marketing landing page.

## Layout

The Command Center uses:

- persistent sidebar tabs down the side
- top communication bar
- modular dashboard blocks/cards
- scrollable department block grid
- Command Center Agent section

## Top Communication Bar

The top bar should include:

- company email/messages
- support/info messages
- phone/customer messages when connected
- calendar/upcoming events
- meetings
- Zoom/Google Meet links
- machine arrivals
- restock appointments
- product shipments
- setup appointments
- urgent reminders

Do not make the top bar primarily a generic search bar.

## Department Blocks

Each department block should:

- show the department name
- show summary status
- show urgent alerts
- show open tasks
- show a progress/status indicator where useful
- link to the matching sidebar page
- avoid duplicating the full page

## Initial Command Center Blocks

The recovered block list:

- Agent Management
- Product Catalog
- Inventory
- Restocking
- Machine Operations
- Machine Setup & Distribution
- Machine Templates & Configuration
- Facilities
- Warehouse/Supplier Purchasing
- Payments / Card Reader / Financial Operations
- Vouchers / Refunds / Customer Service
- Reporting / Compliance / Billing / Payouts
- Screen Access / Digital Platform
- Marketing / Outreach / New School Integration
- Documents / Contracts / Licenses
- Contacts / Central Company Directory
- Calendar / Logistics
- Maps / Machine Locator

## Command Center Agent

The Command Center Agent is separate from regular page agents.

Role:

- higher clearance than page agents
- executive operations agent
- scans all dashboard blocks/departments
- summarizes urgent issues
- coordinates with page agents
- asks Jordan for authorization
- later may connect to Jordan's phone
- later may support voice interaction

Initial version can be text/chat based.

## Alerts

The Command Center should surface:

- urgent machine issues
- blocked setup/delivery items
- restock exceptions
- low or out-of-stock items
- missing documents
- contracts awaiting signature
- compliance deadlines
- payment/card reader setup blockers
- voucher/dispense issues
- messages requiring response
- upcoming machine arrivals/restocks/meetings

## Manual Inputs

Early version can allow manual input for:

- reminders
- operating notes
- task status
- meeting/setup/restock dates
- urgent alerts
- blocked items

## Data Read

The Command Center reads summary data from:

- every department page
- calendar/logistics
- agents/task queues
- communication sources when connected
- machine/inventory systems
- documents/contracts
- finance/payments
- vouchers/impact ledger

## Data Owned

The Command Center should own:

- executive dashboard layout
- pinned operating alerts
- Command Center Agent instructions
- cross-department summary state
- Jordan approval queue

It should not own department records that belong in page-specific systems.

## Build Acceptance Criteria

- Sidebar and Command Center blocks match the approved page list.
- Top communication bar is present and not a generic search-first header.
- Every block links to its page.
- Every block has defined summary fields.
- No block invents production data.
- Command Center Agent is visually and functionally separate from page agents.
- Page is designed as an operating dashboard, not a marketing screen.
