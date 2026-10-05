# 3A Authority And Contracts

Phase: `SHU-COMMERCIAL-PRODUCT-REGISTRY-3A`

Design authority: `docs/sales/commercial-product-registry-design/`

Design commit: `35ad79a`

## Domain Location

The contract layer lives at:

`apps/shs-api/src/domain/commercial-product-registry/model/commercial-product-registry-contract.ts`

This is a dedicated domain because the Commercial Product Registry owns commercial representation. It is not placed under `sales/`; Sales is a consumer of the registry read model, not product authority.

No API routes, repositories, database tables, migrations, UI, or seed data were added.

## Registry Authority

The registry owns:

- Commercial product identity contracts.
- Commercial family, type, form, readiness, sellability, lifecycle, gate, relationship, and read-model vocabularies.
- Commercial metadata boundaries for pricing, margin, commission, renewal, expansion, implementation, support, funding compatibility, social selling, and regulated-program representation.
- Source authority reference shape and provenance requirements.

The registry does not own:

- Organization identity.
- Programs.
- Curriculum.
- Career pathways.
- Credentials.
- Service Catalog.
- Entitlements.
- Funding eligibility.
- Evidence, Truth Spine, or Oracle truth.
- Treasury.
- Contracts.
- Delivery.
- Production projects.
- QA.
- ClientOps.
- Reporting.
- Regulatory licensing.

Doctrine preserved:

```text
No record, no card.
No authoritative source, no operational fact.
No verified evidence, no verified claim.
```

## Contract Inventory

The contract layer defines:

- `ProductIdentityContract`
- `ReadinessContract`
- `SellabilityContract`
- `ReviewGateContract`
- `EntityContract`
- `BuyerCompatibilityContract`
- `SourceAuthorityReference`
- `FundingRelationshipContract`
- `EntitlementReferenceContract`
- `PricingMetadataContract`
- `MarginMetadataContract`
- `CommissionLeadershipMetadataContract`
- `ProductRelationshipContract`
- `RegulatedProgramMetadataContract`
- `ImplementationSupportMetadataContract`
- `RenewalExpansionMetadataContract`
- `SocialSellingMetadataContract`
- `CommercialProductReadModel`
- `CommercialProductSummaryCounts`
- `CommercialProductDistribution`
- `MockStatusContract`
- `CommercialProductRegistryContract`

## Enums And Vocabularies

Encoded vocabularies include:

- 15 commercial families.
- Product types.
- Identity statuses.
- Lifecycle states and transition vocabulary.
- Readiness states.
- Sellability states.
- Review gate types and statuses.
- Selling/delivery entity classifications and review flags.
- Governed buyer types.
- Commercial forms.
- Source authority types and statuses.
- Funding relationship statuses and categories.
- Pricing statuses.
- Margin and commercial viability statuses.
- Commission eligibility and governed decision statuses.
- Sales leadership role names for future compatibility.
- Product-level revenue classifications.
- Product relationship types, directions, and statuses.
- Regulated-program types.
- Implementation tiers.
- Support tiers.
- Renewal models.
- Sales language statuses.
- Mock/read-model connection statuses.
- Governance capability identifiers.

## Source Authority Boundary

`SourceAuthorityReference` captures authority type, authority id, domain, record id, version, status, last verified timestamp, and provenance. It is a reference contract only. Source truth must stay in its source authority.

## Sales Boundary

The registry exports `COMMERCIAL_PRODUCT_REGISTRY_AUTHORITY` and `SALES_CONSUMER_AUTHORITY`. Tests assert that Sales is not represented as product authority.

## Pricing Boundary

`PricingMetadataContract` stores status, model, authority, reference, effective dates, currency, and discount policy reference. It does not store price calculations or quote generation.

## Funding Boundary

`FundingRelationshipContract` supports compatibility statuses and categories. The contract intentionally does not expose funding eligibility status. `assertNoFundingEligibilityField` guards against eligibility fields being introduced into registry metadata.

## Entitlement Boundary

`EntitlementReferenceContract` references required and optional entitlement ids plus entitlement authority/status references. It does not replace Service Catalog or Entitlements authority.

## Commission And Leadership Boundary

`CommissionLeadershipMetadataContract` carries eligibility/status metadata only. `assertNoCommissionCalculation` rejects commission amount/rate/calculation fields. Recruiting is not a revenue classification.

## Regulated-Program Boundary

`RegulatedProgramMetadataContract` supports external regulatory authority, external training authority requirement, credential authority, partner dependency, scope limitations, and sales language restrictions.

## Read-Model Contract

`CommercialProductReadModel` supports the approved mock/read model fields:

- Product identity.
- Family and short description.
- Buyer fit.
- Readiness and sellability.
- Commercial forms.
- Selling and delivery entity.
- Pricing, funding, implementation, support, commission, renewal, and expansion metadata.
- Review blocks.
- Source provenance.
- Last verified timestamp.
- Mock connection status.

Counts and distributions are represented as contracts only. They must not be fabricated.

## Mock Status Contract

`MockStatusContract` supports:

- `LOADING`
- `CONNECTED`
- `CONNECTED_EMPTY`
- `NOT_CONNECTED`
- `BLOCKED`
- `STALE`
- `UNKNOWN`
- `ERROR`

These states are future UI/read-model states only; no frontend components were created.

## Governance Capabilities

Defined capability identifiers:

- `commercial_product.read`
- `commercial_product.create`
- `commercial_product.edit`
- `commercial_product.review_readiness`
- `commercial_product.review_sellability`
- `commercial_product.review_legal`
- `commercial_product.review_regulatory`
- `commercial_product.review_pricing`
- `commercial_product.review_margin`
- `commercial_product.review_commission`
- `commercial_product.review_sponsorship`
- `commercial_product.retire`

They are not wired into routes because no Product Registry routes exist in this phase.

## Validation Helpers

Pure helpers validate enum values, identity shape, source authority references, readiness, sellability, review gates, relationship types, invalid self-relations, mock states, and basic lifecycle transitions.

No helper calls databases, services, APIs, or external authorities.

## Deferred Work

Deferred to future phases:

- Database tables.
- Migration 153.
- Repositories.
- API routes.
- Frontend UI.
- Candidate seeding.
- Source adapters.
- Readiness calculation.
- Sellability calculation.
- Pricing authority integration.
- Revenue/commission implementation.
- Solution Builder integration.

