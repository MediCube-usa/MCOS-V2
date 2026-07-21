# Page Spec: Facilities

## Purpose

Master record for each school, campus, base, gym, hospital, or partner location.

Facility page owns location-specific rules that other MCOS pages and agents pull from.

Facilities are not just addresses. They are rule centers for each location.

## Data Owned

- facility name
- campus/location group
- address
- GPS/map location
- exact machine location images
- delivery setup contacts
- receiving/office contacts
- restocker contacts
- payment contact
- sales/reporting contact
- contract contact
- insurance contact
- marketing/promo/announcement contact
- military/base permission contact if needed
- facility restrictions
- insurance documents
- contracts
- delivery instructions
- machine placement instructions
- opening week announcement instructions
- promo instructions
- email announcement instructions
- sales reporting rules
- payment rules
- grant reporting rules
- university reporting rules
- calendar events
- notes

## Contact Rule

Contacts should live once in a central contact database.

Facilities should link to contacts by role.

A contact should not be trapped inside one facility record.

## Rule Examples

- If a university requires monthly sales reports, that rule lives on Facility and Reporting Agent uses it.
- If a military base requires delivery permission, that rule lives on Facility and Setup/Logistics Agent uses it.
- If opening week needs promo emails, those instructions live on Facility and Marketing/Outreach Agent uses them.

## Connected Pages

- Machine Operations
- Machine Setup & Distribution
- Inventory
- Restocking
- Contracts/Documents/Compliance
- Payments/Payouts
- Reports
- Marketing/Announcements
- Calendar
- Agent tasks

## Alerts

- missing contact
- missing delivery instructions
- reporting rule due
- contract/insurance issue
- facility restriction conflict
- setup appointment upcoming

## Command Center Block

Shows:

- active facilities
- facilities missing key setup info
- facilities with upcoming events
- blocked facility requirements
