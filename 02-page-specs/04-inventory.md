# Page Spec: Inventory

## Purpose

Source of truth for what products exist at each location and machine.

Inventory tracks current stock, backup stock, campus closet stock, in-transit stock, and reorder need.

Inventory receives machine live data and maps it into MCOS product/template records.

## Data Owned

- active machine row/slot stock
- machine internal storage stock
- campus receiving office / machine closet stock
- in-transit shipment stock
- wholesale supplier/source reference
- low thresholds
- reorder thresholds
- product velocity
- product swap/change history
- manual adjustments
- audit trail

## Important Rules

Inventory is not restocking.

- Inventory decides what is needed and where.
- Restocking executes the field task.
- Purchasing is triggered from inventory rules, not one random low slot.

Operating stock model:

- products can be ordered from supplier directly to campus office/closet
- MediCube does not need a central warehouse by default
- restocker picks up from campus office/closet
- machine internal storage should hold about two extra rows when practical
- product moves from campus closet to machine storage to active row/slot

## Triggers

- one full active row sells down: create refill alert
- do not necessarily order product yet
- supplier order waits for location-wide useful threshold
- order trigger accounts for second backup row around 50% across enough products
- trigger considers restocking cost, shipping cost, product velocity, and contract type

## Blocks / Tabs

- Location-level inventory
- Machine-level inventory
- Product-level inventory
- Low stock alerts
- Refill alerts
- Reorder recommendations
- In-transit shipment status
- Product velocity/sell-through
- Fast seller recommendations
- Product swap/change history
- Manual adjustments
- Audit trail

## Agent Role

Inventory Agent:

- suggested name: Ava
- detects low stock
- bundles refill needs
- recommends supplier orders
- sends restocking tasks to Restocking Agent
- updates after restock completion
- reports exceptions to Command Center Agent

## Alerts

- low active row
- out of stock
- backup storage low
- campus closet low
- in-transit delayed
- fast seller needs more rows
- mismatch between machine live count and restocker count

## Command Center Block

Shows:

- low/out-of-stock items
- restock needs
- reorder needs
- fast seller warnings
- inventory exceptions
