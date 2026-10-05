# SHU Commercial Product Registry 3B Schema And Persistence

Result: persistence foundation implemented for the Commercial Product Registry only. No API routes, Sales UI, SHF-Next changes, production seeds, pricing calculations, commission calculations, or Solution Builder work were added.

## Migration

- Migration file: `apps/shs-api/migrations/153_commercial_product_registry_foundation.sql`
- Migration number decision: `152_sales_cross_account_link_constraints.sql` was the previous head, so `153` is the next valid migration.

## Authority Scope Model

Scope model: `GLOBAL_CANONICAL`.

The core registry record is canonical platform-wide. It stores commercial representation of an offering and references other authorities. It does not carry `tenant_id` or `organization_id` because Sales tenant/account scope is a consumer concern, not the identity model for commercial products.

Future availability, commercial terms, geography, buyer-specific terms, entity-specific approvals, or tenant-specific sellability should be modeled as governed projections or availability overlays. They should not be added blindly to every registry table.

## Table Inventory

- `commercial_products`: stable identity, lifecycle, current readiness/sellability, entity classification, pricing/margin/commission status metadata, archival/version fields.
- `commercial_product_source_authorities`: external/source authority references without copied payloads.
- `commercial_product_buyers`: governed buyer compatibility rows using 3A buyer vocabulary.
- `commercial_product_forms`: governed commercial forms without product prices.
- `commercial_product_review_gates`: durable review gates with constrained gate/status values and approval authority/reference guard.
- `commercial_product_funding_relationships`: funding relationship metadata, not eligibility.
- `commercial_product_entitlements`: entitlement id references only.
- `commercial_product_relationships`: product graph edges with duplicate and self-relation guards.
- `commercial_product_regulatory_metadata`: regulated-program metadata and external authority references.
- `commercial_product_implementation_support`: implementation/support/SLA/training metadata, using governed statuses.
- `commercial_product_renewal_expansion`: renewal model plus path references.
- `commercial_product_social_selling`: public/social language metadata and restrictions.
- `commercial_product_governance_state`: pricing, margin, revenue classification, and commission policy references as metadata.

## Normalized Versus JSONB Decisions

Normalized rows were used where the registry must enforce governed many-to-many or repeated structures: source authorities, buyers, commercial forms, review gates, funding categories, entitlements, and product relationships.

JSONB was retained for bounded reference arrays and metadata lists whose values are projections rather than independent registry entities: provenance arrays, limitations, review flags, blockers/restrictions, program type lists, renewal/upsell/cross-sell path ids, social tags, and revenue classification arrays. These remain constrained where the boundary matters, such as no funding eligibility, no operational revenue truth, and no commission calculation payloads.

## Constraints And Indexes

The schema uses `TEXT` plus `CHECK` constraints, matching nearby migration style. Vocabularies are derived from the 3A contract layer. Core constraints cover product id format, slug format, family/type/status/lifecycle/readiness/sellability values, entity values, status metadata values, review gate approval authority/reference, relationship self-edge rules, duplicate active relationship prevention, and metadata-only prohibitions for funding eligibility, booked/collected/pipeline revenue, recruiting revenue, price payloads, and commission math.

Indexes support likely read-model queries: slug lookup, canonical name uniqueness, family, readiness, sellability, status/lifecycle, selling/delivery entity, last verified, source authority lookup, buyer filters, review gate status, and relationship source/target traversal.

## Repository Surface

Interface: `CommercialProductRegistryRepository`

Implementation: `PostgresCommercialProductRegistryRepo`

Implemented persistence operations:

- create product
- get product by id
- get product by slug
- list products with basic filters
- update descriptive metadata
- update lifecycle
- update readiness
- update sellability
- list/add/replace source authority
- list/add buyer compatibility
- list/add commercial form
- list/add review gate
- list/add product relationship
- list funding relationships

Repository methods enforce persistence shape and let PostgreSQL constraints reject invalid data. They do not approve products, calculate prices, determine funding eligibility, calculate commissions, or make legal/regulatory decisions.

## Audit Hook

Canonical `audit_events` remains the audit authority. This phase does not add a competing audit table.

Expected 3C/service-layer hook: every product create/update, readiness/sellability change, source authority mutation, gate mutation, and relationship mutation should write an ordinary `audit_events` row with:

- `target_object_type = 'commercial_product'` or the child record type when appropriate
- `target_object_id` set to the product or child id
- `action_type` scoped as `commercial_product_registry.*`
- previous/new state JSON where applicable
- actor, reason, correlation id, and source channel from the service request

## Versioning And Lifecycle

Current product version is the `commercial_products.version` integer and is incremented by repository updates. Lifecycle state, status, `archived_at`, `last_verified_at`, relationship types `REPLACES` and `SUPERSEDES`, and renewal metadata support current-state versioning and retirement/supersession.

Dedicated history tables were deferred because canonical `audit_events` already provides append-only mutation history. Full graph-cycle validation is also deferred to a service/domain layer.

## Read Model Support

The approved registry mock can be projected from current tables:

- top counts: aggregate `commercial_products.sellability`
- filters/product list: family, readiness, sellability, lifecycle, status, entity columns
- selected product detail: product row plus child rows
- family distribution: `commercial_family`
- readiness distribution: `readiness`
- sellability distribution: `sellability`

No materialized counts or UI-specific tables were created.
