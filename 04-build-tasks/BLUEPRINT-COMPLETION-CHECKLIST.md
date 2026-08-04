# MCOS V2 Blueprint Completion Checklist

Status: ACTIVE  
Date: 2026-08-04  
Build gate: application coding begins only after the P0 blueprint block is approved.

## Current Finding

The repository is a good clean blueprint base, but it is not yet a complete approved build specification.

It contains 21 page/block entries:

- 14 recovered detailed
- 3 recovered partial
- 4 recovered name-only or name-plus-reference
- 0 marked approved

Several older files also contain a now-superseded prohibition against an active OurVend path. The new relay boundary preserves OurVend only as an upstream compatibility dependency while MCOS V2 becomes the operational source of truth.

## P0 - Must Lock Before Framework Coding

- [x] Lock the Command Center information hierarchy.
- [x] Lock the persistent sidebar route map.
- [x] Lock the company communications top bar.
- [x] Resolve page ownership overlaps:
  - [x] Payments vs Finance vs Reporting
  - [x] Vouchers vs Refunds/Customer Service
  - [x] Inventory vs Restocking vs Purchasing
  - [x] Machine Operations vs Screen Access vs Templates
- [x] Lock user roles, permissions, approval, and secret-management model.
- [x] Lock canonical data entities and stable IDs.
- [x] Lock event, audit, notification, and task models.
- [x] Lock Vercel application vs DigitalOcean service boundaries.
- [x] Lock machine/OurVend transparent relay boundary.
- [x] Lock V1 migration allowlist and exclusion list.
- [ ] Mark each page `Approved`, `Deferred`, or `Needs decision`.

## P1 - Page Blueprints Needing Expansion

- [x] Warehouse / Supplier Purchasing
- [ ] Reporting / Compliance / Billing / Payouts
- [ ] Vouchers / Refunds / Customer Service
- [ ] Marketing / Outreach / New School Integration
- [ ] Contacts / Central Company Directory
- [ ] Calendar / Logistics
- [ ] Maps / Machine Locator

Each completed page must include:

- purpose and owner
- entities/data owned
- data read from other domains
- table/list/detail states
- actions and approval gates
- alerts and notifications
- empty/loading/error/offline states
- filters/search/export
- role permissions
- audit events
- Command Center summary contract
- acceptance criteria

## P1 - Cross-System Blueprints Missing

- [x] Authentication, organizations, users, roles, permissions, and secret management
- [x] Canonical entity/data model
- [x] Event and audit-log model
- [x] Notification and communications model
- [x] Task/workflow/approval engine
- [ ] File/document storage and secure-vault references
- [ ] Integration registry and secret management
- [x] Machine digital twin and desired-vs-actual state
- [x] Machine/OurVend relay and raw-capture boundary
- [x] Protocol translator and replay/quarantine behavior
- [ ] Observability, alerting, backup, and disaster recovery
- [ ] Environments, deployment, migrations, and rollback
- [ ] Test strategy and acceptance matrix
- [ ] V1 archival and evidence-retention plan

## P2 - Build After Blueprint Approval

- [ ] Create clean application scaffold in MCOS V2.
- [ ] Implement identity, permissions, audit, and shared data contracts first.
- [ ] Implement shell, sidebar, communications bar, and Command Center.
- [ ] Implement department modules in approved dependency order.
- [ ] Implement gateway/translator as isolated DigitalOcean services.
- [ ] Import only reviewed V1 concepts or data.
- [ ] Deploy staging.
- [ ] Run static, unit, integration, security, and workflow tests.
- [ ] Run one-machine shadow/canary relay test.
- [ ] Keep MCOS V1 available as read-only reference until acceptance.
- [ ] Cut over MCOS V2 application.
- [ ] Archive V1 repositories/branches/deployments; do not delete until retention is approved.

## Explicitly Deferred

- final logo correction
- final dashboard colors
- final visual redesign and polish
- autonomous production machine commands
- removal of OurVend
- production dispense control

Deferred items must not block architecture, data contracts, workflow completion, or safe staging deployment.

## First Review Block

Review and approve together:

1. system boundaries and source-of-truth rules
2. role/permission model
3. core entity/data model
4. Command Center and navigation
5. machine digital twin and relay boundary

This block prevents rework across every later page.
