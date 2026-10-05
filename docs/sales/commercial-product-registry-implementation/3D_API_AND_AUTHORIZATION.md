# SHU Commercial Product Registry 3D API and Authorization

## Canonical Route Base

The Commercial Product Registry API is registered at:

`/commercial-products`

This path is intentionally outside `/sales`. Sales consumes registry projections, but Sales is not the authority for product identity, readiness, sellability, pricing metadata, funding relationships, entitlements, or source authority references.

## Route Inventory

- `GET /commercial-products`
- `GET /commercial-products/sales-read-model`
- `GET /commercial-products/summary`
- `GET /commercial-products/distributions`
- `GET /commercial-products/slug/:slug`
- `GET /commercial-products/:id`
- `POST /commercial-products`
- `PATCH /commercial-products/:id`
- `POST /commercial-products/:id/lifecycle`
- `POST /commercial-products/:id/readiness-review`
- `POST /commercial-products/:id/sellability-review`
- `GET|POST /commercial-products/:id/source-authorities`
- `PATCH /commercial-products/:id/source-authorities/:sourceReferenceId`
- `POST /commercial-products/:id/source-authorities/:sourceReferenceId/deactivate`
- `GET|POST /commercial-products/:id/buyers`
- `DELETE /commercial-products/:id/buyers/:buyerType`
- `GET|POST /commercial-products/:id/commercial-forms`
- `DELETE /commercial-products/:id/commercial-forms/:commercialForm`
- `GET /commercial-products/:id/review-gates`
- `POST /commercial-products/:id/review-gates/:gateType`
- `GET|POST /commercial-products/:id/funding-relationships`
- `GET|POST /commercial-products/:id/entitlement-references`
- `DELETE /commercial-products/:id/entitlement-references/:requirement/:entitlementId`
- `GET|POST /commercial-products/:id/relationships`
- `POST /commercial-products/:id/relationships/:relationshipId/deactivate`
- `PATCH /commercial-products/:id/regulated-program`
- `PATCH /commercial-products/:id/implementation-support`
- `PATCH /commercial-products/:id/renewal-expansion`
- `PATCH /commercial-products/:id/social-selling`
- `PATCH /commercial-products/:id/governance-state`

## Authentication and Authorization

Every route requires backend-authenticated `req.user` with active organization context and `tenant_id`. Development frontend identity is not used as backend authorization.

Registered capabilities:

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
- `commercial_product.transition_lifecycle`
- `commercial_product.retire`

Default assignment is conservative: `super_admin` inherits all registered permissions; `shs_admin` receives read/create/edit only; `auditor` and `read_only_viewer` receive read. Reviewer capabilities are otherwise reserved until role design assigns them explicitly.

## Governed Mutation Model

Routes call the 3C service layer for all mutations. Route handlers do not write audit truth, bypass lifecycle transition logic, or directly mutate readiness, sellability, review gates, pricing, margin, commission, regulated metadata, source authorities, relationships, funding, or entitlements.

Generic `PATCH /commercial-products/:id` is descriptive only. It rejects protected or governed fields such as lifecycle, readiness, sellability, review gates, legal/regulatory/pricing/margin/commission approvals, audit fields, timestamps, provenance, and actor fields.

Dedicated routes govern:

- Non-retirement lifecycle transition through `POST /:id/lifecycle` with `commercial_product.transition_lifecycle`
- Retirement through `POST /:id/lifecycle` with `commercial_product.retire`
- Readiness review through `POST /:id/readiness-review`
- Sellability review through `POST /:id/sellability-review`
- Gate review through `POST /:id/review-gates/:gateType`
- Regulated metadata through `PATCH /:id/regulated-program`
- Pricing/margin/commission metadata through `PATCH /:id/governance-state`

## Gate Capability Matrix

- `COMMERCIAL_READINESS`: `commercial_product.review_readiness`
- `LEGAL`: `commercial_product.review_legal`
- `REGULATORY`: `commercial_product.review_regulatory`
- `PRICING`: `commercial_product.review_pricing`
- `MARGIN`: `commercial_product.review_margin`
- `COMMISSION`: `commercial_product.review_commission`
- `PARTNER`: `commercial_product.review_sponsorship`
- Other gate types remain blocked at the route layer until a dedicated capability is assigned.

## Read Model and Mock Support

`GET /commercial-products/sales-read-model` returns a Sales-consumable projection derived from canonical registry rows. Fields include commercial product id, name, family, short description, buyer fit, readiness, sellability, commercial forms, selling and delivery entities, pricing status, funding relationship, implementation/support status, commission eligibility, renewal model, expansion paths, review blocks, source provenance, and last verified timestamp.

Summary counts support `SELL_NOW`, `PILOT`, `DEVELOP`, `NEEDS_REVIEW`, and `NOT_SELLABLE`. Distribution counts support family, readiness, and sellability. Counts are derived from persisted product rows; no demo fallback or 32-candidate seed is used.

An empty connected registry returns `CONNECTED_EMPTY` and an empty item list.

## Filtering, Pagination, and Sorting

Bounded filters:

- `search`
- `family`
- `readiness`
- `sellability`
- `buyer_type`
- `commercial_form`
- `selling_entity`
- `delivery_entity`
- `funding_relationship`

Safe sort fields:

- `name`
- `family`
- `readiness`
- `sellability`
- `last_verified_at`

Pagination accepts `page` and `page_size`, with `page_size` capped at 100.

## Boundary Rules

Funding routes expose relationship metadata only. Registry funding state is limited to `POTENTIAL`, `DOCUMENTED`, `VERIFIED`, `NOT_FOUND`, and `REVIEW_REQUIRED`; `ELIGIBLE` remains outside Product Registry authority.

Entitlement routes expose references only. They do not create or modify entitlement definitions.

Pricing, margin, and commission routes expose statuses and references only. They do not calculate prices, discounts, margins, commissions, leadership overrides, or revenue truth.

Regulated metadata routes require regulatory authority and do not infer certification.

Implementation, support, renewal, and social-selling metadata remain metadata only. No SLA commitments, renewal automation, or marketing copy generation is introduced.

## Error Contract

Routes return structured response envelopes with error codes mapped to the 3D contract:

- `NOT_FOUND`
- `UNAUTHENTICATED`
- `FORBIDDEN`
- `INVALID_INPUT`
- `INVALID_TRANSITION`
- `INVALID_GATE`
- `AUTHORITY_REQUIRED`
- `DUPLICATE_RELATIONSHIP`
- `INVALID_RELATIONSHIP`
- `CONFLICT`
- `STALE_RECORD`
- `REGISTRY_NOT_CONNECTED`
- `INTERNAL_ERROR`

## Audit Propagation

Routes do not write audit events directly. They pass the authenticated actor, organization context, tenant context, and permission-derived capabilities into the 3C service. The service writes canonical `audit_events`.

## Deferred Work

Frontend UI, SHF-Next changes, 32-candidate seeding, Solution Builder, Account Intelligence, Grant History, commission calculation, price creation, and funding eligibility calculation are explicitly deferred.
