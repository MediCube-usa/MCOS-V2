# Page Spec: Marketing / Outreach / New School Integration

Status: LOCKED DRAFT  
Date: 2026-08-05

## Purpose

Own MediCube Campaigns, approved outreach, promotions, coupons, competitions, launch communications, and the communication workstream for onboarding a new school or facility. It coordinates linked tasks but does not take ownership from Facilities, Contacts, Documents, Inventory, Vouchers, Finance, or Machine Setup.

## Owned Records

- Campaign and campaign version;
- audience definition and approved contact selection;
- message/content version and approval;
- promotion, coupon, and competition rules;
- channel, schedule, launch state, and results;
- Sponsored Product Benefit promotion link;
- outreach activity and response status;
- new-school communication checklist;
- facility restrictions and required approvals as linked references.

## Campaign Types

- facility/school opening and machine launch;
- product or wellness education;
- Sponsored Product Benefit awareness;
- promotion or coupon;
- customer competition;
- product-request/voting outreach;
- service, availability, or program announcement;
- prospective school/facility outreach.

## Campaign Workflow

`draft -> audience/rule validation -> facility/compliance review -> content approval -> scheduled -> active -> paused/completed -> results and reconciliation`

Alternative states: `blocked`, `cancelled`, `expired`.

No campaign can silently change product price, voucher eligibility, sponsored-benefit entitlement, inventory, or facility policy. Those changes require their owning workflows.

## Promotions, Coupons, and Competitions

Each rule set records eligibility, facility/machine/product scope, start/end time, quantity/value limits, funding source, redemption mechanism, stacking/duplication rules, winner/award method where applicable, approval, and version.

- Coupons create an auditable benefit/discount reference; they are not payment credentials.
- Competitions require explicit rules, entry evidence, selection evidence, and human approval before awards.
- Marketing may link to Sponsored Product Benefits but cannot create unapproved eligibility or redemption.
- Customer claims, failed redemptions, and award disputes route to Customer Care.

## New School Integration Workflow

Marketing owns the communication track:

- identify and verify stakeholder contacts;
- capture school brand/message rules and prohibited content;
- prepare outreach and approval calendar;
- coordinate announcement, opening-week, and program education messages;
- link contracts, facility onboarding, setup, delivery, inventory, maps, and reporting tasks;
- record approvals, send/delivery status, responses, blockers, and launch results.

Facilities owns the facility record and rules. Contacts owns people and organizations. Documents owns contracts/approvals. Calendar owns scheduled events. Machine Setup owns physical deployment and go-live.

## Customer-Facing Boundary

Approved campaigns may publish to `medicubehealth.net` and supported machine screens. MCOS V2 remains private. Customer-facing content must be versioned, facility-scoped, permission-safe, and removable without changing operational evidence.

## Views

- campaign list and detail;
- audience/contact selection;
- content and approval versions;
- promotions/coupons/competitions;
- Sponsored Product Benefit links;
- new-school onboarding communication plan;
- calendar/tasks/documents;
- delivery/channel status and results;
- blockers and audit history.

All views support loading, empty, stale, permission-restricted, integration-disconnected, partial-data, and error states.

## Permissions and Approvals

- agents may research, draft, segment, schedule proposals, and summarize results;
- external send/publish, rule activation, award approval, and material edits require authorized human approval;
- facility-specific restrictions override generic campaign defaults;
- restricted customer, school, financial, and sponsor data remains scoped;
- all imports, exports, sends, approvals, edits, pauses, and result adjustments are audited.

## Command Center Summary

- campaigns awaiting approval;
- launches and school communications due soon;
- blocked/failed sends;
- active promotion/coupon/competition exceptions;
- Sponsored Product Benefit campaign readiness;
- responses and tasks requiring owner action.

## Acceptance Criteria

- every active communication points to an approved content and rule version;
- campaign scope cannot override facility, compliance, benefit, voucher, inventory, or pricing ownership;
- sends and customer-visible publications are permissioned and auditable;
- new-school communication tasks link to the canonical onboarding records;
- competition awards and coupon/benefit redemptions cannot be duplicated silently;
- disconnected channels display honestly and never appear sent.

## Open Configuration Decisions

- approved outbound channels and sending accounts;
- coupon funding/discount accounting rules;
- competition legal/compliance review requirements;
- result metrics and attribution windows;
- exact new-school launch communication templates.
