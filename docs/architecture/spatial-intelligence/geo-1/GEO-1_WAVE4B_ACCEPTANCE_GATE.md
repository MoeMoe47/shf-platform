# GEO-1 Wave 4B Quick Map Client Adapter Acceptance Gate

Status: DESIGN COMPLETE, RUNTIME NOT IMPLEMENTED.

## Gate A: Input Boundary

- adapter accepts only sanitized `ClientProjectionResult` values;
- raw domain records, raw SpatialFeature values, and internal results are
  rejected;
- malformed envelopes fail closed;
- no human-readable diagnostic parsing is used.

## Gate B: Coordinate Boundary

- only `METAVERSE` plus `metaverse.quick-map` is accepted;
- master-city, REAL_WORLD, unknown, and malformed coordinates are rejected;
- no transform or calibration is called;
- x/y remain bounded and unchanged.

## Gate C: Marker Boundary

- marker view models use an explicit allowlist;
- only fields required by the existing renderer are exposed;
- safe accessibility fields are retained;
- feature identity is never exposed for hidden records;
- restricted notices contain only the frozen generic notice shape.

## Gate D: Status and Privacy

- PROJECTED, STALE, UNAVAILABLE, RESTRICTED, SUPPRESSED, and INVALID follow
  Wave 3B client rules;
- hidden records do not become markers or selectable entries;
- sourceRecordId, private provenance, evidence, adapter identity, and private
  labels are not surfaced;
- no diagnostic payload leaks through the marker model.

## Gate E: Preservation and Dual Source

- all 15 existing registry entries remain unchanged;
- nine districts remain UNMAPPED;
- six infrastructure entries remain PROVISIONAL and destination-less;
- existing markers and Spatial fixture markers use distinct namespaces;
- labels and coordinates do not cause identity merging;
- existing navigation behavior remains owned by `MetaverseCityPage`.

## Gate F: Authority and Scope

- no production source authority or mapping is created for existing registry
  entries;
- adapter never navigates or executes domain actions;
- Selection Store and Interaction Bus integration remains Wave 4C work;
- browser focus traversal remains Wave 4D work;
- no Mapbox, route engine, backend persistence, coordinate transform, or
  domain adapter integration is introduced.

## Required Evidence Before Runtime Acceptance

- design documents reviewed;
- red tests converted to green by the actual production adapter;
- existing Spatial 116/116, Metaverse 56/56, and Wave 4A 18/18 suites remain
  green;
- build passes;
- production source mapping review confirms no fabricated authority;
- client privacy and coordinate rejection tests pass;
- dual-source preservation tests pass.

## Frozen 30-Case Contract

The complete inventory is maintained in
`GEO-1_WAVE4B_TEST_PLAN.md`. All 30 original requirements are implemented as
red contract tests in
`tests/spatialQuickMapClientAdapterWave4B.test.mjs`. None are moved to Wave 4C
or Wave 4D; those phases own production selection/event wiring and browser
accessibility journeys respectively. The current red result is expected only
because the production adapter is absent.

## Current Decision

Wave 4B design status: `COMPLETE WITH CONDITIONS`.

Runtime readiness: `READY WITH CONDITIONS`.

Conditions are the absence of the production adapter, absence of legitimate
production Quick Map source mappings, and deferred Wave 4C/4D integration.
