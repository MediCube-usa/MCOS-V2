# MCOS V2 Page Blueprint Index

## Blueprint Status Key

- `Recovered detailed`: saved conversation contains detailed page notes.
- `Recovered name only`: saved conversation names the page/block, but detailed notes still need Jordan confirmation.
- `Recovered partial`: saved conversation names the page and provides related rules, but the exact page still needs Jordan confirmation.
- `Locked draft`: ready for Jordan review.
- `Approved`: Jordan approved for build.

## Pages

| Order | Page / Block | Status |
|---:|---|---|
| 1 | Command Center / Main Dashboard | Recovered detailed, locked draft |
| 2 | Agent Management | Recovered detailed |
| 3 | Product Catalog | Recovered detailed |
| 4 | Inventory | Recovered detailed |
| 5 | Restocking | Recovered detailed |
| 6 | Machine Operations | Recovered detailed |
| 7 | Machine Setup & Distribution | Recovered detailed |
| 8 | Machine Templates & Configuration | Recovered detailed |
| 9 | Facilities | Recovered detailed |
| 10 | Documents / Contracts / Compliance / Secure Vault | Recovered detailed |
| 11 | Finance / Accounting / Payouts / QuickBooks | Recovered detailed |
| 12 | Payments / Card Readers | Recovered detailed |
| 13 | Vouchers / Impact / Redemption Ledger | Recovered detailed |
| 14 | Screen Access / Digital Platform | Recovered detailed |
| 15 | Warehouse / Supplier Purchasing | Locked P1 |
| 16 | Reporting / Compliance / Billing / Payouts | Recovered partial |
| 17 | Vouchers / Refunds / Customer Service | Recovered partial |
| 18 | Marketing / Outreach / New School Integration | Recovered name only |
| 19 | Contacts / Central Company Directory | Recovered name only |
| 20 | Calendar / Logistics | Recovered name only plus top-bar references |
| 21 | Maps / Machine Locator | Recovered name only plus machine/facility map references |

## Next Review Flow

Jordan should review in order:

1. Command Center
2. Site shell and top communication bar
3. Agent Management
4. Machine and setup pages
5. Inventory/restocking/purchasing pages
6. Facility, documents, finance, payments, vouchers
7. Screen Access
8. Name-only pages that need expansion

## 2026-08-04 Completion Update

Warehouse / Supplier Purchasing is now locked with:

- Winer LTD as primary supplier
- reusable additional-supplier connector template
- manual approval before every initial order
- bundle/machine packaging allocation
- shipment-to-restock timing
- receiving exceptions and reconciliation
- inventory/restocking/provider confirmation boundaries
