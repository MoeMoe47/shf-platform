# SHF Hybrid Phase 5 Funding, Grants & Restricted Funds V1

## Canonical Owner

Funding / Grants owns canonical grant award records and program allocations. It does not own Organization, Program, Evidence, Truth, Service Entitlement, Onboarding, Reporting, or accounting-ledger state.

## Funder Identity

Institutional funders reuse canonical Organization identity. Government agencies, private foundations, corporate foundations, corporations, community foundations, and public entities can be represented as organizations without requiring SHF network membership. Individual donors and donor CRM are deferred.

## Grant Recipient

Every award stores an explicit funder organization, recipient organization, and reporting organization. SHF is never inferred as recipient merely because it operates the platform, and the recipient may differ from the program operator.

## Grant Lifecycle

Phase 5 supports `AWARDED`, `ACTIVE`, `SUSPENDED`, `CLOSED`, and `CANCELLED`. Grant awards are distinct from applications, opportunities, and proposal binders.

## Restrictions And Allocations

Restrictions are bounded to institutional categories: unrestricted, program, purpose, time, geography, population, and other. `PROGRAM_RESTRICTED` is deterministically enforced against a canonical Program ID. Allocations store decimal USD amounts and cannot exceed the award amount.

## Program Operator Boundary

Program allocations reference canonical Programs and preserve existing owner/operator/accountable organization fields. Funding does not rewrite program stewardship.

## Reporting Responsibility

The reporting organization is explicit and may differ from the recipient or program operator. Phase 5 stores responsibility metadata only; Phase 8 reporting remains separate.

## Impact Producer Boundary

Grant recipient, funder, and allocation records never determine impact producer. Outcomes remain governed by operational events, Evidence, Truth, and Metric provenance.

## Truth / Evidence Boundary

Funding actions do not create Evidence, Truth claims, completions, credentials, Studio state, service entitlements, or network relationships.

## Entitlement And Onboarding Boundary

Network membership, onboarding activation, and service entitlements do not imply funding. Funding records do not grant service access or alter onboarding status.

## SHF / SHS Boundary

A grant to SHF does not become SHS revenue. No SHS commercial authority, related-party transaction, or intercompany settlement is created in Phase 5.

## Audit Events

Implemented events are `funding.grant.created`, `funding.grant.activated`, `funding.grant.closed`, `funding.grant.cancelled`, `funding.grant.suspended`, and `funding.allocation.created`. Audit actor, organization context, and timestamps are server-derived.

## Security And Isolation

Grant mutation requires `funding.grant.manage`. Read access requires `funding.grant.view` and is scoped to platform funding authority or an organization’s explicit funder, recipient, reporting, or program stewardship relationship to the award.

## Deferred

Phase 5 does not implement general ledger, double-entry accounting, bank reconciliation, payroll, reimbursements, accounts payable, invoice processing, subscription billing, donor CRM, federal compliance automation, indirect-cost calculation, funder dashboards, network impact aggregation, SHF/SHS settlement, procurement, or facilities.

## Phase 6 Entry Contract

Phase 6 may consume Organization, Network Relationship, Service Catalog, Organization Entitlement, activated onboarding state, and Funding relationships to implement shared-service operations and agreements. Phase 5 does not implement Phase 6.
