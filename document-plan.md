# MCOS V2 Blueprint Document Plan

## Documents Being Created

- `README.md` - clean repo entry point and strict build sequence.
- `00-foundation/source-of-truth.md` - where MCOS V2 truth lives and how old repo material may be used.
- `00-foundation/locked-decisions.md` - locked decisions from Jordan's saved dashboard/interface conversation.
- `01-blueprints/site-shell-and-navigation.md` - global MCOS site shell, top navigation bar, sidebar, and page/block map.
- `01-blueprints/command-center.md` - locked Command Center operating dashboard blueprint.
- `02-page-specs/00-page-blueprint-index.md` - page-by-page blueprint index and completion status.
- `02-page-specs/*.md` - detailed page specs for the recovered MCOS V2 pages.
- `04-build-tasks/BUILD-SEQUENCE.md` - approval-first build sequence for Codex.

## Required Instructions / Skills

- Jordan Build OS: active. Repo-first preservation, strict scope control, no old-repo overlap, direct execution.
- MCOS Recovery Agent instructions: preserve current evidence, do not reuse old MCOS repo as source of truth, do not reintroduce OurVend or old architecture mess.

## Validation Required

- Every page spec must define purpose, data owned, data read, blocks/tabs, workflow, alerts, manual inputs, future integrations, Command Center block, and agent role where known.
- Any information not present in the saved capture must be marked `Needs Jordan confirmation`, not invented.
- The blueprint must be build-ready but not coded until Jordan approves the locked blueprints.

## Current Status

- [x] Created clean local MCOS V2 blueprint workspace.
- [x] Confirmed GitHub repo `MediCube-usa/MCOS-V2` exists.
- [x] Created first blueprint batch locally.
- [x] Reviewed files for old-repo contamination.
- [x] Loaded foundation and Command Center blueprints into GitHub.
- [x] Loaded every recovered split page spec into GitHub.
- [ ] Jordan reviews and approves Command Center.
