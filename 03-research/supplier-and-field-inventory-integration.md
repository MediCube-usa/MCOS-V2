# Supplier and Field Inventory Integration Research

Date: 2026-08-04  
Status: VERIFIED PUBLIC CAPABILITIES / ACCOUNT ACCESS REQUIRED

## Winer LTD

The exact MediCube Winer LTD portal could not be identified from public search. No verified public API, EDI specification, or customer-login URL was found for the supplier described by Jordan.

Decision:

- configure Winer as the primary supplier
- begin with assisted portal ordering and mandatory human approval
- do not invent an API
- require the exact Winer login URL/account documentation before choosing portal automation, API, EDI, email PO, or catalog import

## Cantaloupe Seed Driver

Official Cantaloupe material states that Seed Driver supports direct product inventory entry, full inventories or spot checks, par/cap/pick/spoil/removed quantities, planogram-based restocking, barcode scanning, photo/video audits, and route completion status.

Seed Pro additionally supports dynamic route scheduling and machine-specific pre-kitting.

Sources:

- https://www.cantaloupe.com/products/software/seed-driver/
- https://www.cantaloupe.com/products/software/seed-pro/

MCOS decision:

- treat Seed Driver as an optional field execution/evidence source for Cantaloupe-managed machines
- confirm MediCube's Seed subscription and data/API/export permissions
- do not make Cantaloupe the canonical MCOS inventory owner

## Nayax MoMa

Official Nayax material states that MoMa uses Nayax Core/management credentials and supports machine search, product maps, inventory management, picklists, product changes, and monitoring. Nayax also states that its Management Suite supports VDI integration with third-party back-office systems.

Sources:

- https://nayax-u.nayax.com/scenario/help-center-moma-15380
- https://nayax-u.nayax.com/scenario/how-to-add-products-update-prices-and-manage-69771
- https://www.nayax.com/contact-support/management-suite-faqs/

MCOS decision:

- treat MoMa as an optional field execution/evidence source for Nayax-managed machines
- do not depend on it where API/account permissions are unavailable
- do not make Nayax the canonical MCOS inventory owner

## Yunshu/TCN

The supplied Yunshu operations manual includes local replenishment/product management. The supplied V2.5 protocol states that product-data changes, including replenishment changes, trigger machine reporting through the product/slot upload interface.

MCOS decision:

- test Yunshu local replenishment as the preferred common machine-side confirmation
- prove the exact resulting message and inventory mapping through the relay
- keep the test observation-only and reversible
- do not claim integration until a complete before/refill/after capture reconciles

## One-Confirmation Rule

Each machine/work order uses one primary field confirmation method. Other system messages are supporting evidence. MCOS reconciles them into one inventory transaction so Seed, MoMa, Yunshu, and manual updates cannot double-count the same refill.

## Required Next Evidence

- exact Winer portal/login URL
- Winer ordering/account guide or account-manager confirmation
- whether Winer supports saved multi-destination addresses and package labels
- sample Winer confirmation, tracking email, and invoice
- MediCube Cantaloupe plan level and Seed access
- MediCube Nayax Core/MoMa permissions
- one controlled Yunshu replenishment capture
