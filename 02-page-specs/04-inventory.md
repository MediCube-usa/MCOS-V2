# Page Spec: Inventory

## Status

Status: LOCKED P1  
Date: 2026-08-04

## Purpose

Canonical source of truth for active-row, machine-storage, campus-storage, in-transit, damaged/quarantined, and reserved product quantities.

Inventory decides when product should move, when a field refill is economical, and when a supplier order is justified. Restocking executes field work. Purchasing submits approved supplier orders.

## Inventory Locations

For each product and machine:

1. active vending row/slot
2. backup stock inside machine storage
3. campus receiving office/closet
4. in transit to campus
5. reserved for an open work order
6. damaged/quarantined
7. consumed/sold/dispensed

Every quantity change is an inventory transaction with source evidence.

## Machine and Campus Bundles

A service bundle groups machines that can reasonably be completed in one paid service visit.

Bundle fields:

- campus/facility
- member machines
- walking/travel relationship
- normal service cost: initial default $35
- expected service time
- eligible restocker
- receiving/storage destination
- facility access window
- bundle active date/version

A remote machine may be a one-machine bundle and must independently justify its $35 visit unless a critical-product rule overrides economics.

## Product Service Classes

### Critical / Cannot Run Out

Examples are maintained in a controlled product list supplied by Jordan.

Rules:

- higher safety stock
- urgent refill exception
- may trigger a single-machine visit
- prioritize additional active or backup rows when velocity supports it
- no substitution without approved product rule

### Standard

Refill when bundle economics and projected demand justify the visit.

### Slow / Swap Candidate

Low-velocity item that consumes valuable slot space. Creates a product-review recommendation rather than automatic reorder.

## Configurable Starting Policy

These are starting defaults, not permanent constants:

- normal machine begins with one active row and one backup row where space permits
- when backup coverage falls near 20%, recommend shipment of up to two replacement rows
- normal bundle service target is approximately 20-30% remaining aggregate usable coverage, adjusted for lead time
- high-velocity items may receive additional active/backup rows
- low-velocity items may be reduced or removed
- critical items use separate minimums and do not wait for the normal bundle threshold

The engine must learn by machine, product, facility, season, and template. Jordan can change policy without code changes.

## Refill Recommendation Engine

Inputs:

- current active-row and backup quantities
- campus-storage and in-transit quantities
- product velocity
- days of supply
- critical-product status
- bundle membership
- number of machines ready
- expected lost margin from stockout
- $35 service cost or configured bundle cost
- restocker availability
- delivery/receiving status
- facility access window
- confidence/freshness of inventory data

Outputs:

- wait/monitor
- refill from machine storage
- refill from campus storage
- create bundle refill
- create urgent critical refill
- recommend row expansion
- recommend row reduction/swap
- request physical count

A single empty standard slot does not automatically trigger a $35 visit.

## Purchase Recommendation Engine

Purchasing is considered after projected stock across active row, machine storage, campus storage, reserved stock, and in-transit stock is calculated.

Output includes:

- product and supplier
- quantity/rows needed
- target machines/bundle
- packaging allocation
- destination
- coverage after receipt
- expected order and delivery dates
- reason/threshold
- critical exception
- confidence and missing data

## Product Balancing

- compare sell-through within each machine and bundle
- increase rows for repeat fast sellers
- reduce/remove products with persistent low movement
- preserve facility restrictions
- keep critical items above their safety floor
- aim for economically aligned refill timing, not identical depletion
- every slot/template change is a recommendation until approved and physically/remotely confirmed

## Inventory Confirmation Sources

One primary confirmation method is assigned per machine/work order:

1. Yunshu/TCN local replenishment confirmation when proven through the relay
2. MCOS mobile restock form
3. Cantaloupe Seed Driver for Cantaloupe-managed machines
4. Nayax MoMa for Nayax-managed machines
5. manual audited count

Provider apps are evidence sources, not competing inventory masters. Duplicate updates reconcile through work-order ID, machine, product, slot, timestamp, and idempotency keys.

## Data Owned

- inventory locations/balances
- transactions and counts
- reservations
- active/backup/campus quantities
- in-transit projection
- thresholds and policies
- product velocity
- refill/purchase recommendations
- swap/row-change recommendations
- reconciliation exceptions

## Blocks / Tabs

- Bundle Health
- Location Inventory
- Machine Inventory
- Product Inventory
- Critical Products
- Refill Recommendations
- Purchase Recommendations
- In Transit
- Velocity and Row Optimization
- Swap Candidates
- Counts/Reconciliation
- Adjustments and Audit

## Alerts

- critical item below safety floor
- normal bundle service threshold reached
- remote machine visit uneconomical
- backup stock below policy
- stale/unknown count
- fast seller needs more rows
- slow product swap candidate
- delivery delayed
- machine/provider/restocker count mismatch

## Agent Role

Inventory Agent Ava calculates recommendations, explains the math, reserves stock, routes approved work to Restocking/Purchasing, and monitors reconciliation. Ava cannot submit purchases, alter live templates, or mark a restock complete.

## Command Center Summary

- critical stock risks
- bundles ready for refill
- uneconomical single-machine needs
- purchase recommendations
- fast/slow product recommendations
- count mismatches/stale data

## Acceptance Criteria

- active, backup, campus, in-transit, reserved, and damaged stock remain separate
- refill and purchase triggers are configurable and explainable
- critical items bypass ordinary economic delay
- $35 service cost is included
- bundle and one-machine economics are supported
- provider/Yunshu/manual updates cannot double-post inventory
- recommendations never silently change templates or place orders
