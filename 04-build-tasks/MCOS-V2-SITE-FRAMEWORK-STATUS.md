# MCOS V2 Site Framework Status

Date: 2026-07-21

## Status

Status: FRAMEWORK BUILT LOCALLY / GITHUB SYNC PARTIAL

## Built Artifacts

- `MCOS-V2-site/` - dependency-free Vercel-ready static dashboard framework.
- `MCOS-V2-app/` - Next.js scaffold for the future full app build.
- `MCOS-V2-blueprints/` - full blueprint packet and build instructions.

## Verified Static Site

The static framework includes:

- Command Center first screen.
- persistent left department navigation.
- top communication bar.
- Command Center department block grid.
- department pages for every required block.
- page-level agent panel.
- metrics, alerts, tasks, approvals, data owned, data read, connections, workflows, directives, and Command Center summary.
- filler values for missing real people, contacts, IDs, vendors, facilities, URLs, and services.
- Vercel rewrite behavior for clean routes.

## Verified Routes

- `/command-center`
- `/agents`
- `/products`
- `/inventory`
- `/restocking`
- `/machines`
- `/machine-setup`
- `/machine-templates`
- `/facilities`
- `/purchasing`
- `/payments`
- `/support`
- `/reporting`
- `/screen-access`
- `/marketing`
- `/documents`
- `/contacts`
- `/calendar`
- `/maps`
- `/settings`

## Verification Commands

Run from `MCOS-V2-site/`:

```bash
npm run verify
```

Observed result:

```text
MCOS V2 static framework verified: 20 routes, 6 required files.
```

Additional live preview check:

```bash
curl -I http://127.0.0.1:4180/
```

Observed result:

```text
HTTP/1.0 200 OK
```

## Next.js Scaffold Status

The Next.js scaffold exists but dependency installation could not be completed in the current container.

Observed blocker:

```text
npm install -> 403 Forbidden from registry.npmjs.org for @types/node
```

The static site exists so MCOS V2 has a runnable framework without waiting for package registry access.

## GitHub Status

The GitHub repo `MediCube-usa/MCOS-V2` has the first blueprint and page-spec batch.

The following finalized local files still need remote sync when GitHub write approval succeeds:

- `01-blueprints/department-operating-matrix.md`
- `01-blueprints/site-framework-build-spec.md`
- `04-build-tasks/CODEX-BUILD-MCOS-V2-FRAMEWORK.md`
- `04-build-tasks/MCOS-V2-SITE-FRAMEWORK-STATUS.md`
- static site files under `MCOS-V2-site/`
- Next scaffold files under `MCOS-V2-app/`

## Do Not Change

- Do not make the first screen a public landing page.
- Do not use old MCOS as source of truth.
- Do not reactivate OurVend paths.
- Do not block framework completion because real-world names, emails, phone numbers, machine IDs, URLs, or account IDs are missing.
- Do not put server/backend workloads into Vercel. DigitalOcean remains the server/backend boundary.
