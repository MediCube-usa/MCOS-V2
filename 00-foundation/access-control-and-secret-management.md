# MCOS V2 Access Control and Secret Management

Status: LOCKED P0  
Date: 2026-08-04

## Rule

One identity system controls human users, service accounts, and agents. Permissions attach to roles and scoped resources. Agents never receive broader authority than the user or workflow that authorized them.

## Identity Types

- Human user
- Service account
- Department agent
- Command Center agent

Every identity has a stable ID, status, organization, assigned roles, authentication method, last activity, and audit history.

## Roles

### Owner / System Administrator

Full configuration authority. Can manage identities, roles, integrations, environments, and emergency access. Financial movement and production machine control still require explicit logged confirmation.

### Executive Operator

Company-wide read access, workflow assignment, operational approvals, Command Center management, and cross-department reporting. Cannot reveal stored secrets or silently alter audit history.

### Department Manager

Read/write authority within assigned departments. Can assign tasks and approve ordinary departmental actions within configured limits.

### Operator

Performs normal records, tasks, and workflows in assigned departments. Cannot change roles, integrations, approval rules, or production controls.

### Field Restocker / Technician

Access only to assigned facilities, machines, work orders, field-safe contacts, directions, checklists, and proof uploads. No finance, credentials, system configuration, or unrestricted customer data.

### Finance / Compliance

Access to finance, payouts, documents, reporting, compliance, and approved supporting records. Machine configuration and system administration are excluded unless separately assigned.

### Read Only / Auditor

Can view explicitly assigned records and immutable history. Cannot create, update, approve, execute, or export restricted data unless separately granted.

### Service Account

Non-human credential used by a named integration. Restricted to exact API actions and environment. No interactive dashboard session.

### Department Agent

Can read allowed department context, prepare drafts, create tasks, and request approvals. Cannot approve its own request or perform restricted external actions.

### Command Center Agent

Can read approved summaries across departments, coordinate tasks, and prepare executive briefs. It cannot change permissions, move money, expose secrets, or enable machine control.

## Permission Structure

Permissions use:

`resource.action.scope`

Examples:

- `machine.read.assigned`
- `inventory.update.assigned`
- `task.assign.department`
- `approval.decide.department`
- `finance.read.company`
- `integration.configure.environment`
- `machine_command.request.assigned`

Default is deny. A role grants only listed permissions. Resource scope can be company, department, facility, machine, assigned task, or self.

## Restricted Actions

Always require an approval record:

- role or permission changes
- integration or secret configuration
- purchase approval
- payout or financial movement
- refund outside configured limit
- machine go-live
- template activation across live machines
- production machine command
- bulk data import, export, or deletion
- emergency access
- disabling audit, monitoring, relay, or security controls

## Approval Rules

- requester and approver must be different identities for restricted actions
- agents cannot approve agent-generated requests
- every approval has reason, target, before/after summary, expiration, and decision history
- approval grants one defined action, not permanent authority
- expired or rejected approvals cannot execute
- execution result links back to the approval
- emergency override requires Owner role, stated reason, limited duration, and immediate audit alert

## Authentication and Session Requirements

- authenticated private dashboard
- MFA required for Owner, Executive, Finance/Compliance, and integration administrators
- short-lived sessions for privileged roles
- server-side authorization on every action
- no authorization decisions based only on hidden UI controls
- login attempts, sessions, privilege changes, and restricted views are audited
- service accounts are independently revocable and rotated

## Secret Management

- secrets never appear in repository files, browser bundles, logs, task text, or normal database fields
- DigitalOcean/server services read secrets from an approved encrypted secret manager
- Vercel uses environment-scoped secret references for web application services
- MCOS stores credential-reference metadata only: provider, environment, owner, rotation date, status, and secret-manager reference
- production, staging, and development credentials remain separate
- service accounts receive only the scopes required by their integration
- secret values are redacted from error messages and audit payloads
- rotation creates a logged change record and rollback window
- emergency access is time-limited and audited
- no agent can retrieve or reveal a raw secret

## Environment Separation

- development: synthetic/filler data and non-production credentials
- staging: production-like configuration with isolated accounts and no live machine command authority
- production: approved identities, production integrations, monitored access, and restricted change control

No environment may silently fall back to another environment's credentials or database.

## Integration Access

Each integration has:

- integration ID and owner
- environment
- service account
- permitted resources/actions
- endpoint/reference metadata
- secret-manager reference
- enabled/disabled state
- health status
- last successful activity
- credential rotation record
- audit trail

Disabling an integration must not erase its history.

## Machine-Control Boundary

Initial system mode is observation-only.

A future production machine command requires:

1. authenticated requester with scoped permission
2. valid approval for the exact machine/action
3. safety and compatibility checks
4. immutable command-intent record
5. controlled dispatcher eligibility
6. result or timeout evidence
7. reconciliation and audit completion

The digital twin, dashboard, agent, and relay cannot independently bypass this chain.

## Acceptance Criteria

- every route and API action maps to a permission
- every restricted action maps to an approval policy
- field users cannot access finance, secrets, or unrelated facilities
- agents cannot self-approve or exceed delegated authority
- raw secrets cannot be returned to UI or agents
- environment credentials remain isolated
- service accounts are least-privilege and revocable
- permission, approval, integration, and secret-reference changes produce immutable audit events
