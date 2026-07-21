# MCOS V2 Site Framework Build Spec

## Status

Status: BUILD-AUTHORIZED FRAMEWORK

## Objective

Build the MCOS V2 private dashboard framework so every major department/block exists as an independent page with its own workflow, data contract, agent area, alerts, and Command Center summary.

## Hosting Split

### Vercel

Vercel hosts:

- static MCOS V2 dashboard framework now
- future Next.js web application when package registry access is available
- private dashboard UI
- page routes
- app-facing endpoints that are safe for Vercel
- authentication UI when added

### DigitalOcean

DigitalOcean hosts:

- server-side workloads that should not run inside Vercel
- long-running services
- machine/gateway services
- background workers
- integration services
- command-safe backend services after approval

## Build Phases

### Phase 1: Framework Shell

Build:

- global app shell
- persistent left sidebar
- top communication bar
- Command Center page
- department block grid
- urgent operating strip
- approval queue
- filler data layer
- route stubs for every department

### Phase 2: Department Pages

Build each department as a modular page:

- Agent Management
- Products
- Inventory
- Restocking
- Machine Operations
- Machine Setup & Distribution
- Machine Templates & Configuration
- Facilities
- Supplier Purchasing
- Payments / Card Readers
- Vouchers / Refunds / Customer Service
- Reporting / Compliance / Billing / Payouts
- Screen Access / Digital Platform
- Marketing / Outreach
- Documents / Contracts / Licenses
- Contacts / Central Directory
- Calendar / Logistics
- Maps / Machine Locator

### Phase 3: Data Contracts

Implement structured placeholder data contracts first.

Every department must expose:

- department summary
- alerts
- tasks
- approval requests
- metrics
- records owned by page
- records read from other pages

### Phase 4: Backend / Server Split

Add DigitalOcean integration only after the UI framework and data contracts exist.

Initial server placeholders:

- `FILLER_DIGITALOCEAN_SERVICE_GATEWAY`
- `FILLER_DIGITALOCEAN_SERVICE_WORKER`
- `FILLER_DIGITALOCEAN_SERVICE_SCREEN_AGENT`

### Phase 5: Replace Filler With Real Data

After framework completion:

- replace filler people
- replace filler contacts
- replace filler facility details
- replace filler machine details
- connect real services
- connect real auth
- connect live integrations

## Route Map

```text
/
/command-center
/agents
/products
/inventory
/restocking
/machines
/machine-setup
/machine-templates
/facilities
/purchasing
/payments
/support
/reporting
/screen-access
/marketing
/documents
/contacts
/calendar
/maps
/settings
```

## App Shell Components

Required components:

- `AppShell`
- `Sidebar`
- `TopCommunicationBar`
- `CommandCenterAgentPanel`
- `UrgentOperatingStrip`
- `ApprovalQueue`
- `DepartmentBlockGrid`
- `DepartmentBlockCard`
- `DepartmentPageHeader`
- `AgentPanel`
- `AlertList`
- `TaskList`
- `MetricStrip`
- `DataConnectionPanel`
- `WorkflowTimeline`
- `FillerBadge`

## Data Model Contracts

### Department Summary

```ts
type DepartmentSummary = {
  id: string;
  name: string;
  route: string;
  agentName: string;
  ownerName: string;
  status: 'healthy' | 'attention' | 'blocked' | 'setup';
  metrics: DepartmentMetric[];
  alerts: OperatingAlert[];
  tasks: DepartmentTask[];
  approvalRequests: ApprovalRequest[];
  dataSources: string[];
  nextAction: string;
  lastUpdated: string;
};
```

### Operating Alert

```ts
type OperatingAlert = {
  id: string;
  departmentId: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  nextAction: string;
  ownerName: string;
  linkedRoute: string;
};
```

### Department Task

```ts
type DepartmentTask = {
  id: string;
  departmentId: string;
  title: string;
  status: 'new' | 'assigned' | 'in_progress' | 'waiting' | 'complete' | 'blocked';
  ownerName: string;
  dueDate: string;
  relatedRecordId: string;
  nextAction: string;
};
```

### Approval Request

```ts
type ApprovalRequest = {
  id: string;
  departmentId: string;
  title: string;
  requestedBy: string;
  reason: string;
  riskLevel: 'low' | 'medium' | 'high';
  approvalType: 'purchase' | 'template' | 'go_live' | 'finance' | 'refund' | 'agent_permission' | 'machine_control';
  status: 'waiting' | 'approved' | 'rejected';
};
```

## Placeholder Data Directive

Use filler records for every missing real-world value.

Examples:

- `FILLER_PERSON_OPERATIONS_OWNER`
- `FILLER_EMAIL_FACILITY_CONTACT@example.com`
- `FILLER_PHONE_RESTOCKER`
- `FILLER_MACHINE_001`
- `FILLER_FACILITY_001`
- `FILLER_VENDOR_CARD_READER`
- `FILLER_ACCOUNT_QUICKBOOKS`

## UX Directive

The first screen is the usable Command Center.

No public landing page.

No marketing-first hero.

No decorative-only dashboard.

The interface should be quiet, dense, scannable, and operational.

## Build Acceptance Criteria

- Every sidebar route exists.
- Command Center shows every department block.
- Each block links to its route.
- Each department page has at least:
  - header
  - agent panel
  - metrics
  - alerts
  - tasks
  - approvals
  - data owned
  - data read
  - workflow section
  - directives
  - Command Center summary contract
- Filler values are visibly marked.
- No old MCOS code is copied blindly.
- No OurVend path is active.
- Vercel/DigitalOcean split is documented.
