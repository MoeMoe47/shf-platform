# SHU Commercial Product Registry 3C Service And Audit

Phase: `SHU-COMMERCIAL-PRODUCT-REGISTRY-3C`

Result: governed service layer added for the Commercial Product Registry. No API routes, registry UI, SHF-Next changes, runtime candidate seeds, pricing calculations, commission calculations, recruiting revenue, or Solution Builder work were added.

## Service Location

Service file:

`apps/shs-api/src/domain/commercial-product-registry/service/commercial-product-registry-service.ts`

The service sits above the 3B repository. Repository methods persist rows in the existing 3B tables; the service owns validation, governance policy, lifecycle transitions, audit events, and Sales-facing projection behavior.

## Generic Update Versus Governed State Changes

`updateDescriptiveMetadata` is bounded to descriptive fields:

- canonical/display name
- slug
- subfamily
- description
- short description

It rejects lifecycle, readiness, sellability, review gates, pricing, margin, commission, legal/regulatory approvals, audit metadata, verified authority metadata, timestamps, provenance, and tenant identity fields. Governed state changes must use dedicated service methods.

## Lifecycle Policy

`transitionLifecycle` centralizes lifecycle changes using the 3A `PRODUCT_LIFECYCLE_TRANSITIONS` map:

- `DISCOVERED`
- `DEFINED`
- `REVIEW`
- `PILOT_READY`
- `PILOT_ACTIVE`
- `SALES_READY`
- `ACTIVE`
- `SUSPENDED`
- `SUNSET`
- `RETIRED`

Invalid transitions are rejected and valid transitions are audited through canonical `audit_events`.

## Readiness And Sellability Review

`reviewReadiness` requires evaluator/authority provenance and a reason except for explicitly unknown state. It preserves evidence references, evaluated time through the repository update, and staleness metadata.

`reviewSellability` is separate from readiness. It supports reason, blockers, restrictions, effective dates, staleness, and source authority. No one-to-one mapping with readiness is enforced.

## Review Gate Governance

`manageReviewGate` supports 3A gate types and statuses. `APPROVED` requires authority or reference. `BLOCKED` requires a reason. `STALE` remains a separate status from `PENDING`. Gate-specific capabilities distinguish legal, regulatory, pricing, and margin gates from generic commercial edits.

## Source Authority Management

The service supports add, update/replace, deactivate, and list source authorities. It validates authority type, source record id, source status, verification metadata, and provenance. It stores references only and does not copy source-system payloads.

## Buyer And Commercial Form Management

The service supports add/remove buyer compatibility and commercial forms. It validates 3A vocabularies, rejects duplicate active mappings at the service boundary, and audits material changes.

## Funding And Entitlement Boundaries

Funding relationship management supports 3A statuses and categories only. `ELIGIBLE` is not representable as a registry funding status. Compatibility is metadata, not eligibility.

Entitlement management stores required/optional entitlement ids and status references. The registry does not duplicate entitlement definitions or become entitlement authority.

## Product Relationships

The service supports add, deactivate, and list relationships using all 3A relationship types. It rejects invalid self-relations and duplicate equivalent active relationships.

Bounded cycle validation is implemented for direct inverse `PREREQUISITE`, `REPLACES`, and `SUPERSEDES` edges. Full graph-wide cycle validation remains deferred to a later graph service phase because it requires traversing the complete product relationship graph consistently across repository adapters.

## Regulated Program Metadata

Regulated metadata updates preserve external regulatory authority, external training authority requirement, credential authority, partner requirement, scope limitations, and sales-language restrictions. The service does not infer regulatory approval and descriptive updates cannot clear restrictions.

## Implementation, Support, Renewal, Expansion, And Social Selling

Dedicated governed methods manage:

- implementation requirement, tier, owner
- support requirement and tier
- managed-service availability
- SLA status without inventing commitments
- training/professional-development availability
- renewal model, term, and window
- expansion, upsell, and cross-sell paths
- approved public/social sharing metadata
- campaign tags and talking-points references
- sales language and brand restrictions

No renewal automation or marketing copy is generated.

## Pricing, Margin, Commission, And Revenue Boundary

`updateGovernanceState` allows metadata/status/reference only:

- pricing status/model/authority/reference
- discount policy reference
- margin status and policy references
- commercial viability status
- commission eligibility/status/policy references
- leadership/renewal/expansion commission decision metadata
- allowed revenue classifications

The service rejects price amounts, unit prices, computed prices, margin amounts, commission rates, calculated commission payloads, leadership override amounts, and recruiting/recruitment revenue.

## Sales Read Model

`projectSalesProductReadModel` projects persisted registry data to the approved Sales-facing contract shape:

- product id, name, family, short description
- buyer fit and forms
- readiness and sellability
- selling and delivery entity
- pricing, funding, implementation, support, commission, renewal, expansion metadata
- review blocks
- source provenance
- last verified timestamp

Summary and distribution counts are calculated only from actual repository rows.

## Mock Status Behavior

An empty registry returns `CONNECTED_EMPTY`. Repository connectivity failures return `NOT_CONNECTED` where the adapter exposes that failure, otherwise `ERROR`. Zero rows are never treated as `NOT_CONNECTED`.

## Audit Integration

All material mutations write canonical `audit_events` rows via `writeAuditEvent`. No registry-specific audit table was created.

Audited actions include:

- product create
- descriptive update
- lifecycle transition
- readiness review
- sellability review
- gate change
- source authority change
- buyer/form change
- funding relationship change
- entitlement reference change
- product relationship change
- regulated metadata change
- implementation/support change
- renewal/expansion change
- social-selling change
- pricing/margin/commission governance-state change

## Capabilities And 3D Contract

The service exports `COMMERCIAL_PRODUCT_REGISTRY_CAPABILITY_CONTRACT`, using the 3A capability identifiers. If an actor carries a `capabilities` array, service methods enforce it. If route middleware supplies broader authorization later, 3D must pass a canonical actor with the exact applicable capability and must not treat a generic Sales role as legal, regulatory, pricing, margin, commission, or sponsorship authority.

## GLOBAL_CANONICAL Boundary

`COMMERCIAL_PRODUCT_REGISTRY_SCOPE.identityScope` remains `GLOBAL_CANONICAL`. Canonical product identity has no tenant id. Future tenant, geography, entity, buyer, or account-specific availability must be modeled as governed overlays/projections rather than by changing canonical product identity.

## Deferred Work

Deferred to later phases:

- API routes and route middleware
- registry UI
- SHF-Next integration
- seeding the 32 audited commercial candidates
- full graph-wide relationship cycle validation
- source-system adapters
- pricing, margin, commission, and leadership override calculations
- renewal automation
- marketing copy generation
- Solution Builder
