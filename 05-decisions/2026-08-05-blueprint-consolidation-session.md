# Working Session: MCOS V2 Chat-to-Blueprint Consolidation

Date: 2026-08-05  
Project: MCOS V2  
Mode: CAPTURE / AUTOPILOT BUILD  
Repo: `MediCube-usa/MCOS-V2`  
Branch: `blueprint/2026-08-04-completion-audit`

## Purpose

Preserve the remaining 2026-08-04/05 chat decisions in the clean MCOS V2 blueprint branch before continuing department review.

## Repository State Reviewed

- Draft PR #1 was open at commit `681f527ca6364b011ec21fd0ab6d89e42eed8aec` with 26 commits and 18 changed files.
- Warehouse/Supplier Purchasing and universal MCOS-to-Yunshu restocking were already preserved.
- Impact/Sponsored Product Benefits, Campaigns, Maya/Customer Care, customer website/account rules, refund/credit separation, product requests, and the corrected completion matrix were not fully preserved.

## Locked Decisions Captured

- `medicubehealth.net` is customer-facing; MCOS V2 remains private.
- Customer workflows do not require an app or wallet.
- Member number and PIN are the account direction, with implementation controls still required.
- Maya can prepare and route support resolutions but cannot fabricate outcomes or self-approve.
- Refunds and MediCube credits are separate, reconciled remedies.
- One hundred verified votes creates product-placement review, not automatic placement.
- Customer machine/product mapping excludes sensitive operating data and requires freshness labeling.
- Sponsored Product Benefits remain owned by Voucher/Impact and separate from Payments and Campaigns.
- Marketing owns campaigns, promotions, coupons, competitions, and new-school communications within domain boundaries.
- Correct original-seven count after this consolidation: 3 complete as locked drafts, 4 remaining.

## Open Questions

- refund/credit thresholds and approval tiers;
- member identity proof, PIN recovery, and failed-attempt policy;
- product-vote scope and expiration/reset rules;
- customer availability freshness threshold;
- coupon funding/accounting and stacking rules;
- competition compliance review and award rules;
- Sponsored Product Benefit allowance and reporting parameters.

## Parked / Not Expanded

- Smart-lock work remains a classification item until an approved machine/setup workflow requires it.
- Application code, production integrations, live machine commands, deployment, and V1 archival remain outside this capture session.

## Files Updated

- `00-foundation/locked-decisions.md`
- `02-page-specs/00-page-blueprint-index.md`
- `02-page-specs/13-vouchers-impact-redemption-ledger.md`
- `02-page-specs/18-vouchers-refunds-customer-service.md`
- `02-page-specs/19-marketing-outreach-new-school-integration.md`
- `04-build-tasks/BLUEPRINT-COMPLETION-CHECKLIST.md`
- `05-decisions/2026-08-05-blueprint-consolidation-session.md`

## Next Action

Complete and lock `17-reporting-compliance-billing-payouts.md`.
