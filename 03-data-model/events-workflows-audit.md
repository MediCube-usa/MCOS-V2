# MCOS V2 Events, Tasks, Workflows, Approvals, and Audit

Status: LOCKED P0  
Date: 2026-08-04

## Event Envelope

Every normalized operational event contains:

- event ID
- event type and schema version
- occurred-at and received-at timestamps
- organization ID
- actor identity/type
- source system and source reference
- resource type and ID
- correlation ID
- causation ID
- idempotency key
- payload
- sensitivity classification
- raw evidence reference when applicable

Events are append-only. Corrections create new events.

## Task Model

Task states:

`draft -> ready -> assigned -> in_progress -> blocked -> awaiting_review -> completed`

Terminal alternatives:

`cancelled | rejected | failed`

Every task has owner, assignee, department, priority, due date, linked resources, checklist, blocker reason, completion evidence, and audit history.

## Approval Model

Approval states:

`requested -> pending -> approved | rejected | expired | cancelled`

If approved:

`approved -> executing -> executed | execution_failed`

An approval records requester, approver policy, requested action, target, before/after summary, reason, expiration, decision, execution result, and related audit events.

## Workflow Model

A workflow definition is versioned. A workflow instance pins the definition version used at start.

Each step declares:

- entry condition
- responsible role/agent
- required inputs
- allowed actions
- approval requirement
- completion evidence
- timeout/escalation
- next step or terminal result

Workflows cannot silently skip a required approval or evidence step.

## Initial Cross-Department Workflows

### Low Stock to Restock

Inventory signal -> restock task -> assignment -> field completion proof -> inventory transactions -> reconciliation -> alert cleared.

### Inventory Need to Purchase

Demand recommendation -> purchase request -> approval -> purchase order -> shipment -> receiving -> inventory transactions -> reconciliation.

### New Machine Go-Live

Setup lifecycle -> facility/placement confirmed -> template assigned -> stock confirmed -> payment reader verified -> relay/connection verified -> go-live approval -> Machine Operations ownership.

### Machine Incident

Observation/alert -> incident task -> diagnosis -> service/restock/payment/screen routing -> resolution evidence -> twin status reconciled -> incident closed.

### Voucher Exception and Refund

Eligibility/redemption/dispense evidence -> support case -> machine/inventory/payment checks -> refund approval if required -> result recorded -> ledgers reconciled -> case closed.

### Facility Reporting

Reporting schedule -> data snapshot -> validation exceptions -> approval -> export/submission -> document evidence -> completion.

### Template Change

Versioned change plan -> compatibility/restriction validation -> approval -> scheduled application -> observed-state confirmation -> assignment activated or rolled back.

## Notifications

Notifications are delivery attempts, not the source record.

Each contains:

- triggering event
- audience/recipient
- channel
- severity
- message template/version
- delivery state
- read/acknowledged state
- linked task/resource

Critical alerts persist until acknowledged or resolved. Channel failure does not remove the underlying alert.

## Audit Event

Every create, update, archive, assignment, approval, export, login, permission change, agent action, integration action, and restricted-data view produces an audit event.

Audit contains:

- actor
- action
- target
- timestamp
- request/correlation ID
- before/after summary or immutable reference
- reason when required
- source IP/device/session where available
- outcome
- approval reference when applicable

Audit records cannot be edited through normal application workflows.

## Idempotency and Replay

- inbound integrations use deterministic idempotency keys
- duplicate events do not duplicate inventory, payment, voucher, refund, or task effects
- projections can rebuild from normalized events
- parser revisions create new interpretation versions without erasing raw evidence
- failures go to quarantine/dead letter and can be safely replayed

## Acceptance Criteria

- every major page action emits an event and audit record
- every multi-step process has explicit state and owner
- restricted actions cannot execute without valid approval
- retries cannot duplicate financial, inventory, or dispense effects
- failures remain visible and replayable
