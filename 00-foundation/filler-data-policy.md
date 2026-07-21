# MCOS V2 Filler Data Policy

## Purpose

MCOS V2 should keep moving when exact names, emails, phone numbers, addresses, vendor identifiers, machine IDs, contract numbers, account IDs, or other real-world details are missing.

## Rule

Use obvious replaceable filler values. Do not stop the blueprint or build because a real value is missing.

## Placeholder Format

Use this format:

- `FILLER_PERSON_<ROLE>`
- `FILLER_EMAIL_<ROLE>@example.com`
- `FILLER_PHONE_<ROLE>`
- `FILLER_ADDRESS_<LOCATION>`
- `FILLER_VENDOR_<TYPE>`
- `FILLER_ACCOUNT_<SYSTEM>`
- `FILLER_MACHINE_<NUMBER>`
- `FILLER_FACILITY_<NUMBER>`
- `FILLER_DOCUMENT_<TYPE>`
- `FILLER_DATE_<EVENT>`
- `FILLER_URL_<SYSTEM>`

## Examples

- `FILLER_PERSON_RESTOCKER`
- `FILLER_EMAIL_RESTOCKER@example.com`
- `FILLER_PHONE_FACILITY_RECEIVING`
- `FILLER_VENDOR_CARD_READER`
- `FILLER_ACCOUNT_QUICKBOOKS`
- `FILLER_MACHINE_001`

## Build Directive

Filler values are build scaffolding only. Jordan can replace them after the framework is complete.

Do not invent a real person, real email, real phone number, real account number, or real private credential.
