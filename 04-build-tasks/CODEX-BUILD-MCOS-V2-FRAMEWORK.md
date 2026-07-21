# Codex Task: Build MCOS V2 Framework

## Objective

Build the full MCOS V2 private dashboard framework from the approved blueprints.

The first complete build must include the Command Center and every department/page route as a modular framework with filler data where real data is missing.

## Repository

`MediCube-usa/MCOS-V2`

## Context Files

- `README.md`
- `00-foundation/source-of-truth.md`
- `00-foundation/locked-decisions.md`
- `00-foundation/filler-data-policy.md`
- `01-blueprints/site-shell-and-navigation.md`
- `01-blueprints/command-center.md`
- `01-blueprints/command-center-full-operating-system.md`
- `01-blueprints/department-operating-matrix.md`
- `01-blueprints/site-framework-build-spec.md`
- `02-page-specs/00-page-blueprint-index.md`
- `02-page-specs/*.md`
- `04-build-tasks/BUILD-SEQUENCE.md`

## Required Build

Create a clean MCOS V2 app framework with:

- private dashboard shell
- persistent sidebar
- top communication bar
- Command Center
- department block grid
- all department routes
- typed or structured filler data
- department summary contracts
- modular page components
- Vercel-ready site structure
- documented DigitalOcean backend boundary

## Routes

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

## Required Page Pattern

Every department page must include:

- page header
- department agent panel
- key metrics
- urgent alerts
- open tasks
- approval queue
- data owned
- data read from other pages
- workflow timeline
- directives
- manual input placeholders
- future integration placeholders
- Command Center summary preview

## Filler Data Rule

When names, emails, phones, addresses, vendors, machine IDs, account IDs, URLs, server names, credentials, or exact details are missing, use filler values from `00-foundation/filler-data-policy.md`.

Do not stop the build for missing real values.

## Do Not Change

- Do not use old MCOS repo as source of truth.
- Do not bring OurVend into active architecture.
- Do not create a public marketing page.
- Do not send or enable machine dispense/control commands.
- Do not expose secrets.
- Do not wait for perfect real data.

## Hosting

- Vercel hosts the site.
- DigitalOcean hosts server/backend workloads later.

## Acceptance Criteria

- static framework verifies with `npm run verify`.
- every route renders through the MCOS dashboard shell.
- Command Center shows all department blocks.
- every block links to the correct page.
- every department page follows the required page pattern.
- filler data is clearly labeled.
- old repo overlap is absent from active code.
- DigitalOcean/Vercel responsibility split is documented.
