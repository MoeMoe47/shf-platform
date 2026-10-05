# Onboarding Rules

## Source reconciliation

The authoritative input pair is `docs/sales/commercial-catalog-audit/commercial-candidate-inventory.json` and `docs/sales/commercial-product-registry-design/initial-32-candidate-design-mapping.json`. Every `cc-###` identifier must have exactly one row in each. The 3A TypeScript contract controls persisted enum values; mapping labels outside it cannot enter service calls.

Candidate-to-product identity uses Design-2's stable `commercial_product_id`, canonical name, display name, and slug. Version starts at `1`. Existing product identity is compared before apply; a different name, family, type, lifecycle, readiness, sellability, or entity classification is a conflict.

## Registration gate and lifecycle

Registration requires a valid deterministic product identity, contract family/type, source reference, lifecycle, readiness, sellability, selling/delivery entity, version, and no validation error. A `REVIEW` lifecycle may be registered with its audited state intact when those minimums exist. Source-missing candidates are not registered.

The canonical lifecycle model requires pilot gates approved before `PILOT_READY`. The Design-2 mapping proposed `PILOT_READY` for audited PILOT candidates even though the attached gates remain pending or unknown. 4A therefore maps every candidate with pending/blocked gates, and every Design-2 PILOT_READY candidate, to `REVIEW`. This is a conservative correction to the candidate mapping. The importer never creates PILOT_ACTIVE, SALES_READY, or ACTIVE by inference. Existing readiness and sellability are still preserved even when their combination sits in REVIEW; that tension remains visible for governed review rather than changing either classification.

## Readiness and sellability

Audit values are copied without upgrade. Readiness reason and source references are stored with the core record. Sellability reason, authority, blockers, restrictions, and source reference are preserved. A subsequent change must use the existing readiness or sellability review service.

## Authorities and SHF / SHS / partner roles

Each source row retains a 3A authority type, source domain, original repository path, FOUND/PARTIAL status, and provenance. Paths that point only to demo cards, fixture data, audit gap documents, or keyword scans are not treated as an authority. `SHF`, `SHS`, `PARTNER`, `JOINT_STRUCTURE_REVIEW_REQUIRED`, and `UNKNOWN` are retained or conservatively mapped from the documented Design-2 entity state. No legal or tax conclusion is created.

## Reviews and regulated offerings

Design-2 review gate states are copied as PENDING, BLOCKED, or UNKNOWN without approval claims. Carried review states do not receive a `reviewed_at` timestamp. The 4A service path preserves that nullable meaning. Regulated family candidates retain external-authority-required state and explicit restrictions. SHU is never assigned as an external credential or licensing authority.

## Funding, pricing, margin, commission

Funding status is compatibility metadata only. A funding row is persisted only when both a governed status and a source-supported 3A funding category exist; otherwise the source value stays in the manifest and a Funding review is recorded. No eligibility, award, or guarantee is expressible.

Unknown pricing maps to `NOT_DEFINED`, the 3A pricing status for absence of a definition; source status remains alongside it. Margin and commission statuses are preserved. No price, cost, margin percentage, commission rate, leadership override, or recruiting revenue is represented.

## Mapping exceptions and duplicates

The manifest includes source type, `unmapped_commercial_forms`, raw source values, and review requirements wherever Design-2 vocabulary cannot map directly to a canonical form. Unmapped values are visible and excluded from 3A enum arrays. Repeated canonical name or product ID is rejected; known overlap concerns remain documented in [the review matrix](03_REVIEW_AND_BLOCKER_MATRIX.md).

Horizontal capabilities are not expanded into additional candidates unless the original inventory identifies them as independent candidates. Sponsorship classes remain candidate-specific; SHNN/media sponsorship is not created without authority.
