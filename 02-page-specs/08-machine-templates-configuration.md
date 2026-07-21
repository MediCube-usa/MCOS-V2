# Page Spec: Machine Templates & Configuration

## Purpose

Build and manage reusable machine layouts.

Templates define what a machine should contain. Inventory shows what the machine actually contains.

## Template Types

- university/school
- gym
- hospital
- military/base
- campaign
- voucher-specific
- facility-specific
- machine model-specific
- restricted-product variant

## Data Owned

- template name
- version
- machine model compatibility
- physical slot layout
- single/double slot configuration
- linked slots
- product assignments
- product image reference
- product description reference
- capacity per slot/group
- retail price
- purchase cost reference
- voucher eligibility
- voucher placement/rules
- refill threshold
- machine storage target
- campus closet target
- product restrictions
- substitute product
- notes
- approval status
- effective date
- machines using this template

## Slot Layout Rules

- some products use two physical slots/coils
- example: slots 1 and 2 may become one product position
- second linked slot should not be treated as empty inventory
- template builder should visually support linked slots
- each product-slot assignment can override product default capacity
- product capacity depends on product size and slot layout

## Workflow

1. Build template.
2. Assign products from Product Catalog.
3. Set slot/linking configuration.
4. Set pricing/voucher rules.
5. Review restrictions.
6. Approve template.
7. Assign to machine during setup or planned change.
8. If changed later, create versioned change plan.
9. Restocker or setup team confirms physical setup.
10. Machine/inventory record activates after confirmation.

## Machine-Specific Overrides

A facility may prohibit a product.

Example: a school may not allow Plan B.

Override should replace product without changing the base template.

## Agent Role

Template Agent:

- suggested name: Tessa
- helps build templates
- tracks template versions
- coordinates with Product Catalog, Inventory, Machine Operations, and Restocking

## Alerts

- template incomplete
- unapproved template assigned
- slot conflict
- linked slot mismatch
- facility restriction conflict
- physical setup not confirmed

## Command Center Block

Shows:

- templates needing approval
- machines using outdated templates
- blocked slot/product changes
- facility restriction conflicts
