# Page Spec: Reporting / Compliance / Billing / Payouts

## Status

Recovered as a named page/block with connected rules from Facilities, Documents, Finance, Payments, Vouchers, and Command Center.

Needs Jordan confirmation before build.

## Purpose

Track reporting obligations, compliance reporting, billing outputs, partner/facility payout summaries, and program reporting requirements.

This page should not replace Finance or Documents. It should assemble reportable outputs from those source systems.

## Recovered Rules

- Facility-specific reporting rules live on Facility records.
- Contracts/documents can create reporting requirements.
- Finance executes and tracks money through QuickBooks.
- Payments/Card Readers owns provider sales reports.
- Vouchers/Impact owns voucher redemption and impact reporting.
- Command Center should surface missing reports, compliance deadlines, and payout/report blockers without exposing detailed finance broadly.

## Data Owned

- report definitions
- report schedules
- report audiences
- report status
- compliance reporting deadlines
- billing/payout report outputs
- exported report history
- report blockers

## Data Read

- Facility reporting rules
- Secure Vault contract/compliance requirements
- Finance/QuickBooks summaries
- Payments/Card Reader sales reports
- Voucher/Impact redemption ledger
- Inventory and restocking history
- Machine performance

## Blocks / Tabs

Proposed from recovered rules, needs Jordan confirmation:

- Facility reports
- Compliance reports
- Billing summaries
- Payout summaries
- Voucher/Impact reports
- Machine performance reports
- Product/sales reports
- Scheduled reports
- Export history
- Missing/blocker queue

## Alerts

- monthly sales report due
- compliance deadline approaching
- payout report missing
- billing summary needs approval
- report export failed
- missing facility rule
- contract reporting obligation not mapped

## Agent Role

Needs Jordan confirmation.

Likely role:

- watches report deadlines
- prepares report drafts
- pulls source data from correct pages
- flags missing rules
- routes approval to Jordan or Finance

## Command Center Block

Shows:

- reports due soon
- compliance deadlines
- missing report data
- billing/payout blockers
- reports awaiting approval
