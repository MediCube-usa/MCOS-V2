# Page Spec: Vouchers / Impact / Redemption Ledger

## Purpose

Own MCOS-controlled voucher programs, redemption rules, sponsor/grant budgets, product eligibility, dispense records, and Impact reporting.

This is separate from Payments/Card Readers.

## Locked Rule

Vouchers go through MCOS/machine control, not card-reader provider voucher systems.

Voucher dispense should:

- reduce inventory the same as a card sale
- not count as card-reader sales revenue
- create internal value/cost accounting
- create Impact reporting event where needed

## Operating Model

- Impact or Impact-owned user/program database owns user/program eligibility if that remains the chosen architecture.
- User enters code/account number/QR value at machine.
- Machine/MCOS checks Impact database for available voucher categories.
- Voucher categories can be color-coded.
- Colors represent program/product eligibility groups, not payment-provider transactions.
- User may have multiple voucher categories.
- Machine should show/allow only eligible products available at that machine/template.
- User selects eligible product/slot.
- MCOS dispenses product through verified machine command path.
- MCOS records product, slot, machine, facility, date/time, voucher category.
- MCOS updates inventory.
- MCOS reports minimal impact event back to Impact.

## Voucher Category / Slot Mapping

Machine templates must support assigning voucher categories/colors to products, slots, or linked slot groups.

Example:

- blue vouchers apply to three full rows
- pink applies to two rows
- yellow applies to one row
- purple applies to Narcan/bottom rows

Voucher category attaches to MCOS template/slot assignment, not the card reader.

## Voucher Session Behavior

- user can enter code/account number and redeem eligible item
- multiple eligible redemptions in one session should be supported if program rules allow
- each product dispensed creates its own redemption ledger record
- session times out for privacy/security
- re-entering code for another item should be supported

## Voucher Ledger Fields

- voucher redemption ID
- external Impact account/reference ID
- voucher code/account/QR reference, tokenized where possible
- voucher category/color
- program/sponsor/grant
- machine
- facility
- slot/linked slot group
- product
- product internal value/cost
- date/time
- dispense status
- inventory update status
- Impact reporting status
- failure/refund/support status

## Technical Proof Required Before Coding Dispense

- Verify whether existing TCN direct connection supports safe outbound dispense commands.
- Obtain TCN command documentation or captured non-destructive delivery-code/remote-dispense exchange.
- Verify Android touchscreen can call MCOS/Impact directly for delivery-code shipment.
- Verify whether MediCube Android screen app is required for voucher UI and dispense control.
- Do not send production dispense commands until command protocol, response, failure mode, rollback, and safety are verified.

## Preferred Long-Term Route

- MCOS-controlled voucher service
- Impact eligibility database
- machine template maps voucher categories to slots/products
- machine or MCOS sends safe dispense command
- MCOS ledger and inventory update
- Impact receives impact event

## Command Center Block

Shows:

- voucher failures
- voucher program blockers
- redemption exceptions
- Impact sync issues
- support/refund items
- sponsor/grant budget issues where appropriate
