# Page Spec: Command Center / Main Dashboard

## Purpose

Main operating landing page for MCOS V2. Shows the whole company at a glance and routes Jordan or internal operators into the correct department page.

## Data Owned

- dashboard block layout
- pinned executive alerts
- cross-department summary state
- approval queue
- Command Center Agent context

## Data Read

- all department summaries
- communication bar sources
- calendar/logistics
- machine status
- setup/distribution status
- inventory/restocking/purchasing status
- documents/contracts/compliance
- finance/payments/vouchers
- agent task queues

## Blocks / Tabs

The Command Center itself is the main dashboard. It contains department blocks/cards for each MCOS page.

Initial blocks:

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

## Agent Role

Command Center Agent:

- higher-clearance executive agent
- scans all departments
- summarizes urgent issues
- coordinates with page agents
- asks for Jordan approval
- later may connect to phone/voice

## Workflows

- review all department blocks
- open urgent items
- approve or reject agent requests
- assign work to page agents
- jump into page-specific workflows
- view upcoming company calendar/work events

## Alerts

- urgent messages
- machine down/offline
- restock blocked
- product shipment late
- setup appointment upcoming
- missing critical document
- contract signature waiting
- compliance deadline
- finance/payment issue
- voucher/dispense issue

## Manual Inputs

- pinned note
- urgent reminder
- manual status override
- approval/rejection
- task assignment

## Future Integrations

- company email
- phone/customer messages
- support messages
- Google Calendar
- Zoom/Google Meet
- DigitalOcean services
- Vercel deployment status
- machine gateway
- agents

## Command Center Block

This is the Command Center page itself.

## Acceptance Criteria

- The page is an operating dashboard, not a landing page.
- The top bar behaves like company communications.
- Each department block links to its page.
- Blocks show summary and urgent status.
- No invented data.
