# Integration Map — 2026-08-11

Two sources landed today:

- `00-foundation/source-captures/2026-08-11-block-decisions.md` — block-by-block
  decisions, 12 of ~18 blocks settled
- `01-blueprints/command-center-preview-spec.md` — extracted from Jordan's
  Command Center preview HTML

This file is the reconciliation: what they change, where they contradict what is
already locked, and what still needs an answer. **Nothing in the existing page
specs has been rewritten yet.** That happens block by block, against
`01-blueprints/block-anatomy.md`, after the conflicts below are settled.

---

## Part 1 — Conflicts needing a decision

### C1. Vercel is out, but the repo has it LOCKED in

`00-foundation/locked-decisions.md` Decision 9 reads *"Vercel serves the site."*
`README.md` repeats it twice. `02-page-specs/01-command-center.md` lists "Vercel
deployment status" as a future integration.

Today's capture: **"Vercel is out, permanently."** Stack is DigitalOcean
(server) + Supabase (data) + GitHub (blueprint/code).

This is the only place today's work contradicts something already marked LOCKED,
so it is called out rather than quietly edited.

**Applied:** Decision 9 superseded by Decision 10, README and the Command Center
spec corrected. Say so if that was not the intent.

**Not applied — six documents still describe a Vercel build.** They are too
large to rewrite unreviewed, and one of them would actively instruct a build
against Vercel, so each has been given a stale-hosting banner instead. They need
a proper pass:

| File | What still needs rewriting |
| --- | --- |
| `04-build-tasks/CODEX-BUILD-MCOS-V2-FRAMEWORK.md` | "Vercel hosts the site", Vercel-ready structure, DO/Vercel split in acceptance criteria. **Highest risk — this is a build instruction.** |
| `04-build-tasks/MCOS-V2-SITE-FRAMEWORK-STATUS.md` | Vercel-ready static framework, rewrite rules for clean routes, the DO/Vercel boundary |
| `04-build-tasks/BUILD-SEQUENCE.md` | "Vercel for site deployment" |
| `01-blueprints/site-framework-build-spec.md` | A whole Vercel hosting section, plus the split in acceptance criteria |
| `01-blueprints/department-operating-matrix.md` | "Vercel deployment status" as a Command Center field |
| `01-blueprints/command-center-full-operating-system.md` | Same field, in two places |

`02-page-specs/14-screen-access-digital-platform.md` also mentions Vercel, but
only as a technical observation that MCOS cloud cannot call an Android AAR from
it. That is now moot rather than wrong, and can be dropped when the block is
rewritten.

### C2. Agent names disagree between the two sources

| Block | Source capture | Preview |
| --- | --- | --- |
| Inventory | Ava | ORION |
| Product Catalog & Sales | unnamed sole-authority agent | VESTA |
| Templates & Config | Tessa | *(none — TESSA is on Warehouse)* |
| Warehouse & Purchasing | — | TESSA |

Deeper than the mapping: the capture says **human names are deliberate**, so
MediCube can present a real team to Aramark, schools, and partners. The preview
is mostly codenames — ATLAS, VESTA, ORION, NOVA, LEDGER, FINN, ARCHIVE, LINK —
with only MARCUS, JEFF, DEREK, TESSA, MAYA reading as people.

**Resolved 2026-08-11 as a deliberate deferral (Decision 17).** Jordan keeps the
option to rename any agent later, so no block waits on this. Use the preview's
names as the working set meanwhile, since it is the newer artifact.

The deferral is only safe if the build honours it, so it carries a requirement:
an agent's display name is a configuration field on the agent record, never
hardcoded into a page, component, workflow, or message template. A rename must
be one edit that propagates everywhere, including anywhere the name reaches an
outside party.

Still worth settling before launch, not before build: the capture's
partner-facing reason for human names sits awkwardly with a roster that is
mostly codenames. Options remain all-human, all-codename, or a written rule that
outward-facing agents get human names and internal ones do not.

### C3. Restocking's existing spec is the wrong model

`02-page-specs/05-restocking.md` describes MediCube-assigned restockers, with
training videos and a keypass that may be *"generated or manually provided."*

Today's capture replaces that: Restocking is **a routing layer, not an employee
model** — Aramark campuses use Aramark's person paid through the existing
contract, Sodexo likewise, non-university goes to InstaWork, student-initiative
campuses use two designated people still paid via InstaWork. And access is
**digital lock codes, no physical keys, ever.**

The existing spec is not slightly stale, it is a different business. It needs a
full rewrite, not a patch. Highest-value block to do first.

### C4. Product Catalog rename — answered by the preview

The capture says the scope grew and the block should be renamed. The preview
already names it **Product Catalog & Sales**. Adopting that unless told
otherwise; `03-product-catalog.md` renames to match.

### C5. Page numbering has drifted from the index

The index and the filenames stop agreeing at 15:

| Index order | Index name | Actual file |
| ---: | --- | --- |
| 15 | Warehouse / Supplier Purchasing | `16-warehouse-supplier-purchasing.md` |
| 16 | Reporting / Compliance / Billing / Payouts | `17-reporting-compliance-billing-payouts.md` |
| 17 | Vouchers / Refunds / Customer Service | `18-vouchers-refunds-customer-service.md` |
| 18–21 | Marketing, Contacts, Calendar, Maps | all inside `15-recovered-name-only-pages.md` |

Today's capture locks Marketing, Contacts, and Calendar, so the shared
name-only file has outlived its purpose. Proposal: split it into four page
specs and renumber so file numbers match index order.

**Not done yet** — renumbering rewrites most filenames in the folder, and is
worth doing in one deliberate pass rather than mixed into content edits.

### C6. Campaigns and voting are claimed by two blocks

The capture moves vouchers, Impact, campaigns, promotions, and
product-request-voting **out** of Product Catalog into "a separate
Vouchers / Impact / Campaigns block." Its Marketing section then gives Maya
promos, free-item applications, and product voting/requests.

So product-request-voting is currently assigned to both. Suggested split, for
confirmation: Marketing owns **capture and engagement** (Maya, sign-ups, the
voting surface, the leads database); the Vouchers/Impact block owns
**eligibility, dispense, and the ledger**. The 100-vote threshold event in the
preview then belongs to Marketing, and the free item it triggers to Vouchers.

**Needs Jordan.**

### C7. Templates & Config has no agent

It is in the preview sidebar, but has no block card and no agent — TESSA, whom
the capture assigned to Templates, is on Warehouse in the preview. Either
Templates gets its own agent, or it is deliberately a surface with no agent of
its own. **Needs Jordan.**

### C8. Seven blocks are missing from the preview

Present in the index, absent from the preview: Templates & Config (sidebar
only), Vouchers/Impact/Redemption Ledger, Vouchers/Refunds/Customer Service,
Reporting/Compliance/Billing/Payouts, Screen Access/Digital Platform,
Calendar/Logistics (header widget only), Maps/Machine Locator (header control
only).

Reading these as "not drawn yet" rather than "removed." Calendar matters most:
the capture is explicit that **the block is the backbone and the header is a
small window into it** — the preview currently shows only the window.

**Needs Jordan:** deferred, merged, or simply not drawn?

### C9. Block workspaces are still previews

The capture requires that opening a block gives **"the full department workflow,
not a preview."** The preview's overlay gives stats, a task queue, recent
activity, and alerts — a good summary, but still a summary.

Not a contradiction, just the work that remains. It is exactly what the
block-by-block pass produces.

---

## Part 2 — Where each block stands

| # | Block | After today | Next action |
| ---: | --- | --- | --- |
| 1 | Command Center | Locked + preview | ATLAS placement and roster confirmed; overlay depth per C9 |
| 2 | Agent Management | Locked | Rewrite to anatomy; owns the naming rule from C2 |
| 3 | Product Catalog & Sales | Locked, renamed | Rewrite; sole-authority agent rule is central |
| 4 | Inventory | Locked | Rewrite; composite-trigger principle |
| 5 | Restocking | Locked, **model changed** | **Full rewrite — do first (C3)** |
| 6 | Machine Operations | Locked | Rewrite; two agents, one block |
| 7 | Setup & Distribution | Locked | Rewrite; confirmed ship→ID→template sequence |
| 8 | Templates & Config | Locked | Rewrite; agent unresolved (C7) |
| 9 | Facilities | Expanded — now a rule centre | Rewrite; other blocks read its restrictions |
| 10 | Documents / Compliance / Vault | Locked | Rewrite; tiered access for bank/card |
| 11 | Finance / Accounting / Payouts | Locked, one open item | Rewrite blocked on Q1 |
| 12 | Payments / Card Readers | Locked | Rewrite |
| 13 | Vouchers / Impact / Ledger | Partly pre-resolved | Blocked on Q3; boundary per C6 |
| 14 | Screen Access / Digital Platform | Mostly folded into Marketing | Reduce to the delivery layer; see note below |
| 15 | Warehouse & Purchasing | Not covered today | Unchanged — still `Recovered partial` |
| 16 | Reporting / Compliance / Billing | Assembly layer only | Blocked on Q1 |
| 17 | Vouchers / Refunds / Customer Service | Cleanest of the open set | Ready to walk |
| 18 | Marketing / Outreach | **Now locked** — Maya, ad slots, sponsors | Promote out of the name-only file |
| 19 | Contacts | **Now locked** | Promote out of the name-only file |
| 20 | Calendar / Logistics | **Now locked** — backbone, not header | Promote; needs real email integration |
| 21 | Maps / Machine Locator | Still open | Needs Q4 answered first |

---

## Part 3 — Questions carried in from the sources

**Q1. Does Finance execute restocker/Aramark payouts, or only track them?**
Flagged in the capture as needing a direct answer. Restocking already says MCOS
never touches that money, so the two must agree. Reporting inherits this, so it
blocks three blocks at once. *Highest-value question to answer.*

**Q2. Which AI runs the Command Center agent role?** Deliberately deferred until
every block is laid out. No action.

**Q3. How is a dispense triggered outside the payment flow?** A real technical
gap, not a design choice — vouchers cannot work until it is solved. Worth
testing on the office machine while it is on the bench.

**Q4. Maps — the field-safe versus sensitive split.** A restocker's map view must
not carry financial data. Blocks the Maps block.

**Q5. Where do the machine components ultimately live?** The agent API and the
Android agent are new, clean, and have no tie to the old dashboard, but they sit
in the old repository. MCOS 2 is meant to be built without inheriting that
repo's patchwork, so their home is worth deciding rather than defaulting.

Three options: leave them where they are and treat them purely as a service MCOS
2 calls; move them into `MCOS-V2` as the go-forward system; or give them their
own repository, since they serve machines rather than any one dashboard.

No urgency — nothing breaks either way, and the office-machine test should not
wait on it. Worth answering before MCOS 2 starts being coded, so the boundary is
deliberate.

---

## Part 4 — Cross-cutting items

**Location-type taxonomy.** `dorm / gym / campus-general / VA-military-stadium`
recurs across Catalog, Facilities, and Templates. It should be one shared
reference, not redefined per block. Proposed home: `03-data-model/`, which the
README plans but the repo does not yet have.

**Machine job queue — already built, and not old patchwork.** The standing rule
that every machine-facing action is create-job → pending → confirmed, picked up
on the agent's next check-in, is not aspirational. The write side exists and is
tested: `services/mcos-agent-api`, with the on-machine agent at
`android/mcos-agent`. Block specs should reference the mechanism rather than
invent one.

Both were built clean on 2026-08-11 with no dependency on the old dashboard —
the API is a standalone service with its own store, and the agent is a
dependency-free courier. They currently sit in the `Medicube-MCOS` repository
only because that is where the machine work was already happening. That is a
location, not an inheritance: MCOS 2 is not picking up old structure by using
them. See Q5.

**Screen Access (14).** The business half moved to Marketing. What remains is the
technical delivery layer — relay plus on-machine agent — which now exists. This
block may end up thin, or fold entirely into Machine Operations. Worth asking.

**Supabase stays empty for now.** The capture names Supabase as the data layer.
The machine-side work has it deliberately empty until the write loop is proven
on a real machine. Both hold: Supabase is the destination, not yet the store.
