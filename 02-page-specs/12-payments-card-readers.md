# Page Spec: Payments / Card Readers

## Purpose

Manage credit card/campus card reader systems and provider sales reporting.

This page is for card-reader sales only.

No voucher logic should live in this block.

## Providers

May include:

- Nayax
- Preva
- Cantaloupe
- provider required by facility

## Data Owned

- provider account access/reference
- card reader to machine mapping
- facility/location mapping
- machine/payment terminal ID
- provider customer service contact
- support ticket history
- card reader purchase records
- install status
- TCN/onsite install status
- setup history
- campus card support
- sales reports by machine/facility
- weekly/monthly totals
- settlement/deposit records
- processing fees
- facility reporting exports

## Important Distinction

Credit card/campus card purchases are real sales processed through the card-reader provider.

Voucher dispensing should not be managed here.

## Voucher Decision

MCOS-controlled vouchers are the better long-term route.

Voucher logic should not be tied to Nayax, Preva, Cantaloupe, or any one provider.

Different machines may use different card-reader companies, so provider-based vouchers would split logic across outside systems.

## Impact Reporting Distinction

Card-reader systems may report transactions, but Impact reporting needs MCOS-controlled redemption context.

Impact-related voucher data belongs in Vouchers / Impact / Redemption Ledger.

## Alerts

- card reader issue
- missing sales report
- settlement/report mismatch
- provider support issue
- reader install/setup blocker

## Command Center Block

Shows only:

- card reader issue
- missing sales report
- settlement/report mismatch
- provider support issue
- reader install/setup blocker
