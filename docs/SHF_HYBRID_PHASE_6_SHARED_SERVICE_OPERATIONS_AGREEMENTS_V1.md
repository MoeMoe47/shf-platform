# SHF Hybrid Phase 6: Shared-Service Operations & Agreements

## Canonical Agreement Owner

Phase 6 introduces `service_agreements` as the canonical backend owner for governed shared-service operating agreements. It reuses canonical organizations, service catalog rows, organization relationships, organization service entitlements, identity, permissions, and audit events.

No second organization registry, service catalog, entitlement engine, legal archive, funding store, or billing system is introduced.

## Entitlement vs Agreement

An organization service entitlement answers whether an organization may receive a service.

A service agreement answers under what approved operating terms a provider organization may provide a catalog service to a consumer organization.

`ACTIVE` entitlement does not automatically create or activate a service agreement. `ACTIVE` service agreement does not override entitlement status, effective dates, relationship validity, or actor permissions.

## Provider / Consumer Semantics

Every agreement persists:

- `provider_organization_id`
- `consumer_organization_id`
- `service_id`

Provider is derived from the canonical service catalog row. The browser cannot submit or override provider authority, approval actor, activation actor, timestamps, or audit actor.

## Agreement Lifecycle

Phase 6 supports:

- `DRAFT`: terms are recorded but not enforceable runtime authority.
- `APPROVED`: terms are institutionally approved but not operationally active.
- `ACTIVE`: approved terms are operationally active after entitlement and relationship validation.
- `SUSPENDED`: agreement is preserved, but agreement-governed service is denied.
- `TERMINATED`: future service under the agreement is denied while history remains readable to authorized parties.
- `EXPIRED`: reserved for effective-date evaluation and future scheduled status handling.

## Preconditions

Creation and activation validate the relationship required by the catalog service, such as `NETWORK_MEMBER_OF`.

Activation validates an active matching entitlement for the same consumer organization and service. Agreement activation is denied when the entitlement is missing, suspended, revoked, expired, or for a different service.

## Agreement Requirement Policy

The service catalog owns agreement policy:

- `reporting`: `AGREEMENT_REQUIRED`
- `project_studio`: `AGREEMENT_REQUIRED`
- `curriculum`: `NO_AGREEMENT_REQUIRED`
- `truth_evidence`: `OPTIONAL_AGREEMENT`
- `career_workforce`: `OPTIONAL_AGREEMENT`

Provider self-consumption remains compatible and does not require a service agreement.

## Activation, Suspension, and Termination

Activation requires an explicit authorized provider/platform action after approval. A draft record does not grant access.

Suspension changes only agreement authority. Entitlement status remains separate and may remain `ACTIVE`; agreement-governed runtime access is still denied.

Termination preserves agreement rows, version history, and audit events. It does not delete organization identity, entitlements, Evidence, Truth, funding, grants, onboarding, credentials, or operational history.

## Amendment / Versioning

Material terms are versioned in `service_agreement_versions`. Amendments create a new version and return the agreement to `DRAFT`, requiring reapproval and reactivation before the amended terms govern service operation.

## SLA / Service Expectation Boundary

Phase 6 stores simple service expectations such as support level, response target, and reporting frequency. It does not monitor SLA compliance, compute availability, manage support tickets, or meter usage.

## Legal Artifact Boundary

The legal layer remains an external/legal-record boundary. Phase 6 stores an optional `agreement_reference`; it does not generate legal contracts, store signed legal artifacts, or implement e-signature.

## Billing, Funding, SHF / SHS Boundaries

Service agreements do not create invoices, subscriptions, payments, procurement records, revenue recognition, grant awards, grant allocations, funder reporting, SHF/SHS settlement, or SHS commercial authority.

Funding/grants may later reference service context, but a grant is not a service agreement and does not automatically create one.

## Runtime Enforcement

For agreement-required services, representative runtime authorization is:

1. Authenticate.
2. Resolve active organization.
3. Validate catalog service status.
4. Validate active entitlement.
5. Validate required organization relationship.
6. Validate active service agreement.
7. Validate actor permission.
8. Authorize the resource.

The existing Reporting and Project Studio route guards compose entitlement, agreement, and actor permission enforcement.

## Audit History

Agreement actions write audit events:

- `service.agreement.created`
- `service.agreement.approved`
- `service.agreement.activated`
- `service.agreement.suspended`
- `service.agreement.amended`
- `service.agreement.terminated`

Audit events are operational history, not impact Evidence or Truth facts.

## Security

Consumer organization admins may view their own agreements. They cannot create, approve, activate, suspend, terminate, or amend provider agreements unless they also have explicit provider/platform authority.

Cross-organization reads and mutations fail closed.

## Explicitly Deferred

Phase 6 does not implement billing, invoicing, subscriptions, payments, procurement, full legal contract generation, e-signatures, SLA compliance monitoring, support ticketing, service desk, usage metering, network impact aggregation, funder reporting, SHF/SHS settlement, or physical facilities.

## Phase 7 Entry Contract

If Phase 6 is complete, Phase 7 may consume Organization, Program stewardship, Network relationships, Service agreements, Funding relationships, Operational Events, Evidence, Truth Spine, and Metric Registry to implement Impact Attribution & Network Aggregation without falsely attributing independent organizations' work to SHF.
