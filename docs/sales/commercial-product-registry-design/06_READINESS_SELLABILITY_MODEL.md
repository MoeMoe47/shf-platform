# Readiness And Sellability Model

Readiness describes product maturity and evidence. Sellability describes whether Sales may offer it under commercial controls. They are related but not identical.

## Readiness States

- `RED`: do not sell; missing, blocked, not found, concept-only, or materially unsafe for commercialization.
- `YELLOW`: controlled pilot only; meaningful implementation evidence exists, but production commercial authority is incomplete.
- `GREEN`: production sellable; required product, source, legal/entity, pricing, support, entitlement, delivery, and evidence controls are approved.
- `BLUE`: strategic or enterprise ready; production sellable plus enterprise support, governance, renewal, expansion, reporting, and scale controls.
- `UNKNOWN`: insufficient evidence to determine readiness.

## Promotion Evidence

No manual UI toggle is sufficient. Promotion requires:

- Source authority references for material claims.
- Review gates approved or documented as not required.
- Pricing status appropriate to target state.
- Entitlement and delivery references where applicable.
- Support and implementation model where applicable.
- Regulated-program boundaries where applicable.
- Current provenance and verification timestamps.

## Sellability States

- `SELL_NOW`: Sales may sell under approved commercial controls.
- `PILOT`: controlled pilot only; no broad sales.
- `DEVELOP`: legitimate candidate requiring packaging, authority, support, review, or governance work.
- `NOT_SELLABLE`: should not be sold; may exist as guard record.
- `NEEDS_REVIEW`: potential exists, but entity, legal, tax, regulatory, funding, or authority review blocks classification.

## Mapping Rules

- `YELLOW` often maps to `PILOT`, but not automatically.
- `GREEN` and `BLUE` may map to `SELL_NOW` only when pricing, gates, support, entitlement, and source authority are also approved.
- `UNKNOWN` usually maps to `DEVELOP` or `NEEDS_REVIEW`.
- `RED` usually maps to `NOT_SELLABLE`, but may remain `NEEDS_REVIEW` when the blocking evidence is review-specific.

## Explicit Reasons And Blockers

Records must carry:

- `sellability_reason`
- `sellability_blockers`
- `readiness_reason`
- `readiness_evidence_required`
- `promotion_requirements`

