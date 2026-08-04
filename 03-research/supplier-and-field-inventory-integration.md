# Supplier and Field Inventory Integration Research

Date: 2026-08-04  
Status: VERIFIED PUBLIC CAPABILITIES / ACCOUNT ACCESS REQUIRED

## Weiner's LTD

Verified supplier:

- storefront: https://weinersltd.com/
- account portal: https://account.weinersltd.com/
- registered customers may order online
- weekly downloadable UPC catalog is available
- live storefront must verify current price and availability
- $100 minimum order
- multiple shipping addresses and drop shipping supported
- order notes support special requirements
- normal processing is approximately 1-2 business days
- continental U.S. ground transit is approximately 1-4 business days
- shipping confirmation, tracking, and invoice/receipt are emailed

No supported public ordering API was identified.

MCOS decision:

- Weiner's is primary supplier
- agent imports the relevant catalog subset and prepares the cart/order draft
- Jordan approves every order
- approved orders use the registered account portal
- portal credentials remain in the secret manager
- MCOS captures confirmation, invoice, shipment, tracking, delivery, and exceptions
- browser/order automation is not enabled until account behavior and supplier terms are verified

Sources:

- https://weinersltd.com/
- https://weinersltd.com/pages/faq
- https://weinersltd.com/pages/shipping-map

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

## Universal Replenishment Decision

MCOS is the universal work-order and push-notification system. Yunshu is the universal compatible machine-side replenishment interface. Nayax, Cantaloupe, and Apriva do not determine the restocker workflow.

The Yunshu handbook verifies:

- Backstage -> Product Management -> Set Stock
- single-slot stock revision
- selected-slot batch revision
- whole-layer replenishment
- replenish-all-slots action

The V2.5 evidence indicates product/inventory changes can be reported to the configured server. Live testing must prove the exact post-replenishment message and work-order reconciliation.

Provider data remains supporting evidence and cannot double-count a Yunshu-confirmed refill.

## Required Next Evidence

- MediCube Weiner's account access and saved shipping destinations
- sample Weiner's confirmation, tracking email, and invoice
- confirmation whether machine-separated packing/labels can be requested reliably
- MediCube Cantaloupe plan level and Seed access
- MediCube Nayax Core/MoMa permissions
- one controlled Yunshu replenishment capture
