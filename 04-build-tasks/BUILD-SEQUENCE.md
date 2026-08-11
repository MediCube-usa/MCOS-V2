# MCOS V2 Build Sequence

> **Stale on hosting — flagged 2026-08-11.** This document predates Decision 10
> and still describes Vercel as serving the MCOS V2 site. **Vercel is out,
> permanently**; the stack is DigitalOcean (server) + Supabase (data) + GitHub.
> The hosting sections below have not been rewritten yet — do not build from
> them. See conflict C1 in `04-build-tasks/2026-08-11-integration-map.md`.

## Rule

Do not build the site until Jordan approves the detailed blueprints.

## Phase 1: Lock Blueprints

1. Review and lock Command Center.
2. Review and lock site shell/top communication bar/sidebar.
3. Review and lock Agent Management.
4. Review and lock Machine Operations, Setup, Templates.
5. Review and lock Inventory, Restocking, Purchasing.
6. Review and lock Facilities, Documents, Finance, Payments, Vouchers.
7. Review and lock Screen Access.
8. Expand recovered name-only pages.

## Phase 2: Build Foundation

1. Create clean Next.js app.
2. Set up private dashboard shell.
3. Implement sidebar and top communication bar.
4. Implement Command Center block grid.
5. Use placeholder data only where explicitly marked.
6. Keep old repo out of the build.

## Phase 3: Page Build

Build pages in approved blueprint order.

Each page must include:

- layout
- tabs/blocks
- empty states
- placeholder/manual input state where needed
- agent panel if specified
- Command Center summary data contract

## Phase 4: Infrastructure

- Vercel for site deployment.
- DigitalOcean for server/backend workloads.
- Do not connect production machine commands until screen/gateway control path is proven and approved.

## Phase 5: Approval Gates

Before build:

- Jordan approves blueprints.

Before live machine control:

- command path verified
- response/failure mode understood
- rollback known
- no production dispense without explicit approval
