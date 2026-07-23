# Nayax Agent Connector Blueprint

## Status

Draft for approval. No production connection exists yet.

## Objective

Extend the existing MCOS V2 agent so it can investigate, read, normalize, and eventually operate the Nayax environment for Nayax-connected machines. This is not a separate agent and does not make Nayax the MCOS system of record.

## Core Principle

MCOS V2 remains the business operating system. Nayax is an external machine-management and payment platform accessed through a controlled connector.

## Primary Outcomes

1. Discover exactly what the Nayax API and the user's account expose.
2. Import machine, location, product, slot-map, price, inventory, device, transaction, and image-reference data into MCOS V2.
3. Map machine addresses and coordinates for Google Maps presentation inside MCOS V2.
4. Investigate all available mechanisms related to free vends, remote vends, coupons, promotions, discounts, loyalty, prepaid value, authorization, refunds, campaigns, and voucher alternatives.
5. Record exact capabilities, entitlement restrictions, permission errors, browser-only functions, and undocumented account behavior.
6. Add controlled write operations only after the read/discovery phase proves the endpoint behavior.

## User Interaction

The user communicates with the existing MCOS V2 agent in its normal chat interface. Example directions:

- Show every Nayax machine and location.
- Import the complete Nayax machine map into MCOS.
- Show the product and slot map for a named machine.
- Find every available free-vend or external-authorization mechanism.
- Compare what the API exposes with what is visible in Nayax Core.
- Apply an approved product map to a named test machine.

## Connector Sources

### Nayax API

Used for direct structured access to supported account data and actions.

### Nayax Developer Documentation

Used to understand documented endpoints, request schemas, permissions, limitations, and related products.

### Nayax Core Browser Interface

Used only where a required function is available in the user's Nayax Core account but not exposed through the documented API, including possible file or image workflows.

## Discovery Scope

The connector must enumerate and test all relevant accessible functions, including:

- Account and operator hierarchy
- Machines
- Devices and readers
- Connectivity and status
- Locations and coordinates
- Products
- Product descriptions
- Product images and image references
- Prices
- Machine-product assignments
- Slot maps and MDB codes
- Inventory and PAR values
- Transactions and sales
- Reports
- Configuration
- Free vend
- Remote vend
- Coupons
- Promotions
- Discounts
- Loyalty
- Prepaid value
- External authorization
- Payment or vend tokens
- Refunds
- Campaign rules
- Any alternate mechanism that could support MCOS voucher authorization

## Required Capability Classification

Every investigated capability must be classified as one of:

- Supported and working
- Supported but permission denied
- Documented but not enabled for this account
- Visible in Nayax Core only
- Available through account-specific import or private workflow
- Not found
- Requires confirmation from Nayax

The agent must never treat a permission error as proof that a capability does not exist.

## MCOS Data Capture

MCOS should retain normalized copies of useful Nayax data so the system can build dashboards, mapping, reporting, and operational workflows without requiring the user to repeatedly inspect Nayax Core.

Initial normalized entities:

- provider_accounts
- provider_operators
- machines
- machine_locations
- provider_devices
- products
- product_images
- machine_slots
- machine_inventory
- transactions
- provider_capabilities
- provider_permissions
- discovery_log
- synchronization_runs
- provider_action_log

## Google Maps Requirement

For every machine, capture available:

- Street address
- Campus or facility
- Building
- Floor or placement description
- Latitude
- Longitude
- Provider machine ID
- MCOS machine ID

MCOS will use this normalized location data for Google Maps display. Google geocoding is a separate MCOS service and is not assumed to be supplied by Nayax.

## Agent Authority

The existing MCOS agent may be given broad access to investigate the user's Nayax environment. The user retains final authority over design, permissions, and actions.

The agent may:

- Read all available Nayax data.
- Test read endpoints.
- Inspect account-visible settings.
- Map capabilities and restrictions.
- Normalize data into MCOS.
- Prepare and execute non-destructive approved actions.
- Use browser operation where API access is unavailable and the user's session permits it.

The agent must:

- Preserve current production configuration unless directed otherwise.
- Read current state before writing.
- Snapshot affected records before bulk changes.
- Verify state after writing.
- Log every write action.
- Ask before destructive, fleet-wide, irreversible, or financially material actions.

## Phase 1: Connection and Discovery

Deliverables:

1. Secure Nayax credential configuration outside source control.
2. Successful authentication test.
3. Endpoint and permission inventory.
4. Read-only extraction of sample machines, devices, products, slot maps, inventory, locations, and transactions.
5. Capability matrix focused on free-vend and voucher-alternative mechanisms.
6. Exact list of functions that require browser operation.
7. Discovery log saved in MCOS V2.

No production data changes are permitted in Phase 1.

## Phase 2: MCOS Synchronization

Deliverables:

- Scheduled and on-demand synchronization
- Provider-to-MCOS ID mapping
- Machine and Google-map population
- Product and slot-map population
- Inventory and transaction ingestion
- Difference and conflict reporting

## Phase 3: Controlled Nayax Operations

Potential operations, subject to endpoint confirmation:

- Product creation and updates
- Description and price updates
- Machine-product assignment
- Slot-map changes
- Inventory or PAR changes
- Approved machine configuration actions
- Browser-based image or file workflow when required

Each operation must define its risk classification and confirmation policy.

## Phase 4: Voucher and Vend Authorization Research

The connector must test and document all possible paths that could support an MCOS-controlled voucher or sponsored vend, including direct and indirect mechanisms. It must report technical feasibility, Nayax dependency, required entitlement, transaction accounting behavior, and machine-side requirements without forcing the investigation into Monyx, QR, or any assumed product path.

## Security Requirements

- Never store Nayax tokens in GitHub.
- Never place tokens in agent instructions or chat transcripts.
- Store credentials in a server-side secret manager or encrypted environment configuration.
- Use least-privilege credentials where Nayax supports scoped access.
- Separate read and write credentials if available.
- Maintain audit logs for all writes.

## First Implementation Task

Build a read-only connection probe that:

1. Loads the Nayax credential from a secure environment variable.
2. Tests authentication.
3. Calls the smallest safe machine or device endpoint.
4. Records HTTP status, response schema, pagination, rate-limit headers, and permission behavior.
5. Does not log the credential or sensitive payment data.
6. Produces a capability report for the user before any production writes are enabled.

## Blocking Inputs Before Live Connection

- Confirmed Nayax production API base URL and authentication format from the current documentation or account onboarding materials.
- A Nayax API credential stored in the deployment environment, not shared in chat.
- The MCOS V2 backend runtime location where the connector will execute.
- Confirmation of which Nayax operator/account scope the credential should access.

## Locked Decisions

- This is part of the existing MCOS V2 agent, not a separate agent.
- The first live phase is read-only discovery.
- The investigation includes free-vend, coupon, promotion, authorization, and voucher-alternative capabilities.
- Cantaloupe and Apriva are outside this specific connector.
- Nayax is not the MCOS system of record.
