# MCOS V2 Canonical Entity Model

Status: LOCKED P0  
Date: 2026-08-04

## Global Record Rules

Every canonical entity includes:

- stable UUID
- organization ID
- human-readable reference
- lifecycle status
- created/updated timestamps
- created/updated identity
- version number
- source system
- source reference when imported
- soft-archive timestamp when applicable

No entity is identified only by a mutable name, slot number, provider ID, or external machine ID.

## Core Organization and Access

- Organization
- User
- Role
- Permission
- RoleAssignment
- ServiceAccount
- AgentDefinition
- AgentToolGrant
- AgentInstructionVersion

## Facilities and People

- Facility
- FacilityArea
- Contact
- ContactRole
- ContactRelationship
- Address
- Placement
- FieldInstruction

## Products and Supply

- Product
- ProductMedia
- ProductRestriction
- Supplier
- SupplierProduct
- ProductSubstitution
- PurchaseRequest
- PurchaseOrder
- PurchaseOrderLine
- Shipment
- ReceivingRecord

## Machines and Configuration

- Machine
- MachineExternalIdentity
- MachineConnection
- MachineDigitalTwin
- MachineObservation
- MachineDesiredState
- MachineAlert
- ServiceRecord
- ScreenDevice
- ScreenAgentInstallation
- MachineTemplate
- MachineTemplateVersion
- TemplateSlot
- MachineTemplateAssignment
- ConfigurationChangePlan

## Inventory and Field Work

- InventoryLocation
- InventoryBalance
- InventoryTransaction
- InventoryCount
- Slot
- SlotAssignment
- RestockWorkOrder
- RestockLine
- FieldAssignment
- CompletionProof

## Payments, Vouchers, Support, and Finance

- PaymentProvider
- PaymentTerminal
- PaymentTransaction
- Settlement
- VoucherProgram
- VoucherEligibilityDecision
- VoucherRedemption
- DispenseResult
- SupportCase
- RefundRequest
- AccountingReference
- Invoice
- PayoutObligation
- Reconciliation

## Operations

- Task
- WorkflowInstance
- WorkflowStep
- ApprovalRequest
- Notification
- CommunicationItem
- CalendarEvent
- Document
- DocumentVersion
- ReportDefinition
- ReportRun
- AuditEvent
- Integration
- IntegrationCredentialReference
- RawMessageEnvelope
- NormalizedEvent
- DeadLetterRecord
- ImportJob
- ExportJob

## Critical Relationships

- Facility has many placements and machines.
- Machine has many external identities but one canonical MCOS ID.
- Machine has one current twin assembled from many observations.
- Template versions define desired slots; slot observations define actual slots.
- Product is referenced by supplier products, template slots, inventory, payments, vouchers, and reports.
- Inventory transaction is the immutable quantity movement; balance is its current projection.
- Restock completion creates inventory transactions after confirmation.
- Payment transaction, voucher redemption, dispense result, and refund remain separate but linked.
- Task, approval, notification, and audit event can reference any canonical entity using typed resource links.
- Raw envelopes are immutable evidence; normalized events are replayable interpretations.

## Stable Identity Mapping

External identifiers are stored in mapping records with:

- provider/system
- external ID
- canonical entity ID
- valid-from/valid-to
- verification status
- evidence reference

Machine number, TCN ID, OurVend ID, payment terminal ID, screen device ID, and legacy V1 ID must never be collapsed into one field.

## State and History

- current mutable state is a projection
- important transitions are immutable events
- financial and inventory movements are append-only transactions
- templates/instructions/documents use versions
- destructive deletion is prohibited for operational evidence; archive instead
- imports preserve source file, row reference, and validation result

## Acceptance Criteria

- every page record maps to one canonical entity owner
- all external IDs map to stable MCOS IDs
- inventory, payments, vouchers, and refunds remain reconcilable
- digital twin supports observed and desired state without overwriting either
- all imports and integration messages retain evidence lineage
