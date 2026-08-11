# Block Anatomy

Every MCOS 2 block is its own small operating system: one department, its own
agent or agents, its own workflows, its own workspace. Same skeleton every time,
different contents. This file is the skeleton.

Two reasons it is fixed. A block whose shape matches every other block can be
duplicated, templated, and leased. And an operator who learns one block has
learned all of them.

Fill this in one block at a time. A section with nothing confirmed reads
`Needs Jordan confirmation` — never a guess. Filler values follow
`00-foundation/filler-data-policy.md`.

---

## 1. Purpose

One sentence. What this block is for, in operating terms.

## 2. Boundary

What this block explicitly does **not** do, and which block does it instead.
This section exists because most MCOS design errors are two blocks each assuming
the other owns something. Write the boundary before the features.

Model: *"Inventory decides what is needed and where. Restocking executes the
field task."*

## 3. Data owned

The records for which this block is the source of truth. One list, no hedging —
if two blocks claim a record, the boundary above is wrong.

## 4. Data read

What it reads, and **from which block**. Never "from the system."

## 5. Agent roster

A block may have more than one agent. Machine Operations has two on purpose.
For each:

- **Name** — see `Naming` below
- **Role** — the one sentence version
- **Skillset** — what it is competent at
- **Workflow** — what it does unprompted, on what cadence
- **Instructions** — standing rules and hard limits
- **May decide** — actions it takes alone
- **Must propose** — actions needing a human, and who
- **Escalates to ATLAS when** — the conditions that push something up

Two rules hold everywhere:

- **Agents never own data.** An agent is skillset, workflow, and instructions
  only. Supabase is the source of truth. This is what makes a block leasable.
- **Every agent reports up to ATLAS**, the Command Center agent.

## 6. Workflows

Numbered, start to finish, one line per step, naming the actor at each step
(agent, operator, third party, machine).

**Any step that acts on a machine is a job, never a synchronous call.** Write it
as create-job → pending → picked up on next check-in → confirmed. The write side
that serves this already exists: `services/mcos-agent-api` in `Medicube-MCOS`.
Never specify a button that "does X to a machine" directly.

## 7. Statuses

The full state list for this block's primary record, in lifecycle order.

## 8. Alerts

What raises an alert, and its severity. These are what surface on the block face
and in Operational Alerts.

## 9. Manual inputs and overrides

What a human can enter or force, and what happens to the agent's state when they
do.

## 10. Permissions

Who sees what. Where a block holds both field-safe and sensitive data, split it
explicitly — a refiller's map view must not carry financial data, and a document
record can show that a bank account exists without showing the number.

## 11. Integrations

External systems, and whether each is live, planned, or aspirational.

## 12. Duplication profile

What copies when this block is templated for a new operator, and what does not.
Agent config, workflows, and instructions travel. Business data never does. If
something in this block would leak a customer's data into a copy, say so here.

## 13. Command Center presence

- **Face metric** — the single number on the card, and its label
- **Alert count** — what feeds the pill
- **Activity, 7d** — what the sparkline measures
- **Three stat cards** — shown on open
- **Task queue** — what lands in the agent's queue
- **Recent activity** — what counts as an event worth a row

Matches the card and workspace anatomy in `command-center-preview-spec.md`.

## 14. Open questions

Anything genuinely unresolved, phrased as a question with the options. Do not
resolve these by picking one quietly.

## 15. Acceptance criteria

What has to be true for the block to be called built.

---

## Naming

The source capture is explicit that human names are deliberate — they let
MediCube speak to Aramark, schools, and partners as a team. The preview mixes
human names (MARCUS, JEFF, DEREK, TESSA, MAYA) with codenames (ATLAS, VESTA,
ORION, NOVA, LEDGER, FINN, ARCHIVE, LINK).

That is an open decision, not a settled one — see the integration map. Until it
is settled, use the preview's name and note the conflict; the preview is the
newer artifact.
