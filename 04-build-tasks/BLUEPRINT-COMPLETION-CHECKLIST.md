# MCOS V2 Blueprint Completion Checklist

Status: ACTIVE  
Date: 2026-08-05  
Build gate: application coding begins only after the P0 blueprint block and final page-status matrix are approved.

## Current Finding

MCOS V2 is the clean blueprint source of truth. Core architecture is substantially locked, but the full master blueprint is not yet approved for application coding.

## P0 - Must Lock Before Framework Coding

- [x] Command Center information hierarchy, navigation, communications, alerts, approvals, and state contracts
- [x] Domain ownership boundaries
- [x] User roles, permissions, approvals, and secret-management model
- [x] Canonical entities, stable IDs, events, tasks, workflows, notifications, and audit
- [x] Vercel application vs DigitalOcean persistent-service boundary
- [x] Machine/Yunshu/OurVend transparent relay boundary
- [x] V1 migration allowlist and exclusion rules
- [ ] Mark every page `Approved`, `Deferred`, or `Needs decision`
- [ ] Lock final master approval matrix

## Original Seven Department Blueprints

- [x] Warehouse / Supplier Purchasing — locked draft
- [ ] Reporting / Compliance / Billing / Payouts — next
- [x] Vouchers / Refunds / Customer Service / Maya — locked draft
- [x] Marketing / Outreach / New School Integration / Campaigns — locked draft
- [ ] Contacts / Central Company Directory
- [ ] Calendar / Logistics
- [ ] Maps / Machine Locator

Progress: **3 of 7 completed as locked drafts; 4 remain.**

Impact/Sponsored Product Benefits and Campaigns are recorded within the relevant page specs and are not separate additions to the original seven count.

## Captured Customer / Impact / Campaign Decisions

- [x] `medicubehealth.net` customer-facing boundary
- [x] no-app/no-wallet customer model
- [x] member number and PIN direction
- [x] Maya Customer Care authority boundary
- [x] refund versus immediate MediCube-credit separation
- [x] linked customer/machine/product/dispense/payment/voucher records
- [x] product-request workflow with 100-vote placement-review trigger
- [x] customer-safe machine/product mapping
- [x] Sponsored Product Benefits ownership and redemption boundary
- [x] Campaigns, promotions, coupons, competitions, and new-school communication boundary
- [ ] configure refund/credit limits, PIN recovery, voting scope, coupon accounting, and competition review rules

## Cross-System Blueprints Remaining

- [ ] File/document storage and secure-vault references
- [ ] Integration registry completion and credential-reference operations
- [ ] Observability, alerting, backup, and disaster recovery
- [ ] Environments, deployment, migrations, and rollback
- [ ] Test strategy and acceptance matrix
- [ ] V1 archival and evidence-retention plan
- [ ] Smart-lock classification only if it remains required by an approved machine/setup workflow

## Build After Blueprint Approval

- [ ] Create clean MCOS V2 application scaffold
- [ ] Implement identity, permissions, audit, and shared contracts
- [ ] Implement shell, sidebar, communications bar, and Command Center
- [ ] Implement approved departments in dependency order
- [ ] Implement isolated gateway/translator services
- [ ] Import only reviewed V1 concepts/data
- [ ] Deploy staging and run verification
- [ ] Run one-machine shadow/canary relay test
- [ ] Cut over only after acceptance
- [ ] Archive V1 only after retention approval; do not delete evidence

## Explicitly Deferred

- final logo, colors, and visual polish
- autonomous production machine commands
- removal of OurVend
- production dispense control before protocol proof

## Next Completion Order

1. Reporting / Compliance / Billing / Payouts
2. Contacts
3. Calendar / Logistics
4. Maps / Machine Locator
5. Secure Vault and Integration Registry
6. Deployment, recovery, testing, and V1 archive plan
7. Final approval matrix and master blueprint lock
