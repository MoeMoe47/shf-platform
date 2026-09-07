# SHU Universal Reporting U5: Registry, Solutions, Legal, and Cross-Product Governance

## Status

U5 adds the first supported Registry and Silicon Heartland Solutions projections to the U1 Shared Reporting contract. Legal and cross-product report families remain explicitly deferred because the repository does not contain a canonical Legal API authority or an approved ecosystem-level composition/product identity.

The sole artifact authority remains `apps/shs-api/src/domain/reporting/`. No migration 108 is required.

## Registry authority

The supported Registry projection is based on the implemented `agent_registry_submissions`, `studio_agent_packages`, and Studio project authorities. It reports registration records and registration summaries within organization and tenant scope. It does not create, change, activate, suspend, or revoke Registry records.

The following families are registered:

- `registry-record`
- `registration-summary`

Status history, verification history, and ownership/stewardship remain deferred. The current repository stores submission lifecycle fields, but does not provide a complete Registry-owned transition-history, verification-history, or stewardship authority suitable for those report contracts.

## Registry, OAS, and Trust boundary

OAS requirements and conformance remain OAS-owned. Registry submission and lifecycle facts remain Registry-owned. Trust Bureau status is not implemented by this adapter and is never inferred from either source.

## Solutions authority

The supported Solutions projection uses the implemented service catalog, organization service entitlements, service agreements, organization onboarding cases, and organization scope authorities. It does not query Foundation reporting data or replace BOS state.

The following families are registered:

- `client-operating`
- `service-delivery`
- `implementation`
- `executive-business-review`
- `assurance-control`

These reports are bounded operational summaries. They do not invent SLA measurements, service outcomes, contract conclusions, or completion states.

## Solutions confidentiality

Only service, entitlement, agreement, onboarding, status, scope, and provenance metadata are projected. Credentials, secrets, private configuration, unauthorized contract content, and customer data are excluded.

## Legal authority and disposition

Legal evidence in `docs/legal/legal-layer-v2/` defines a legal-record boundary and explicitly states that technical records are not legal authority. No canonical Legal API, Legal artifact repository, privilege model, or legal-hold service exists in the current implementation. Therefore no Legal product key, Legal adapter, or Legal report family is registered in U5.

The deferred families are:

- `legal-artifact-summary`
- `legal-authority-obligation`
- `legal-readiness`
- `legal-evidence-decision-trace`

Future Legal reporting must be metadata-only by default, remain Legal-owned, preserve privilege and legal holds, and require an approved projection contract before implementation.

## Cross-product governance and disposition

The repository has product-specific adapters but no approved cross-product composition authority or ecosystem product identity in the U1 persistence contract. U5 therefore does not register cross-product artifacts and does not accept caller-supplied arbitrary product payloads.

The deferred families are:

- `cross-product-executive`
- `cross-product-assurance`
- `cross-product-evidence-trace`
- `cross-product-governance-exception`

Future composition must receive independently authorized projections from each source adapter, preserve source product and authority, reconcile classification to the most restrictive included source, preserve each source period, deduplicate canonical references, and fail closed when any required source is unauthorized. It must not become a universal query endpoint.

## Classification and publication

U5 Registry and Solutions reports default to `INTERNAL` and do not accept caller-controlled downgrades. Report generation remains separate from Public Disclosure, publication, release, and Registry lifecycle changes. Cross-product reports, when later authorized, must use the most restrictive source classification and still require separate publication approval.

## Rendering, storage, and history

All supported U5 families use the U1 renderer, JSON/HTML/PDF formats, safe product-aware filenames, product-scoped storage, immutable snapshots, hashes, scoped retrieval, and history. No second renderer, artifact store, template authority, or publication authority was introduced.

## Tests and migration

U5 focused tests cover registry/template registration, Registry authority boundaries, Solutions scope and read-only behavior, unsupported Legal/cross-product fail-closed behavior, and secret-free projections. The full prior reporting suite remains the regression gate. Migration 107 remains the ceiling; no migration 108 was added.

## Final acceptance readiness

Registry and Solutions are ready for controlled product use. Legal and cross-product work are not implementation-ready until their canonical authorities, product identity, authorization contracts, classification/privilege rules, and composition provenance requirements are formally established.
