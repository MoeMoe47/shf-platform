# GEO-1A Temporal Projection Contract

PLACE + TIME + EVENT + AUTHORITY = SPATIAL STATE

This contract formalizes temporal projection. It does not create a scheduler.

## Temporal Categories

- `current`
- `upcoming`
- `soon`
- `live`
- `ended`
- `scheduled_later`

## Required Temporal Fields

- source timestamp
- source authority
- effective start
- effective end
- freshness
- timezone where relevant
- temporal calculation rule
- provenance

## Rules

1. Spatial may calculate temporal presentation only from source-authorized timestamps.
2. Missing start or end times must remain unknown, not inferred.
3. Timezone-sensitive features must declare timezone or source-local interpretation.
4. Stale data must be marked stale or unavailable according to layer policy.
5. Temporal state does not imply verification or publication eligibility.
