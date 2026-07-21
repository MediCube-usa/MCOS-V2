# MCOS V2 Source Of Truth

## Decision

MCOS V2 is a clean rebuild blueprint and should not inherit the old MCOS repo as its working source of truth.

## Old Repo Boundary

Old repo:

- `MediCube-usa/Medicube-MCOS`

Allowed use:

- evidence
- recovered ideas
- old implementation references
- gateway and screen-interface history
- migration candidates after review

Not allowed:

- copying old structure blindly
- importing old dashboard assumptions
- carrying old OurVend references into the V2 build
- treating old mock pages as final design
- treating old branches as V2 source of truth

## New Repo Direction

New GitHub repository:

- `MediCube-usa/MCOS-V2`

This repo is the durable source once these blueprint files are uploaded.

## Working Rule

Every MCOS V2 page must be locked in blueprint form before coding.

Each page blueprint must define:

- purpose
- data owned
- data read from other pages
- blocks/sub-tabs
- agent role
- workflows
- alerts
- manual inputs
- future integrations
- Command Center block
- build acceptance criteria
