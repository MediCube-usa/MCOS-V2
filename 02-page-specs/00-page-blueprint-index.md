# MCOS V2 Page Blueprint Index

## Blueprint Status Key

- `Recovered detailed`: saved conversation contains detailed page notes.
- `Recovered name only`: saved conversation names the page/block, but detailed notes still need Jordan confirmation.
- `Recovered partial`: saved conversation names the page and provides related rules, but the exact page still needs Jordan confirmation.
- `Locked draft`: ready for Jordan review.
- `Approved`: Jordan approved for build.
- `Decisions captured`: settled 2026-08-11, page spec not yet rewritten to `01-blueprints/block-anatomy.md`.
- `Rewritten`: spec now follows block anatomy and today's decisions.

## Pages

Agent column from `01-blueprints/command-center-preview-spec.md`. Names are
contested between the two sources — see conflict C2 in
`04-build-tasks/2026-08-11-integration-map.md`.

| Order | Page / Block | Agent | Status |
|---:|---|---|---|
| 1 | Command Center / Main Dashboard | ATLAS | Decisions captured |
| 2 | Agent Management | — | Decisions captured |
| 3 | Product Catalog & Sales | VESTA | Decisions captured, renamed |
| 4 | Inventory | ORION | Decisions captured |
| 5 | Restocking | MARCUS | Decisions captured, **model changed — rewrite first** |
| 6 | Machine Operations | JEFF + 1 unnamed | Decisions captured, two agents |
| 7 | Machine Setup & Distribution | DEREK | Decisions captured |
| 8 | Machine Templates & Configuration | *unassigned* | Decisions captured, agent open |
| 9 | Facilities | NOVA | Decisions captured, scope expanded |
| 10 | Documents / Contracts / Compliance / Secure Vault | ARCHIVE | Decisions captured |
| 11 | Finance / Accounting / Payouts / QuickBooks | LEDGER | Decisions captured, blocked on Q1 |
| 12 | Payments / Card Readers | FINN | Decisions captured |
| 13 | Vouchers / Impact / Redemption Ledger | — | Partly resolved, blocked on Q3 |
| 14 | Screen Access / Digital Platform | — | Mostly folded into Marketing |
| 15 | Warehouse / Supplier Purchasing | TESSA | Recovered partial — not covered 2026-08-11 |
| 16 | Reporting / Compliance / Billing / Payouts | — | Assembly layer only, blocked on Q1 |
| 17 | Vouchers / Refunds / Customer Service | — | Recovered partial, ready to walk |
| 18 | Marketing / Outreach / New School Integration | MAYA | **Decisions captured** — was name only |
| 19 | Contacts / Central Company Directory | LINK | **Decisions captured** — was name only |
| 20 | Calendar / Logistics | — | **Decisions captured** — was name only |
| 21 | Maps / Machine Locator | — | Still open, blocked on Q4 |

## Filename Numbering

File numbers stopped matching this order at 15, and blocks 18–21 currently share
`15-recovered-name-only-pages.md`. Three of those four are now settled, so that
file should be split and the folder renumbered in one deliberate pass. Detail in
conflict C5 of the integration map.

## Next Review Flow

1. Answer Q1 (Finance: execute payouts or only track them?) — it unblocks 11, 16, and 13.
2. Rewrite Restocking. Its model changed most.
3. Roll block by block against `01-blueprints/block-anatomy.md`.
4. Split and renumber the name-only file once Marketing, Contacts, and Calendar are written.
5. Settle agent naming (C2), then apply it everywhere at once.
