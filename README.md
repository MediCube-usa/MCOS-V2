# MCOS V2

MCOS V2 is the clean blueprint source for the rebuilt MediCube operating dashboard.

This repository is intentionally separate from the old `Medicube-MCOS` implementation. The old repository may be used only as reference evidence. It is not the source of truth for the V2 interface, page flow, or build sequence.

## Locked Build Rule

Blueprint first. Approval second. Build third.

No page should be coded until its blueprint is locked.

## Initial Scope

MCOS V2 starts with the private operating dashboard:

- Command Center / Main Dashboard
- Top communication bar
- Sidebar tabs
- Department blocks/cards
- Page-by-page operational workspaces
- Page agents
- DigitalOcean server direction
- Supabase data direction

## Hosting Direction

Locked 2026-08-11 (Decision 10). This replaces an earlier Vercel-serves-the-site direction.

- DigitalOcean runs the server.
- Supabase holds the data. It stays empty until the machine write loop is proven on a real machine.
- GitHub holds blueprint and code.
- **Vercel is out, permanently.**
- Old MCOS/OurVend overlap is not part of this rebuild unless explicitly preserved as reference history.

## Blueprint Folders

```text
00-foundation/
01-blueprints/
02-page-specs/
03-data-model/
04-build-tasks/
05-decisions/
99-reference-from-old-mcos/
```

## Current Recovery Source

The starting source is the saved MCOS V2 dashboard/interface conversation capture.

If Jordan has a newer conversation with additional block-level details, load it before final approval. The current documents preserve all details recovered from the saved capture available during setup.
