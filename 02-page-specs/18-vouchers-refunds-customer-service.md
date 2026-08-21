# Page Spec: Vouchers / Refunds / Customer Service

Status: LOCKED DRAFT  
Date: 2026-08-05

## Purpose

Provide one customer-care workspace for voucher questions, failed dispenses, payment exceptions, refunds, immediate MediCube credit, product requests, and resolution history. Voucher eligibility and redemption accounting remain owned by the Voucher / Impact Ledger; card transactions remain owned by Payments.

## Customer Access Boundary

- `medicubehealth.net` is the customer-facing account and support surface.
- MCOS V2 is the private operating source of truth used by staff and agents.
- Customers do not need to install an app or hold a digital wallet.
- A customer account uses a stable MediCube member number plus PIN for supported account actions.
- Authentication, recovery, failed-attempt limits, PIN reset, and privacy rules must be implemented before production use.
- The customer website exposes only permission-filtered customer data and never provides direct access to the MCOS dashboard.

## Maya Customer-Care Role

Maya is the customer-care agent/interface. Maya may:

- identify the customer, machine, product, payment/voucher event, and reported problem;
- open and update a support case;
- explain case status and approved customer options;
- prepare an immediate MediCube-credit action or external refund request;
- route fraud, duplicate, unresolved dispense, safety, privacy, or high-value exceptions to a human;
- collect product requests and customer communications.

Maya may not invent a successful dispense, issue unrestricted value, change voucher eligibility, expose payment credentials, or close a case without recorded resolution evidence.

## Canonical Links

Every customer case can link, without collapsing records, to:

- customer/member account;
- member number reference;
- facility, machine, slot, and product;
- payment transaction or voucher redemption;
- dispense result and inventory transaction;
- refund request or MediCube credit transaction;
- communication history, evidence, tasks, approvals, and audit events.

## Case Types

- failed or partial dispense;
- charged but no product;
- voucher eligibility or redemption failure;
- duplicate charge or duplicate request;
- damaged, expired, or incorrect product;
- product unavailable;
- member/PIN access problem;
- immediate MediCube-credit request;
- external payment refund request;
- product request;
- general question or complaint.

## Case Workflow

`new -> identity/evidence check -> classification -> automated eligibility check -> proposed resolution -> approval when required -> execution -> reconciliation -> customer notified -> closed`

Alternative states: `waiting_customer`, `waiting_provider`, `waiting_machine_evidence`, `fraud_review`, `escalated`, `denied`, `cancelled`.

The case cannot be closed until the resolution action and affected ledgers reconcile, or a documented denial/escalation is delivered.

## Refund Versus Immediate MediCube Credit

- Immediate MediCube credit is the preferred fast internal resolution when evidence and configured limits permit it.
- A payment-provider refund follows the provider/payment workflow and may take longer.
- The customer must see which remedy is offered and choose where policy allows.
- Credit and refund are separate transactions; they cannot both be issued for the same loss unless a logged corrective approval reverses the duplication.
- Automatic eligibility thresholds, maximum values, expiry, transferability, and required approver levels remain configurable policy values.
- Fraud, repeated claims, mismatched evidence, restricted products, or values above the configured limit require manual review.

## Product Requests and Placement Voting

- Customers can request products from the customer-facing site and, where supported, from the machine experience.
- Each verified member may cast one active vote per product/request scope unless policy explicitly permits otherwise.
- Requests map to the customer's facility and nearby/used machine context.
- At 100 verified votes, MCOS creates a product-placement review task; it does not automatically place or purchase the product.
- Product Catalog, facility restrictions, slot fit, supplier availability, economics, and compliance must be reviewed before approval.
- Approved placement creates template, purchasing, inventory, and launch tasks with audit history.

## Customer Machine and Product Mapping

The customer experience may show:

- nearby or selected MediCube machines;
- facility and field-safe placement description;
- products expected from the assigned active template;
- current availability only when freshness and confidence meet policy;
- supported voucher/benefit eligibility for the signed-in member;
- product-request and support actions tied to the selected machine.

Exact sensitive placement instructions, staff contacts, machine controls, internal stock, and operational notes remain private.

## Views

- case queue with status, urgency, age, owner, machine, and proposed remedy;
- case detail with evidence timeline and linked records;
- refund/credit approval queue;
- customer/member lookup;
- communication history;
- repeated-issue and fraud-review queue;
- product requests and vote thresholds;
- resolution and reconciliation history.

All views support loading, empty, stale, partial-data, permission-restricted, disconnected-provider, and error states.

## Permissions and Approval Gates

- Customer sees only their own permitted account/case information.
- Support staff receive least-privilege access and masked financial data.
- Field restockers see only assigned case facts needed to verify or correct the machine.
- Refunds/credits outside configured limits require a different authorized approver.
- Agents cannot approve their own proposed remedy.
- Exports of customer or financial data require permission and audit.

## Audit Events

Audit case creation, identity verification result, evidence link, status/owner change, customer communication, remedy proposal, approval decision, credit/refund execution, denial, reconciliation, vote creation/removal, threshold crossing, and closure.

## Command Center Summary

- urgent and aging cases;
- failed-dispense cases;
- refunds/credits awaiting approval or reconciliation;
- repeated machine/slot issues;
- provider or voucher blockers;
- product requests at or near 100 verified votes.

## Acceptance Criteria

- payment, voucher, dispense, inventory, refund, credit, and case records remain separate but linked;
- customers can use member number and PIN without an app or wallet;
- no duplicate refund/credit can execute silently;
- every remedy has evidence, authority, and reconciliation status;
- Maya cannot self-approve or claim outcomes without source evidence;
- the 100-vote threshold creates review work, not automatic placement;
- customer machine/product information is permission-safe and freshness-labeled.

## Open Configuration Decisions

- automatic credit/refund value limits and approver tiers;
- credit expiration and transfer rules;
- exact member identity proof and PIN recovery process;
- whether the customer chooses refund versus credit in every eligible case;
- vote scope and expiry/reset period;
- customer-facing inventory freshness threshold.
