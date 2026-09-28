# GEO-1 Wave 5 Implementation Plan

## Objective

Move from a certified generic Spatial client to evidence-backed production source mappings and preserved onboarding of existing map systems.

## Subphases

### Wave 5A — Map estate and source-authority discovery

Freeze the estate registry, audit every candidate, record authority gaps, and define the mapping contract. No production adapters or migrations.

### Wave 5B — Existing-map regression harness

Add preservation coverage for Quick Map, Exchange/Capital, SHF Impact, IEP county geometry, and other confirmed clients. Test route, token, data, privacy, and failure behavior before onboarding.

### Wave 5C — First legitimate mappings and adapters

Select the smallest domain with confirmed source identity, coordinate ownership, publication state, and verification evidence. Build a read-only adapter with side-by-side output and rollback evidence.

### Wave 5D — Existing-map Spatial onboarding/restoration

Onboard one map client at a time while preserving legacy rendering and authority. Restore only implementations with evidence-backed ownership and regression coverage.

### Wave 5E — Migration and parity acceptance

Compare legacy and Spatial outputs, verify privacy/accessibility/coordinate parity, accept migration only where the checklist is complete, and record retirement candidates separately.

## Recommended First Implementation Candidate

Do not select a production map until Wave 5B completes. The safest likely candidate is a read-only IEP county geometry adapter only if its geometry provenance, county identifiers, and publication policy are confirmed. SHF public impact is strategically important but currently publication-blocked; Exchange/Capital carries token and remote-data risk; Quick Map legacy markers lack source authority.

## Non-Goals

No resolver fix, route fix, Mapbox replacement, source mapping, database migration, coordinate transform, marker migration, or globe deletion occurs in Wave 5A.
