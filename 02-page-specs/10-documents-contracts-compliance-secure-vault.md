# Page Spec: Documents / Contracts / Compliance / Secure Vault

## Purpose

Secure control center for legal, compliance, contract, corporate, licensing, and high-sensitivity company records.

It must support organization by document type, facility, company, vendor, investor, machine, state, program, or relationship.

## Security Rule

MCOS may track sensitive records, owners, expiration dates, access level, and storage location.

Actual passwords, bank credentials, card numbers, access codes, and sensitive login secrets should be stored in a secure credential vault/encrypted system, not casually inside dashboard text.

MCOS should link to or reference secure vault records, not expose secrets to every dashboard user.

## Document Categories

- facility contracts
- company contracts
- employee agreements
- restocker agreements
- vendor agreements
- supplier/wholesale agreements
- orders
- purchase records
- shipping records
- logistics paperwork
- insurance documents
- resale licenses
- state compliance paperwork
- EIN/company identification records
- corporate paperwork
- company formation documents
- company operating documents
- TCN contracts
- TCN machine purchase records
- credit card machine company contracts
- payment processor agreements
- grant information
- compliance information
- bank/ACH/tax references
- investor agreements
- SAFE contracts
- certifications
- machine ownership documents
- nonprofit rules
- Narcan and health compliance documents
- telehealth company information/contracts
- state-specific operating permissions
- product-specific health/compliance records

## Document Record Fields

- document name
- category/type
- related facility
- related company/vendor/person
- related machine if applicable
- related state/jurisdiction
- owner/contact
- status
- effective date
- expiration date
- renewal date
- required action
- permission/access level
- storage location/link
- signed/unsigned status
- DocuSign status if applicable
- notes
- agent follow-up task

## Workflow

- create from template or upload document
- send for signature through DocuSign when needed
- signed documents return and are stored
- expiration/renewal dates create alerts
- facility-specific rules flow into Facility, Reporting, Finance, Marketing, and Operations
- Finance/QuickBooks uses contract rules to execute accounting and payouts

## Agent Role

Document/Compliance Agent:

- tracks missing paperwork
- watches expirations and renewals
- prepares reminders
- tells Command Center what is urgent
- helps generate blank packets
- routes documents to correct records
- supports DocuSign preparation/follow-up

## Command Center Block

Shows:

- missing critical documents
- documents expiring soon
- contracts awaiting signature
- compliance deadlines
- state/facility paperwork blockers
- investor/finance/legal approval items
