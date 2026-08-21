# MCOS V2 Machine Digital Twin

Status: LOCKED P0  
Date: 2026-08-04

## Purpose

Maintain one canonical MCOS record for each physical machine while preserving the difference between what MCOS expects and what the machine actually reports.

## Twin Sections

### Identity

- MCOS machine ID
- machine number
- TCN/Yunshu identifiers
- OurVend identifier
- serial/model
- payment terminal mapping
- screen-device mapping
- facility and placement

External IDs are mappings, not the canonical primary key.

### Observed State

Latest verified machine-reported or upstream-observed state:

- online/offline/unknown
- last communication
- protocol/connection status
- temperature where supported
- slot/product/quantity observations
- fault/status observations
- dispense/configuration results
- screen/app status where separately available
- raw evidence and normalized-event references

### Desired State

Approved MCOS intent:

- assigned template version
- expected slot/product layout
- expected price/capacity
- facility restrictions
- planned software/configuration state
- requested service/restock/setup state

Desired state never claims that the machine changed.

### Reconciliation

For each comparable field:

- desired value
- observed value
- match/mismatch/unknown
- evidence timestamp
- confidence/source
- responsible workflow
- unresolved alert

### Operational State

Derived summary for dashboard use:

- lifecycle: ordered, shipping, setup, ready, live, paused, retired
- connectivity: online, stale, offline, unknown
- inventory: healthy, low, empty, mismatch, unknown
- payment: healthy, issue, unknown
- screen: healthy, issue, not-connected, unknown
- service: clear, due, active, blocked
- relay compatibility: direct, shadow, relayed, degraded, bypassed

## Source Precedence

No source silently overwrites another.

- immutable raw message is evidence
- normalized event is an interpretation
- observed state is the latest accepted projection
- desired state is approved MCOS intent
- manual correction requires reason and audit event
- provider reports retain provider attribution
- conflicts create reconciliation issues

## Update Rules

- duplicate messages do not repeat effects
- out-of-order messages cannot replace newer state without explicit reconciliation
- stale data changes connectivity confidence, not historical truth
- unknown fields remain unknown; filler data is never treated as observed
- template activation occurs only after physical/remote confirmation
- inventory balance changes through inventory transactions
- dispense result links to payment or voucher context when known

## Command Safety Boundary

The twin records command intent, approval, dispatch eligibility, dispatch evidence, and result. It does not itself send commands.

Initial allowed state is observation-only. Relay and dashboard remain safe if the translator or twin service is unavailable.

## Command Center Summary Contract

Each machine contributes:

- machine ID/name
- facility/placement
- lifecycle
- connectivity
- inventory health
- payment health
- screen health
- service state
- relay state
- critical alerts
- open tasks
- last observed time
- next required action

## Acceptance Criteria

- one physical machine resolves to one canonical MCOS twin
- desired and observed state remain separate
- every displayed status has evidence and timestamp
- missing/unknown data is explicit
- replay produces the same current projection
- dashboard outage cannot interrupt vending
