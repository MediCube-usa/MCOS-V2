# MCOS V2 Machine, Yunshu, and OurVend Integration Boundary

Status: LOCKED ARCHITECTURE / PROTOCOL VALIDATION REQUIRED  
Date: 2026-08-04

## Outcome

MCOS V2 will sit between each Yunshu/TCN machine and OurVend without changing the machine's working vending behavior.

```text
Yunshu/TCN machine
        |
        v
MCOS gateway relay
  - forwards requests and responses unchanged
  - records both directions
  - never invents a response
        |
        v
OurVend upstream
```

A passive capture pipeline copies observed traffic into the MCOS translator, event store, digital twin, workflows, and dashboard. The relay remains independent from dashboard availability.

## Locked Boundaries

- OurVend remains the operational upstream during the first integration phase.
- MCOS V2 is the permanent business and operational source of truth.
- The machine must continue operating if the MCOS dashboard is unavailable.
- The relay preserves payloads, ordering, timing, connection lifecycle, and required transport details.
- MCOS never fabricates `OK`, success JSON, dispense approval, configuration approval, or any other response.
- MCOS V1 does not return to the live machine path.
- No production dispense/configuration command is enabled until request, response, failure, timeout, retry, duplicate, and rollback behavior are proven.
- OurVend is an upstream compatibility dependency, not the MCOS dashboard, database, or workflow engine.
- Removing OurVend is a later gated decision.

## Evidence Layers - Do Not Merge By Assumption

### Layer A: Yunshu V2.5 HTTP document

The supplied V2.5 document describes configurable machine-to-server HTTP POST requests using key-value pairs and JSON responses:

- `FunCode=1000`: machine uploads slot/product/inventory data; server acknowledgement is mandatory.
- `FunCode=2000`: pickup-code/IC-card validation.
- `FunCode=4000`: periodic polling; server may return no work, remote dispense work, or slot/product modification work.
- `FunCode=5000`: shipment-result report; server acknowledgement is mandatory.
- `FunCode=5001`: remote product/slot loading-result report; server acknowledgement is mandatory.

The translated/OCR copy has wording and numbering defects. Exact field names, casing, types, encodings, and responses require live-capture verification.

### Layer B: Observed gateway traffic

Earlier gateway work captured `###...`-framed messages including heartbeat/status and inventory-like data. These are evidence, but are not declared equivalent to the V2.5 HTTP `FunCode` protocol. Translation starts only after detecting transport and protocol version.

### Layer C: Current OurVend connection

The machine was restored to the working OurVend server after the earlier MCOS gateway accepted data but failed to preserve the working interface. Exact production transport, framing, encryption, keepalive, reconnect, and upstream behavior must be captured securely.

## Gateway Responsibilities

The DigitalOcean gateway owns:

- transparent bidirectional relay
- connection health and reconnect supervision
- encrypted configuration/secret references
- immutable raw capture in both directions
- timestamp and connection/session identifiers
- protocol detection/version tagging
- safe log redaction
- forwarding latency, failures, and backlog metrics
- asynchronous copied delivery to the translator
- tested bypass/runbook

The gateway does not own product catalog, templates, inventory truth, digital twins, restocking, facilities, payment/voucher ledgers, users, reporting, or dashboard UI.

## MCOS V2 Responsibilities

MCOS V2 owns:

- canonical machine identity
- digital twins
- normalized telemetry/events
- inventory and slot state
- template desired state
- desired-versus-actual reconciliation
- alerts, workflows, approvals, and audit history
- operator dashboard
- OurVend compatibility status
- future safe command intent/result records

## Required Data Path

1. Machine connects or posts to the MCOS relay.
2. Relay records an immutable inbound envelope.
3. Relay forwards the original payload to OurVend without semantic changes.
4. OurVend response is recorded as an immutable outbound envelope.
5. Relay returns the response without semantic changes.
6. An asynchronous translator classifies and parses a copy.
7. Normalized idempotent events update the MCOS V2 digital twin.
8. Invalid/unknown messages are quarantined without blocking relay traffic.
9. Dashboard reads normalized MCOS data and is never in the synchronous vending path.

## Reliability Controls

- deterministic message IDs and deduplication
- raw payload hash and direction
- machine and connection/session correlation
- event ordering where available
- timeout/retry metrics
- replay-safe translator
- dead-letter/quarantine path
- relay health independent of dashboard
- no generated response when upstream behavior is unknown
- tested direct-OurVend bypass
- one-machine canary before fleet rollout

## Validation Gates

### Gate 1 - Passive evidence

- Capture complete request/response pairs for one machine.
- Identify transport, message boundaries, keepalive, retries, and disconnect behavior.
- Prove whether V2.5 `FunCode` and `###...` traffic are separate protocols or related layers.

### Gate 2 - Shadow translation

- Relay still depends on OurVend.
- Translator consumes copied traffic only.
- Digital twin matches machine/OurVend data.
- Unknown messages cannot affect machine operation.

### Gate 3 - Operational canary

- One machine uses the relay continuously.
- Vending, touchscreen, inventory, pricing, and payment behavior stay unchanged.
- Direct-OurVend bypass is rehearsed.
- Latency/failure thresholds pass.

### Gate 4 - Command experiments

Only safe, reversible, explicitly approved commands may be tested. Production dispense remains disabled until separately approved.

## V1 Migration Rule

Review and selectively reimplement proven raw capture, parsers, stable identity mapping, deduplication, normalized events, digital twins, and runbook evidence.

Do not copy guessed acknowledgements, branch clutter, dashboard defects, mixed experiments, deployment coupling, secrets, or environment values.
