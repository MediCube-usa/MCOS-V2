# Page Spec: Product Catalog

## Purpose

Master product database for MCOS V2.

Products exist here before being assigned to templates, machines, inventory, restocking, purchasing, vouchers, or reports.

Partner can manually add products now. Agents can help later after records and rules exist.

## Data Owned

- MCOS product ID
- internal SKU
- product name
- brand
- category
- description
- product image(s)
- package size/count
- dimensions if needed
- compatibility notes
- single-slot capacity
- double-slot capacity
- default row/slot capacity
- default refill threshold
- default backup quantity target
- retail price
- purchase price/cost
- margin inputs
- voucher reimbursement price
- voucher eligibility
- compliance/location restrictions
- preferred wholesale supplier
- supplier/warehouse item number
- backup supplier
- backup supplier item number
- ordering URL or purchasing portal reference
- case pack quantity
- shipping cost estimate
- lead time
- substitute/replacement products
- active/inactive status
- notes/history

## Important Rules

- The Tonopah spreadsheet is only an initial template/source document.
- Product records must not be limited to the Tonopah sheet.
- A product can exist even if it is not assigned to any machine.
- A product can have multiple supplier item numbers.
- Preferred and backup supplier should be supported.
- Brand changes should preserve history and allow substitute mapping.

## Blocks / Tabs

- Product list
- Add/edit product
- Images
- Supplier/source data
- Pricing/cost/margin
- Slot capacity defaults
- Voucher eligibility
- Compliance/location restrictions
- Substitutes
- History/notes

## Workflows

- add product manually
- update product details
- attach image
- add supplier item number
- set default capacity/threshold
- map to template
- mark substitute
- deactivate product

## Alerts

- missing item number
- missing supplier
- missing image
- missing price/cost
- product assigned to template but incomplete
- compliance restriction conflict

## Agent Role

Future Product/Catalog Agent:

- helps add and maintain products
- learns from partner behavior
- assists with price updates
- identifies substitutes
- prepares purchasing recommendations
- requires human approval for purchasing

## Command Center Block

Shows:

- incomplete product records
- products missing supplier/item number
- products needing image/price/cost
- products blocked by compliance/restriction issue
