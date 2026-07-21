# Page Spec: Vouchers / Refunds / Customer Service

## Status

Recovered as a named page/block, with detailed voucher model captured separately in `13-vouchers-impact-redemption-ledger.md`.

Needs Jordan confirmation on refund and customer-service scope.

## Purpose

Handle customer-facing exceptions tied to vouchers, refunds, failed dispenses, support needs, and machine/user issue tracking.

Voucher program rules and redemption ledger remain in the detailed Vouchers / Impact / Redemption Ledger spec.

## Recovered Rules

- Voucher dispense should reduce inventory.
- Voucher dispense should not count as card-reader sales revenue.
- Failed dispense/refund/support status should be tracked in the voucher ledger.
- Card-reader purchases are handled by payment providers, but support context may need to reference machine, slot, product, facility, and provider.
- Production dispense commands must not be sent until safe command path is verified and approved.

## Data Owned

Needs Jordan confirmation.

Likely:

- customer support cases
- failed dispense cases
- refund requests
- voucher support issues
- provider support references
- resolution status
- support notes

## Data Read

- Machine Operations
- Payments/Card Readers
- Vouchers/Impact Redemption Ledger
- Inventory
- Facility rules
- Audit Logs

## Blocks / Tabs

Proposed, needs Jordan confirmation:

- Open support cases
- Failed dispense cases
- Refund review
- Voucher support
- Provider ticket references
- Resolution history
- Escalations

## Alerts

- failed dispense
- unresolved refund/support case
- repeated issue at same machine/slot
- voucher redemption failed
- provider support ticket overdue

## Command Center Block

Shows:

- open support issues
- failed dispense/refund blockers
- urgent customer cases
- repeated machine issue warnings
