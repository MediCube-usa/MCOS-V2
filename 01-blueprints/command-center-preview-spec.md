# Command Center — Preview Spec (extracted 2026-08-11)

Extracted from Jordan's `mcos2commandcenterpreview_1.html`. This records what the
preview actually specifies, so the design survives independently of an 8 MB HTML
file. Where this and a page spec disagree, this is newer.

The preview is a working visual, not a finished contract. Items it leaves out
are listed under "Not in the preview" and are not decisions.

## Shell

Persistent left sidebar, grouped — not a flat list:

| Group | Destinations |
| --- | --- |
| Overview | Command Center |
| Operations | Product Catalog & Sales, Inventory, Restocking, Machine Operations, Setup & Distribution, Templates & Config |
| Company | Facilities, Warehouse & Purchasing, Payments, Documents, Finance |
| Growth | Marketing & Outreach, Contacts |

Header: MCOS / Medicube Health lockup, page title `COMMAND CENTER`, breadcrumb
`Medicube Health · Live Operations · Joseph`, a `Map` control, a live month
calendar (August 2026), and an `All systems operational` status indicator.

**ATLAS sits top-right**, where the logo used to be, as the source capture
requires.

## Block roster and agent assignment

Twelve block cards, each owned by one named agent:

| Block | Agent | Face metric | Accent |
| --- | --- | --- | --- |
| Product Catalog & Sales | VESTA | active SKUs | `#FF3B3B` |
| Inventory | ORION | machines stocked | `#FF8A00` |
| Restocking | MARCUS | open tasks | `#FFD400` |
| Machine Operations | JEFF | machines online | `#B4FF3D` |
| Setup & Distribution | DEREK | in transit | `#22FF7A` |
| Facilities | NOVA | active facilities | `#14E8A8` |
| Warehouse & Purchasing | TESSA | POs pending | `#00D9FF` |
| Payments & Card Readers | FINN | transactions today | `#2E8FFF` |
| Finance & Accounting | LEDGER | MTD revenue | `#4D5BFF` |
| Marketing & Outreach | MAYA | new signups, 7d | `#A238FF` |
| Documents & Compliance | ARCHIVE | expiring this month | `#E838FF` |
| Contacts | LINK | — | `#FF3D94` |

Each block carries a second, lighter accent for gradients, and a matching icon.
The accents run the colour wheel in order, so a block is identifiable by colour
before it is read.

## Block face (the card)

Every card shows the same five things:

1. Block name, with `MCOS · Live` beneath
2. Owning agent — icon plus name, top-right of the card
3. One headline metric and its label
4. An alert pill with the current alert count
5. A seven-bar `Activity, 7d` sparkline

Nothing on the face is department-specific in structure. Adding a block means
supplying data, not designing a new card.

## Block workspace (opening a card)

Opening a card gives an agent-led workspace:

- Eyebrow: `<AGENT> — DEPARTMENT AGENT`
- Three stat cards
- **Agent Task Queue** — each task has a title, a status line, and a check control
- **Recent Activity** — timestamped event rows
- **Operational Alerts** — severity-coloured cards, each with a headline and detail

This is the "runs almost like its own site" pattern: same skeleton every block,
different agent and content inside it.

**Known gap.** The source capture says opening a block must give *"the full
department workflow, not a preview."* The preview's overlay is still a summary —
stats, tasks, activity, alerts. The department workflow itself is what the
block-by-block pass has to add. See `block-anatomy.md`.

## Not in the preview

Present in the block index but absent here, and not to be read as removed:

- **Templates & Config** — in the sidebar, but has no block card or agent
- **Vouchers / Impact / Redemption Ledger**
- **Vouchers / Refunds / Customer Service**
- **Reporting / Compliance / Billing / Payouts**
- **Screen Access / Digital Platform**
- **Calendar / Logistics** — appears only as the header calendar. The source
  capture is explicit that this is backwards: the block is the backbone and the
  header is a window into it.
- **Maps / Machine Locator** — appears only as a header `Map` control

## Sample data

All figures in the preview are illustrative, and the 7-day sparklines are
generated randomly at page load. Under the filler-data policy they are
scaffolding: useful for judging layout, not to be quoted as real, and not to be
carried into a build as seed data.
