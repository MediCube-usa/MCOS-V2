# Page Spec: Vouchers / Impact / Redemption Ledger

Status: LOCKED DRAFT  
Date: 2026-08-05

## Purpose

Own MCOS-controlled voucher programs, redemption rules, sponsor/grant budgets, product eligibility, dispense records, Sponsored Product Benefits, and Impact reporting. This domain is separate from Payments/Card Readers and Customer Care.

## Locked Boundary

- Impact eligibility data remains separate from MCOS operational data.
- MCOS owns the machine-facing voucher workflow and immutable redemption ledger.
- Card-reader systems do not own voucher eligibility or voucher redemption.
- A voucher dispense reduces inventory but is not card-reader sales revenue.
- Customer cases and refund/credit decisions are owned by Customer Care and linked here.

## Customer Identity and Access

- Supported customers can use a MediCube member number and PIN.
- No app or wallet is required.
- Voucher codes and QR tokens may remain additional permitted entry methods.
- Only minimum required identity and eligibility data crosses the Impact/MCOS boundary.

## Sponsored Product Benefits

A Sponsored Product Benefit is a funded entitlement for an eligible member to receive an approved product or product category.

Each benefit records:

- sponsor/program/grant and funding period;
- eligibility source and decision reference;
- eligible product/category/slot group;
- quantity/value allowance and cadence;
- facility, geography, audience, and time restrictions;
- budget attribution and remaining authorized amount;
- required Impact/reporting fields;
- status, version, approval, and audit history.

Benefits do not alter card transactions, create customer cash balances, or bypass verified dispense controls.

## Redemption Workflow

`member/code/QR presented -> identity and eligibility check -> machine/template availability -> product selected -> verified dispense path -> dispense result -> inventory transaction -> redemption ledger -> Impact/sponsor report`

Failure routes to Customer Care without inventing a dispense outcome.

## Campaign Relationship

Marketing/Campaigns may promote a Sponsored Product Benefit and define approved messaging, dates, audience, coupons, or competitions. It cannot change eligibility, funding, redemption, inventory, or dispense evidence. Campaign ID and benefit ID remain linked references.

## Voucher and Benefit Ledger Fields

- redemption ID and session ID;
- tokenized member/account reference;
- voucher or benefit program/version;
- sponsor/grant/funding attribution;
- machine, facility, slot, product, and template version;
- date/time and eligibility decision;
- internal value/cost and reimbursement value;
- dispense and inventory status;
- Impact/reporting status;
- support/refund/credit link;
- raw evidence and audit references.

## Reconciliation and Fraud Controls

- deterministic idempotency prevents duplicate redemptions;
- one dispense result cannot fund two redemptions;
- duplicate, velocity, eligibility, budget, and device/machine anomalies route to review;
- manual corrections append events and never erase prior ledger history;
- provider/card sales cannot double-count voucher value;
- unresolved inventory or Impact sync mismatches remain visible.

## Views

- programs and Sponsored Product Benefits;
- eligibility rules and product mappings;
- active/redemption sessions;
- redemption ledger;
- sponsor/grant budget and attribution;
- failure, fraud, and reconciliation queues;
- Impact reporting and sync history;
- linked Customer Care cases.

## Permissions

- program/benefit creation and material rule changes require authorized approval;
- agents may draft and validate but cannot activate or self-approve;
- customer PII and eligibility data are minimized and permission-scoped;
- finance sees authorized funding summaries, not unrestricted customer records;
- exports are permissioned and audited.

## Command Center Summary

- active programs/benefits and budget health;
- redemption failures and unresolved discrepancies;
- eligibility or Impact sync outages;
- benefits/campaigns blocked before launch;
- sponsor reporting deadlines.

## Technical Gate

Production voucher dispensing remains disabled until the outbound command, response, failure mode, timeout, retry safety, and reconciliation path are proven through controlled testing and explicitly approved.

## Acceptance Criteria

- Impact, MCOS voucher, Customer Care, Inventory, Payments, and Campaign records remain separate but linked;
- every benefit redemption has eligibility, dispense, inventory, and funding evidence;
- no app or wallet is required for the approved member-number/PIN flow;
- agents cannot activate benefits or fabricate outcomes;
- reporting can trace funded value to the exact verified redemption without treating it as card revenue.

## Open Configuration Decisions

- final system of record for customer identity versus Impact eligibility;
- benefit allowance/cadence rules per sponsor;
- budget overrun policy and approval tiers;
- exact minimum Impact reporting payload;
- production dispense command route after canary evidence.
