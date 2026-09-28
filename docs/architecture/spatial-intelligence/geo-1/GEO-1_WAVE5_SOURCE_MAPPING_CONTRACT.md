# GEO-1 Wave 5 Production Source Mapping Contract

## Purpose

A legacy map feature may become a production Spatial feature only after every authority and provenance requirement below is evidenced. A label, coordinate, route, or visual marker alone is insufficient.

## Required Acceptance Checklist

| Requirement | Required evidence | Missing-value result |
| --- | --- | --- |
| Source authority | Named system/domain that owns the record | BLOCKED |
| Source record | Stable canonical record ID | BLOCKED |
| Domain and feature type | Explicit domain classification | BLOCKED |
| Coordinate ownership | Named owner of the geometry/position | BLOCKED |
| Coordinate space | Registered family and stable space ID | BLOCKED |
| Provenance | Source reference, version, and update context | BLOCKED |
| Publication eligibility | Source-controlled publication state | BLOCKED |
| Verification state | Evidence-backed verification value | BLOCKED or conditional |
| Lifecycle/state source | Domain or engine state authority | BLOCKED |
| Adapter contract | Read-only adapter with collision-safe identity | BLOCKED |
| Client compatibility | Valid sanitized `ClientProjectionResult` | BLOCKED |
| Regression coverage | Existing behavior and new projection tests | BLOCKED |

## State Vocabulary

The following states extend, but do not overwrite, existing `UNMAPPED` and `PROVISIONAL` meanings:

```text
LEGACY
UNMAPPED
PROVISIONAL
MAPPING_CANDIDATE
MAPPING_CONFIRMED
ADAPTER_READY
CLIENT_READY
MIGRATION_READY
MIGRATED
BLOCKED
```

`UNMAPPED` means no accepted mapping exists. `PROVISIONAL` means presentation information exists but owner confirmation or authority evidence is incomplete. Neither state is equivalent to `MAPPING_CONFIRMED`.

## Promotion Rules

1. Legacy records remain on their existing path until `MIGRATION_READY` is explicitly recorded.
2. Candidate IDs must not be substituted for canonical source IDs.
3. A destination ID must not be treated as a source record ID.
4. Textual geography must not be treated as geometry.
5. Publication eligibility must be evaluated independently from coordinate validity.
6. A failed or missing authority check produces `BLOCKED` or `UNKNOWN`, never a guessed mapping.
7. Migration requires side-by-side regression evidence and a rollback/disposition record.

## Quick Map Application

All 15 current entries remain either `UNMAPPED` or `PROVISIONAL`. The current registry path is preserved. No production Spatial adapter should consume those entries until the checklist is satisfied individually.
