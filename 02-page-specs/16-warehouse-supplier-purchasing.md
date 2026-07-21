# Page Spec: Warehouse / Supplier Purchasing

## Status

Recovered from saved conversation as a named page/block with partial rules from Product, Inventory, Restocking, Setup, Documents, and Finance.

Needs Jordan confirmation before build.

## Purpose

Manage supplier ordering, purchase recommendations, wholesale item numbers, supplier sources, in-transit product, receiving, and movement into campus closet or machine storage.

This page should support the operating model where MediCube does not necessarily own a central warehouse.

## Recovered Rules

- Purchasing/supplier ordering is triggered from inventory rules, not from one random slot getting low.
- Product item numbers belong to the wholesale supplier or ordering source.
- Preferred supplier and backup supplier should be supported.
- Ordering should wait until location-wide need reaches a mathematically useful threshold.
- Delivery/order trigger should account for restocking cost, shipping cost, product velocity, voucher/critical exceptions, and contract type.
- Finance tracks supplier invoices and product order costs through QuickBooks.
- Documents/Secure Vault stores supplier agreements, purchase records, shipping records, logistics paperwork, invoices, and related contracts.

## Data Owned

- purchase recommendations
- supplier orders
- supplier/vendor references
- wholesale item numbers
- backup supplier item numbers
- order URLs/portal references
- case pack quantities
- shipping cost estimates
- lead times
- in-transit status
- receiving status
- destination campus office/closet
- warehouse/holding status where applicable

## Data Read

- Product Catalog supplier fields
- Inventory reorder recommendations
- Restocking demand
- Facility receiving rules
- Finance/QuickBooks invoices and costs
- Documents/Secure Vault supplier agreements
- Calendar/Logistics delivery dates

## Blocks / Tabs

Proposed from recovered rules, needs Jordan confirmation:

- Reorder recommendations
- Supplier list
- Purchase requests
- Open orders
- In-transit shipments
- Receiving
- Campus closet deliveries
- Supplier item numbers
- Exceptions

## Alerts

- reorder threshold met
- supplier item number missing
- preferred supplier unavailable
- product shipment delayed
- receiving not confirmed
- invoice missing
- shipping cost too high
- critical/voucher item below threshold

## Agent Role

Needs Jordan confirmation.

Likely role:

- prepare reorder recommendations
- bundle orders economically
- check supplier item numbers
- coordinate with Finance and Inventory
- require human approval before purchasing

## Command Center Block

Shows:

- purchase recommendations waiting
- orders in transit
- delayed shipments
- receiving exceptions
- missing supplier/item number blockers
