# MCOS V2 Command Center Contracts

Status: LOCKED P0  
Date: 2026-08-04

## Information Hierarchy

1. Critical operating strip
2. Approval queue
3. Today's communications and schedule
4. Machine/network operating summary
5. Department block grid
6. Command Center Agent brief
7. System/deployment status

Critical means safety, machine outage, failed customer outcome, compliance deadline, blocked go-live, payment issue, or overdue action requiring intervention.

## Persistent Navigation

Approved route order:

1. Command Center - `/command-center`
2. Agents - `/agents`
3. Products - `/products`
4. Inventory - `/inventory`
5. Restocking - `/restocking`
6. Machines - `/machines`
7. Machine Setup - `/machine-setup`
8. Machine Templates - `/machine-templates`
9. Facilities - `/facilities`
10. Purchasing - `/purchasing`
11. Payments - `/payments`
12. Vouchers and Support - `/support`
13. Reporting - `/reporting`
14. Screen Access - `/screen-access`
15. Marketing - `/marketing`
16. Documents - `/documents`
17. Contacts - `/contacts`
18. Calendar - `/calendar`
19. Maps - `/maps`
20. Settings - `/settings`

Finance is a protected workspace reached from Payments, Reporting, and Settings according to permission. It is not broadly summarized with confidential detail on the Command Center.

## Department Summary Contract

Every department provides one versioned summary:

- department ID/name
- health: healthy, attention, critical, unknown
- primary metrics
- critical alert count
- open/overdue task count
- pending approval count
- top three next actions
- last calculated timestamp
- data freshness
- linked route
- permission-aware redaction state

A block never queries another department's internal tables directly. It consumes the department summary contract.

## Critical Alert Contract

- severity
- title
- department
- affected resource
- occurred/updated timestamps
- owner
- acknowledgement state
- linked task/workflow
- next action
- deep link

## Approval Queue Contract

- approval ID/type
- requester
- department
- target
- risk/financial summary
- reason
- requested/expiration time
- required approver role
- current state
- review link

The Command Center presents approvals but the owning workflow executes them.

## Communication Bar Contract

Unified items may come from email, customer/support messages, phone/voicemail, calendar, shipments, deliveries, restocks, setup appointments, and internal reminders.

Every item contains source, type, sender/owner, subject, timestamp, urgency, read/acknowledged state, linked resource, and allowed action. Missing integrations display explicit disconnected/placeholder state, never fake messages.

## Agent Contract

The Command Center Agent receives permission-filtered summaries, alerts, approvals, tasks, and schedule items.

It may summarize, recommend, draft, and route. It may not self-approve, expose restricted details, alter source records without a permitted workflow, move money, or send production machine commands.

## Page States

The Command Center and every block support:

- loading
- empty
- healthy
- attention
- critical
- stale
- integration disconnected
- permission restricted
- partial data/error

Unknown or stale data cannot be rendered as healthy.

## Acceptance Criteria

- sidebar and blocks share the same route registry
- every block consumes the same summary contract
- critical items show owner and next action
- approvals preserve department ownership
- communication items identify their source
- restricted finance/credential data is redacted
- stale, missing, and disconnected data are visible
- no filler record appears as live production data
