# Command Center Full Operating System Blueprint

## Status

Status: BUILD-AUTHORIZED

Jordan authorized completion of the full Command Center and department/block framework before further review.

## Objective

The Command Center is the executive operating page for MCOS V2.

It must show every department/block, what matters now, who or what agent owns the next action, what data feeds the block, what data the block owns, what alerts are active, and where the operator goes next.

## Page Shell

The page shell includes:

- persistent left sidebar
- top communication bar
- Command Center Agent panel
- approval queue
- department/block grid
- urgent operating strip
- calendar/logistics strip
- system/server/deployment status strip

## Top Communication Bar

The top communication bar is company operations, not generic search.

### Sections

- Company messages
- Support / customer messages
- Phone / voicemail queue
- Calendar / meetings
- Machine arrivals
- Restocks scheduled
- Product shipments
- Setup appointments
- Urgent reminders
- Vercel deployment status
- DigitalOcean server status

### Filler Data

Use filler sources until integrations are connected:

- `FILLER_EMAIL_COMPANY@example.com`
- `FILLER_PHONE_COMPANY`
- `FILLER_CALENDAR_PRIMARY`
- `FILLER_ZOOM_LINK`
- `FILLER_DIGITALOCEAN_SERVICE`
- `FILLER_VERCEL_PROJECT`

## Command Center Agent

### Role

The Command Center Agent is the executive supervisor.

It can:

- scan every department block
- summarize urgent issues
- coordinate page agents
- request Jordan approval
- route work to the correct department
- watch cross-department blockers
- prepare daily operating brief

It cannot:

- own source-of-truth records
- approve money movement without permission
- send machine dispense commands
- expose sensitive credentials
- overwrite department rules

### Agent Inputs

- department summaries
- alert queues
- approval queue
- calendar/logistics items
- Vercel status
- DigitalOcean status
- machine/screen/gateway status
- document/compliance deadlines
- finance/payment blockers

### Agent Outputs

- daily operating summary
- urgent action list
- approval requests
- delegated tasks
- cross-department blocker report
- follow-up reminders

## Command Center Block Requirements

Every department block must include:

- department name
- agent name or agent placeholder
- status
- owner
- top metrics
- urgent alerts
- open tasks
- data sources
- linked page
- next action
- approval needed indicator

## Department Blocks

### Agent Management

Shows:

- active agents
- blocked agents
- approvals waiting
- new instructions pending
- recent agent actions

Next actions:

- review blocked agent
- approve task
- update permissions
- assign department owner

### Product Catalog

Shows:

- incomplete products
- products missing image
- products missing supplier/item number
- products missing cost/price
- products blocked by restriction

Next actions:

- add product
- complete product record
- assign supplier
- approve substitute

### Inventory

Shows:

- low stock
- out of stock
- refill alerts
- reorder recommendations
- fast sellers
- count mismatches

Next actions:

- create restock task
- recommend supplier order
- request manual count
- review exception

### Restocking

Shows:

- open work orders
- overdue tasks
- restocker confirmations
- access/key blockers
- photo proof missing
- exceptions

Next actions:

- assign restocker
- send work order
- provide access instructions
- verify completion

### Machine Operations

Shows:

- online machines
- offline machines
- stale machines
- machine alerts
- service needed
- payment reader issue
- screen access status

Next actions:

- open machine detail
- request service
- request restock
- review alert
- open screen access

### Machine Setup & Distribution

Shows:

- machines ordered
- machines in shipping
- machines awaiting delivery
- machines placed
- machines ready for live approval
- setup blockers

Next actions:

- update setup stage
- assign facility
- schedule delivery
- attach setup document
- approve go-live

### Machine Templates & Configuration

Shows:

- templates needing approval
- slot conflicts
- linked-slot issues
- facility restriction conflicts
- machines using outdated template

Next actions:

- open template
- approve version
- create change plan
- assign setup/restock confirmation

### Facilities

Shows:

- active facilities
- missing contacts
- upcoming facility events
- reporting rules due
- delivery/setup blockers
- restriction conflicts

Next actions:

- complete facility profile
- assign contacts
- update reporting rule
- open facility machines

### Warehouse / Supplier Purchasing

Shows:

- reorder recommendations
- open purchase requests
- supplier/item-number blockers
- delayed shipments
- receiving exceptions

Next actions:

- prepare order
- approve purchase request
- update shipment
- confirm receiving

### Payments / Card Reader / Financial Operations

Shows:

- reader install blockers
- missing sales reports
- settlement/report mismatches
- provider support tickets
- finance approval needed

Next actions:

- open provider record
- review sales report
- reconcile settlement
- route finance item

### Vouchers / Refunds / Customer Service

Shows:

- failed dispense support items
- voucher redemption exceptions
- refund review queue
- customer support cases
- repeated machine/slot issue

Next actions:

- open support case
- review redemption
- route refund decision
- escalate machine issue

### Reporting / Compliance / Billing / Payouts

Shows:

- reports due
- compliance deadlines
- payout reports pending
- missing report data
- approval-needed reports

Next actions:

- prepare report
- open compliance item
- route finance/payout review
- export approved report

### Screen Access / Digital Platform

Shows:

- screen agent check-in
- Android/interface route status
- SDK/filesystem proof status
- no-control safety status
- voucher/screen-control blockers

Next actions:

- open screen access detail
- review latest check-in
- prepare safe APK test
- verify interface path

### Marketing / Outreach / New School Integration

Shows:

- facility launch announcements
- outreach tasks
- school integration status
- promo instructions
- content needing approval

Next actions:

- draft announcement
- assign contact
- schedule launch message
- attach facility rule

### Documents / Contracts / Licenses

Shows:

- missing critical docs
- contracts awaiting signature
- expiring documents
- compliance blockers
- secure-vault references needing update

Next actions:

- upload document
- request signature
- assign owner
- update expiration date

### Contacts / Central Company Directory

Shows:

- missing facility contacts
- unassigned contact roles
- duplicate contacts
- contacts needing verification

Next actions:

- add contact
- assign role
- verify contact
- link to facility/vendor/machine

### Calendar / Logistics

Shows:

- today calendar
- machine delivery dates
- restock appointments
- shipment dates
- setup meetings
- unresolved schedule conflicts

Next actions:

- schedule event
- assign owner
- link to facility/machine
- resolve conflict

### Maps / Machine Locator

Shows:

- facility map
- machine placement map
- route-ready field tasks
- machines missing GPS/photo
- private field instructions

Next actions:

- open machine location
- add placement photo
- update GPS
- create delivery/restock route

## Urgent Operating Strip

The Command Center should show a top urgent strip with:

- critical machine offline
- failed dispense/support case
- restock overdue
- missing compliance document
- shipment delayed
- payment/card reader issue
- approval waiting from Jordan

## Approval Queue

Approval queue items:

- purchase approval
- template approval
- machine go-live approval
- finance/payout approval
- voucher/refund decision
- agent permission change
- production control/screen access action

## Cross-Department Workflow Examples

### Low Stock To Restock

Inventory detects low stock -> Restocking receives task -> Restocker completes work -> Inventory updates -> Command Center clears alert.

### New Machine Setup

Machine Setup receives order -> Facilities receives destination/rules -> Templates assigns layout -> Product/Inventory assigns initial stock -> Payments configures reader -> Screen Access verifies interface -> Machine Operations approves live -> Command Center marks live.

### Voucher Redemption Exception

Voucher ledger records issue -> Customer Service opens case -> Machine Operations checks machine/slot -> Inventory checks stock impact -> Finance/Impact reporting receives outcome -> Command Center tracks unresolved case.

### Facility Reporting

Facility stores reporting rule -> Payments/Finance/Vouchers provide source data -> Reporting prepares output -> Documents stores contract basis -> Command Center shows due/approved state.

## Build Directive

Build this as a complete operating framework first.

Use filler values where exact records are missing.

Keep each department modular so it can be expanded, replaced, or corrected later without patching unrelated pages.
