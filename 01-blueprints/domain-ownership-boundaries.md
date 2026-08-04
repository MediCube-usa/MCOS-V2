# MCOS V2 Domain Ownership Boundaries

Status: LOCKED P0  
Date: 2026-08-04

## Rule

Each canonical record has one owning domain. Other pages read or reference it; they do not create competing copies.

## Ownership Matrix

### Product Catalog

Owns product identity, description, images, restrictions, supplier references, default cost/price, voucher eligibility, and substitutions.

### Inventory

Owns stock balances, counted quantities, adjustments, reservations, in-transit quantities, and refill/reorder signals.

### Restocking

Owns restock work orders, assigned field work, access checklist, expected quantities, completion proof, and exceptions. It does not directly declare inventory correct; confirmed completion produces inventory transactions.

### Purchasing

Owns purchase requests, purchase orders, supplier order status, shipments, receiving, and purchasing approvals. It reads inventory demand.

### Machine Operations

Owns canonical machine identity, current operational state, placement, service history, alerts, connection summary, and the digital-twin aggregate.

### Machine Setup & Distribution

Owns pre-live lifecycle, shipping, delivery, installation checklist, blockers, and go-live request. Once approved live, Machine Operations owns ongoing state.

### Machine Templates

Owns versioned desired slot layouts, product assignments, capacity, price rules, linked slots, restrictions, and activation plans. It never overwrites observed machine state.

### Screen Access

Owns screen-device/agent connection records, interface proof, software version, safe-test status, and screen-specific deployment history. Machine identity remains owned by Machine Operations.

### Facilities

Owns facility identity, addresses, rules, operating requirements, campus reporting requirements, and machine placement areas. Contacts remain canonical in Contacts.

### Contacts

Owns people/organization contact profiles, verified channels, roles, and relationship links.

### Payments

Owns payment provider, terminal mapping, provider transactions, settlement imports, fees, and support tickets. It does not own voucher redemption or company accounting.

### Vouchers / Impact Ledger

Owns voucher programs, eligibility decisions, redemption attempts/results, funding attribution, and impact records. It does not record voucher dispense as card-reader revenue.

### Customer Service / Refunds

Owns support cases, customer communications, refund requests/decisions, and case resolution. It references payment, voucher, dispense, machine, and inventory records.

### Finance

Owns accounting classifications, invoices, bills, payout obligations, reconciliations, and QuickBooks synchronization status.

### Reporting / Compliance

Owns report definitions, schedules, generated report versions, submission status, and export history. It reads source records from other domains.

### Documents

Owns document metadata, versions, signatures, expiration, access classification, and secure-vault references. It does not store raw credentials in normal records.

### Calendar / Logistics

Owns operational events, schedules, delivery/restock appointments, linked participants/resources, and conflicts.

### Maps

Owns geospatial views, verified coordinates, placement photos, route cards, and field-safe instructions; facility and machine IDs remain references.

### Marketing / Outreach

Owns campaigns, approved messages, launch tasks, audiences, and outreach status.

### Agent Management

Owns agent definitions, instructions, tool grants, department assignment, status, and action summaries. Audit owns the immutable action record.

### Command Center

Owns block layout, pins, executive brief configuration, and approval-queue presentation. It reads summaries and owns no departmental source records.

## Overlap Resolutions

- Payments records processor activity; Finance records company accounting; Reporting produces scheduled outputs.
- Voucher Ledger records eligibility/redemption; Customer Service records cases/refunds; Payments records card transactions.
- Inventory determines need and records quantity; Restocking executes movement; Purchasing acquires stock.
- Templates define desired machine layout; Machine Operations records actual state; Screen Access records interface/device access.
- Setup owns pre-live progression; Machine Operations owns the machine after go-live.
