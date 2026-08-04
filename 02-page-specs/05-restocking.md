# Page Spec: Restocking

## Status

Status: LOCKED P1  
Date: 2026-08-04

## Purpose

Execute economical bundle-based field refills with clear machine allocations, delivery readiness, inventory confirmation, proof, and exception handling.

## Service Unit

The normal paid service unit is a bundle visit, initially budgeted at $35.

- one bundle may contain roughly three to five nearby machines
- each machine retains its own lines, slots, and quantities
- one distant machine may be its own $35 service unit
- standard low stock waits until the bundle is economically ready
- critical/cannot-run-out products may create an urgent exception visit

## Work Order Structure

Parent bundle work order:

- bundle/facility
- service cost
- receiving location
- expected/confirmed product delivery
- assignment window and urgency
- restocker
- access instructions
- overall status

Child machine stop:

- machine and exact placement
- ordered/available package label
- active-row quantities expected
- backup-storage quantities expected
- products/slots/rows to fill
- items to remove/swap
- post-service quantities
- photos/checklist
- exception report

## Timing Workflow

1. Inventory creates a justified bundle or critical refill recommendation.
2. If product is already available, work order can move to Ready.
3. If purchase is required, task remains Waiting for Product.
4. Supplier ship/tracking confirmation creates a provisional assignment and expected service window.
5. Restocker receives advance notice.
6. Carrier delivery confirmation changes task to Ready.
7. Restocker accepts and selects an allowed service time.
8. Urgent order may require completion on delivery day.
9. Normal order may allow delivery day through the next configured deadline.
10. Delay or failed delivery automatically shifts the window and alerts the agent.

## Field Workflow

1. Confirm assignment and product availability.
2. Pick up labeled package/tote at campus receiving.
3. Open first assigned machine.
4. Confirm machine/slot identity.
5. Refill active rows from allocated stock.
6. Place remaining allocated rows into machine storage.
7. Record active and backup quantities.
8. Record removals, swaps, damage, shortages, or wrong items.
9. Complete required maintenance checklist.
10. Upload proof.
11. Confirm machine closed.
12. Continue through bundle stops.
13. Submit bundle completion.
14. MCOS validates and posts inventory transactions.
15. Mismatches create reconciliation tasks; they do not disappear.

## Inventory Confirmation Method

Each work order declares one primary method:

- Yunshu/TCN screen replenishment operation, once verified
- MCOS mobile restock form
- Cantaloupe Seed Driver
- Nayax MoMa
- manual audited form

The restocker should not be required to update multiple systems for the same action. MCOS links provider/machine evidence and prevents duplicate posting.

### Cantaloupe

Seed Driver supports machine planograms, par/cap/pick/spoil/removed quantities, inventory updates, barcode scans, and photo/video accountability when available under the MediCube Seed account.

### Nayax

MoMa uses Nayax management credentials and can manage product maps, inventory, and picklists for Nayax-managed machines. Access/integration remains dependent on MediCube's granted Nayax permissions.

### Yunshu/TCN

The preferred common machine-side option is the existing Yunshu replenishment operation if live testing confirms that it reports the post-refill product/inventory change through the relay. It must be mapped to the MCOS work order before use as confirmation.

## Exception Handling

- product unavailable
- package missing
- damage
- shortage
- wrong product
- expired/short-dated product
- slot mismatch
- machine count mismatch
- access/key failure
- machine damage/fault
- provider app unavailable
- stale/offline machine

Exception quantity is not added to usable stock. Photos and disposition are required where applicable.

## Statuses

- Draft Recommendation
- Waiting for Approval
- Waiting for Product
- Shipment Confirmed
- Provisional Assignment
- Delivered / Ready
- Sent
- Accepted
- En Route
- At Location
- Bundle In Progress
- Awaiting Proof
- Awaiting Reconciliation
- Completed
- Blocked
- Exception
- Cancelled

## Agent Role

Restocking Agent Marcus:

- creates work order from approved Inventory recommendation
- sends provisional and ready notifications
- tracks acceptance, deadline, and bundle progress
- validates required proof
- coordinates discrepancies with Inventory
- cannot invent delivery confirmation or inventory quantities

## Alerts

- critical refill
- product/delivery delayed
- restocker not confirmed
- deadline at risk
- access issue
- incomplete bundle
- proof missing
- inventory mismatch
- damaged/short/wrong product
- provider/Yunshu confirmation unavailable

## Permissions

Restocker sees only assigned field-safe machine, facility, product, contact, access, and task information. Finance, supplier credentials, system secrets, and unrelated locations are hidden.

## Command Center Summary

- bundles ready
- critical single-machine visits
- provisional upcoming assignments
- overdue/blocked work
- product-delivery blockers
- proof/reconciliation exceptions
- actual service cost and completion time

## Acceptance Criteria

- a bundle is one paid visit while machine lines remain separate
- $35 cost and urgency are visible
- normal single-slot depletion does not automatically trigger service
- critical items can override economics
- delivery controls task readiness
- one primary field confirmation method avoids duplicate entry
- inventory posts only after validated completion
