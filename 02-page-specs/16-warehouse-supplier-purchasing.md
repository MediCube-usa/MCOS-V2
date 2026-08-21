# Page Spec: Warehouse / Supplier Purchasing

## Status

Status: LOCKED P1  
Date: 2026-08-04

## Purpose

Create approved supplier orders from calculated inventory demand, route each shipment to the correct campus destination, track delivery, and reconcile receiving without requiring a MediCube central warehouse.

Purchasing does not decide demand. Inventory produces recommendations; Purchasing converts approved recommendations into supplier orders.

## Primary Supplier

Primary supplier: Weiner's LTD.

Required Winer supplier record:

- storefront: `https://weinersltd.com/`
- customer account/login: `https://account.weinersltd.com/`
- MediCube account reference
- ordering method: API, EDI, CSV/email purchase order, or web portal
- catalog and supplier SKU mapping
- case-pack and minimum-order rules
- price and availability source
- saved campus shipping destinations
- payment terms/reference
- order-confirmation source
- shipment/tracking notification source
- support/account-manager contact
- encrypted credential reference

Public Weiner's documentation confirms online account ordering, a downloadable weekly UPC catalog, a $100 minimum order, multiple shipping addresses/drop shipping, order notes, emailed confirmation/invoice, and emailed tracking. No supported ordering API has been verified. MCOS therefore begins with assisted ordering:

1. Agent imports or refreshes the Weiner's product subset from the weekly UPC catalog, then verifies live price and availability on the storefront.
2. Agent prepares a complete order draft.
3. MCOS validates the $100 minimum, quantities, destinations, pricing, availability, shipping, and order notes.
4. Jordan reviews and approves.
5. Approved order is submitted through the Weiner's account portal.
6. Confirmation number, invoice/receipt, and tracking evidence are attached to the MCOS purchase order.

No agent may complete checkout, submit payment, or change shipping destination without a valid approval.

## Verified Weiner's Operating Rules

- wholesale storefront: `https://weinersltd.com/`
- account portal: `https://account.weinersltd.com/`
- online ordering available continuously for registered accounts
- wholesale price and pack options displayed online
- downloadable UPC catalog updates weekly; live site remains authority for price/availability
- minimum order: $100
- multiple shipping addresses and drop shipping supported
- special quantity, expiration, packaging, and delivery requirements belong in order notes
- normal processing: approximately 1-2 business days
- normal continental U.S. ground transit: approximately 1-4 business days
- tracking is emailed when requested/account email is supplied
- invoice or credit-card receipt is emailed
- availability can change between cart preparation and order processing

## Additional Supplier Template

Every future supplier uses the same configurable connector record:

- supplier identity and contacts
- portal URL
- account/credential reference
- ordering method
- catalog-import method
- supplier SKU and product mapping
- pack size and minimums
- price and availability update method
- delivery regions and lead times
- shipping rules
- tax/payment terms
- returns/damage process
- order confirmation method
- tracking method
- invoice method
- automation permission level

Connector modes:

- supported API/EDI
- catalog/order file exchange
- emailed purchase order
- assisted web-portal order
- fully manual supplier

MCOS must not duplicate an entire supplier website. It keeps a supplier catalog subset and order template for products MediCube actually uses.

## Data Owned

- supplier records and connector configuration
- supplier-product/SKU mappings
- purchase recommendations accepted for ordering
- purchase requests
- purchase orders and lines
- destination/package groups
- order confirmation
- shipments/tracking
- receiving exceptions
- supplier performance
- approval and submission evidence

## Data Read

- Inventory demand recommendation
- Product Catalog records
- Facility receiving address/hours/rules
- Machine bundle
- Machine/template row capacity
- Restocking schedule
- critical-product rules
- Finance/QuickBooks references
- Documents supplier agreements
- Calendar/Logistics dates

## Main Page Blocks

- Order Recommendations
- Approval Queue
- Weiner's LTD
- Other Suppliers
- Supplier Products
- Draft Purchase Requests
- Approved/Open Orders
- Shipments and Tracking
- Destination Packages
- Receiving and Exceptions
- Supplier Performance
- Settings/Templates

## Purchase Workflow

1. Inventory calculates demand by machine, bundle, and destination.
2. Purchasing Agent groups lines by supplier and destination.
3. Lines remain tagged to their target machine and storage location.
4. Agent checks SKU, pack, price, availability, lead time, and shipping rules.
5. Agent creates purchase request and explains the trigger.
6. Jordan approves, edits, or rejects.
7. Approved request becomes a purchase order.
8. Order is submitted by the configured supplier method.
9. Confirmation, total, and expected delivery are recorded.
10. Tracking updates the shipment.
11. Shipment notification creates a provisional restock window.
12. Delivery confirmation makes the work order eligible for field execution.
13. Restocker confirms received quantities, damage, shortage, or wrong items.
14. Inventory transactions are posted.
15. Exceptions remain open until resolved.
16. Finance receives invoice/order references.

## Destination and Packaging Rules

- Each campus/facility has an approved receiving destination.
- One shipment may serve multiple machines in the same campus bundle.
- Purchase-order lines retain the exact target machine or campus-storage allocation.
- Packing instructions request machine-separated inner packages or labeled totes inside the consolidated shipment where the supplier supports it.
- Labels include bundle, machine, product, quantity, and storage destination.
- Products for different machines cannot lose allocation when consolidated.
- A shipment is not sent merely because one low noncritical slot exists; it should cover the planned replenishment period for the destination.

## Shipment and Restock Timing

- Expected delivery comes from supplier confirmation/tracking.
- When carrier acceptance/ship confirmation is received, MCOS sends the restocker a provisional assignment and expected window.
- Delivery confirmation changes the task to ready.
- Normal task may allow completion through the next business/day window configured for that facility.
- Critical stockout may require same-day completion after confirmed delivery.
- Restocker cannot post completion before product is confirmed available.
- Delay automatically recalculates the task window and raises an alert.

## Receiving and Exceptions

Restocker or receiving contact records:

- quantity received
- package/machine allocation
- damaged quantity
- missing quantity
- wrong item
- expired/short-dated product
- refused delivery
- photo evidence
- disposition: usable, quarantined, returned, discarded, unresolved

Only accepted usable quantity posts into inventory. Exception resolution can create supplier claim, replacement, credit, return, or write-off workflow.

## Purchase Approval

Human approval is required for every supplier order during the initial operating phase.

Approval shows:

- reason/order trigger
- machines and bundle served
- critical products
- requested products/quantities
- rows and days of coverage
- supplier/price/availability
- shipping/tax/total
- destination
- expected delivery
- estimated next service date
- exceptions and substitutes

## Agent Role

Purchasing Agent:

- receives inventory recommendations
- prepares Winer or other-supplier order drafts
- checks mappings, packs, prices, lead times, and destinations
- consolidates economically
- requests approval
- tracks confirmation and delivery
- opens receiving exceptions
- never approves or pays for its own order

## Alerts

- approval waiting
- supplier SKU missing
- price/availability changed
- critical item unavailable
- minimum/pack conflict
- shipping cost exception
- submission not confirmed
- shipment delayed
- delivery not confirmed
- shortage/damage/wrong item
- invoice missing

## Page States

- loading
- empty
- recommendation ready
- approval waiting
- approved
- submitted
- confirmed
- partially shipped
- in transit
- delivered
- receiving exception
- completed
- failed/disconnected

## Permissions and Audit

Supplier credentials are secure references only. Order preparation, approval, submission, destination change, price override, receipt, exception, return, and cancellation are audited.

## Command Center Summary

- recommendations waiting
- orders awaiting approval
- critical-product purchase blockers
- open orders and expected deliveries
- delayed shipments
- receiving exceptions
- missing supplier/SKU mappings
- next required action

## Acceptance Criteria

- Weiner's storefront, account portal, weekly UPC catalog, minimum order, multiple destinations, and tracking workflow are configured
- additional suppliers use the same template
- no order submits without Jordan's approval
- every line remains allocated to a bundle/machine/storage destination
- tracking controls restock readiness
- receiving exceptions do not inflate usable inventory
- purchase, shipment, restock, and inventory records reconcile
