# MCOS V2 Department Operating Matrix

## Purpose

Define every Command Center block as an independent department module with clear ownership, data, agent behavior, workflows, and page connections.

## Shared Department Contract

Each department must expose a Command Center summary:

- `departmentId`
- `departmentName`
- `status`
- `agentName`
- `ownerName`
- `criticalAlerts`
- `openTasks`
- `approvalRequests`
- `primaryMetrics`
- `lastUpdated`
- `nextAction`
- `linkedPage`

Each department page must be buildable independently.

## Department Matrix

### 1. Command Center

Agent: `FILLER_AGENT_COMMAND_CENTER`

Owns:

- dashboard layout
- approval queue
- executive alerts
- cross-department summary state

Reads:

- every department summary
- Vercel deployment status
- DigitalOcean server status
- communication/calendar feeds

Directives:

- never own department source records
- route work to the correct page
- display urgent status without exposing sensitive finance/credential details

### 2. Agent Management

Agent: `FILLER_AGENT_AGENT_MANAGER`

Owns:

- agent profiles
- permissions
- instructions
- task assignments
- action history

Connects to:

- all department pages
- approval queue
- audit log

Directives:

- agents use central MCOS data
- agents do not become source of truth
- permission changes require approval

### 3. Product Catalog

Agent: `FILLER_AGENT_PRODUCT`

Owns:

- product identity
- image references
- supplier item numbers
- cost/price fields
- voucher eligibility
- restrictions
- substitute mapping

Connects to:

- Machine Templates
- Inventory
- Purchasing
- Vouchers
- Reports

Directives:

- products exist before assignments
- products are independent from a machine or facility
- missing product facts use filler fields until replaced

### 4. Inventory

Agent: `Ava`

Owns:

- active slot stock
- machine storage stock
- campus closet stock
- in-transit status
- reorder/refill signals
- adjustments

Connects to:

- Product Catalog
- Machine Operations
- Restocking
- Supplier Purchasing
- Vouchers

Directives:

- inventory decides what is needed
- restocking executes field work
- purchasing is triggered from inventory rules

### 5. Restocking

Agent: `Marcus`

Owns:

- restock tasks
- work orders
- restocker assignment
- access/key notes
- proof/checklists
- task completion state

Connects to:

- Inventory
- Machine Operations
- Facilities
- Calendar/Logistics
- Contacts

Directives:

- every task must have machine, facility, products, quantities, access instructions, and proof status
- inventory updates only after completion/confirmation

### 6. Machine Operations

Agent: `Jeff`

Owns:

- active machine registry
- machine detail records
- status/alerts
- placement/access references
- service history

Connects to:

- Facilities
- Inventory
- Restocking
- Templates
- Payments
- Screen Access

Directives:

- internal machine page is private
- field/map view must hide sensitive information
- changes must be confirmed before becoming real

### 7. Machine Setup & Distribution

Agent: `Derek`

Owns:

- pre-live machine lifecycle
- shipping/logistics status
- setup checklist
- placement/go-live state
- setup blockers

Connects to:

- Facilities
- Documents
- Templates
- Inventory
- Payments
- Machine Operations

Directives:

- machine cannot go live without setup evidence and approval
- setup should preserve every blocker visibly

### 8. Machine Templates & Configuration

Agent: `Tessa`

Owns:

- reusable templates
- slot layout
- linked slots
- voucher category placement
- price/capacity assignments
- template versions

Connects to:

- Product Catalog
- Machine Setup
- Machine Operations
- Inventory
- Vouchers
- Facilities

Directives:

- templates define intended contents
- inventory shows actual contents
- linked slots must not be treated as empty inventory

### 9. Facilities

Agent: `FILLER_AGENT_FACILITIES`

Owns:

- facility rules
- contacts by role
- reporting requirements
- delivery/setup instructions
- restrictions
- location data

Connects to:

- Contacts
- Documents
- Machine Setup
- Machine Operations
- Inventory
- Restocking
- Reports
- Marketing

Directives:

- facilities are rule centers, not only addresses
- contacts should be linked from central directory

### 10. Supplier Purchasing

Agent: `FILLER_AGENT_PURCHASING`

Owns:

- reorder recommendations
- purchase requests
- supplier data
- item-number blockers
- shipment/receiving state

Connects to:

- Product Catalog
- Inventory
- Finance
- Documents
- Calendar/Logistics

Directives:

- no purchase without approval unless later authorized
- bundle orders economically

### 11. Payments / Card Readers

Agent: `FILLER_AGENT_PAYMENTS`

Owns:

- card reader provider records
- terminal-to-machine mapping
- sales reports
- settlement status
- provider support issues

Connects to:

- Machine Operations
- Finance
- Reports
- Facilities

Directives:

- card reader sales only
- voucher logic does not live here

### 12. Vouchers / Refunds / Customer Service

Agent: `FILLER_AGENT_SUPPORT`

Owns:

- support cases
- failed dispense queue
- refund review
- voucher exception handling

Connects to:

- Vouchers / Impact Ledger
- Machine Operations
- Inventory
- Payments
- Audit Logs

Directives:

- track customer-facing exceptions separately from payment-provider sales
- never send dispense command without verified safe path

### 13. Reporting / Compliance / Billing / Payouts

Agent: `FILLER_AGENT_REPORTING`

Owns:

- report schedules
- compliance output queue
- billing/payout report status
- export history

Connects to:

- Facilities
- Documents
- Finance
- Payments
- Vouchers
- Machine Operations
- Inventory

Directives:

- reporting pulls from source systems
- do not duplicate finance source of truth

### 14. Screen Access / Digital Platform

Agent: `FILLER_AGENT_SCREEN`

Owns:

- screen agent status
- interface proof records
- Android/YS/TCN access notes
- safe APK test status

Connects to:

- Machine Operations
- Vouchers
- Templates
- Product Catalog
- DigitalOcean services

Directives:

- no production dispense/control commands until verified
- first APK is non-control only
- use existing YS/TCN interface where possible

### 15. Marketing / Outreach / New School Integration

Agent: `FILLER_AGENT_MARKETING`

Owns:

- facility launch communications
- outreach campaigns
- announcement instructions
- new school onboarding communication

Connects to:

- Facilities
- Contacts
- Calendar
- Documents

Directives:

- use facility rules before sending communications
- keep launch messaging tied to facility setup status

### 16. Documents / Contracts / Licenses

Agent: `FILLER_AGENT_DOCUMENTS`

Owns:

- document records
- contract status
- license/compliance deadlines
- secure-vault references

Connects to:

- Facilities
- Finance
- Reporting
- Machine Setup
- Supplier Purchasing

Directives:

- do not store raw secrets in normal dashboard text
- track secure vault reference only

### 17. Contacts / Central Company Directory

Agent: `FILLER_AGENT_CONTACTS`

Owns:

- contact profiles
- contact roles
- facility/vendor/machine relationships
- verification status

Connects to:

- Facilities
- Restocking
- Setup
- Documents
- Marketing
- Payments

Directives:

- contacts live once
- pages link contacts by role

### 18. Calendar / Logistics

Agent: `FILLER_AGENT_LOGISTICS`

Owns:

- events
- delivery dates
- restock appointments
- setup meetings
- shipment reminders

Connects to:

- Command Center top bar
- Machine Setup
- Restocking
- Supplier Purchasing
- Facilities

Directives:

- every operational event should link to the related facility/machine/task

### 19. Maps / Machine Locator

Agent: `FILLER_AGENT_MAPS`

Owns:

- private machine location map
- placement photos
- GPS records
- field-safe route cards

Connects to:

- Facilities
- Machine Operations
- Restocking
- Setup
- Calendar/Logistics

Directives:

- separate private MCOS map from public business listing
- hide sensitive financial/system data in field view
