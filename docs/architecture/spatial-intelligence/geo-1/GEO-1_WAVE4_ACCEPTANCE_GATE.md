# GEO-1 Wave 4 Quick Map Acceptance Gate

Status: DESIGN ONLY. Wave 4 integration has not begun.

## Gate 4A: Forensic and Preservation Baseline

Required:

- city and regional Quick Map files, assets, registries, tests, and owners are
  inventoried;
- city asset dimensions and coordinate-space metadata are verified;
- master-city and Quick Map spaces remain separate;
- existing marker, modal, scaling, navigation, route-overview, responsive,
  and accessibility behavior has preservation coverage;
- no Quick Map source behavior was changed during planning.

Exit evidence: `GEO-1_WAVE4_QUICK_MAP_PRESERVATION_BASELINE.md` and the Wave
4A tests are reviewed and green.

## Gate 4B: Client Adapter and First Legitimate Projection Adapter

Required:

- the adapter registry uses explicit source authority, feature type,
  `metaverse.quick-map` coordinate space, provenance, and projection version;
- the client adapter accepts only safe `ClientProjectionResult` values;
- no production adapter claims the nine unmapped districts or six provisional
  infrastructure points without owner-reviewed evidence;
- hidden, restricted, unpublished, wrong-space, stale, and unavailable values
  are handled by the frozen Wave 3B client boundary;
- no source record, feature ID, geometry, label, evidence, or authority is
  fabricated.

Exit evidence: adapter contract tests, projection tests, and a source-backed
fixture with explicit provenance.

## Gate 4C: Selection and Interaction Integration

Required:

- marker and semantic-list activation use the existing single-selection
  lifecycle;
- selection preserves source authority and `metaverse.quick-map` identity;
- `SELECT`, `DESELECT`, `FOCUS`, `HIGHLIGHT`, and `OPEN_RECORD` are emitted
  only where current behavior requires them;
- selection does not grant permissions or execute domain actions;
- existing `selectDistrict`/fast-travel authorization remains authoritative;
- no circular selection/interaction loop is introduced.

Exit evidence: interaction tests, unchanged protected-entry tests, and domain
fixture immutability checks.

## Gate 4D: Accessibility and Non-map Equivalent

Required:

- a semantic destination/activity list consumes the same safe client results as
  visual markers;
- keyboard and pointer activation have equivalent selection behavior;
- focus enters and returns predictably for the full-map surface;
- selected, highlighted, stale, unavailable, and restricted semantics are
  available without exposing private data;
- reduced-motion behavior is preserved and tested.

Exit evidence: keyboard/accessibility tests and a non-map projection review.

## Gate 4E: Parity and Acceptance

Required:

- all preservation, Spatial, interaction, privacy, coordinate, and
  accessibility tests pass;
- city Quick Map behavior remains intact;
- regional Quick Map behavior remains intact if it was touched;
- no map source authority or publication authority moved into Spatial;
- no domain records changed;
- no route/path engine, transform, backend persistence, or Mapbox change was
  introduced;
- no Franklin County fallback or other fabricated geography exists in the
  client adapter;
- documentation identifies remaining unknowns and evidence gaps.

## Explicit Non-acceptance Conditions

Wave 4 is not accepted if any implementation:

- maps unknown entities to a real county or other geography;
- treats master-city coordinates as Quick Map coordinates;
- uses static art labels as canonical domain records;
- exposes hidden records through known IDs or URL state;
- lets selection execute protected entry or a domain mutation;
- replaces the existing map before parity evidence exists;
- invents a destination for a provisional infrastructure marker;
- classifies regional emergency capability metadata as a confirmed emergency
  authority.

## Required Review Artifacts

- `GEO-1_WAVE4_QUICK_MAP_INTEGRATION_PLAN.md`
- `GEO-1_WAVE4_QUICK_MAP_TEST_PLAN.md`
- `GEO-1_WAVE4_QUICK_MAP_PRESERVATION_BASELINE.md`
- this acceptance gate
- preservation and integration test results
- source-authority and coordinate evidence for every production adapter

## Readiness Decision

Current status: `READY WITH CONDITIONS`.

Conditions:

1. complete Wave 4A preservation tests;
2. obtain explicit source authority and owner-reviewed coordinates before any
   production projection adapter;
3. keep the first implementation city-only and leave regional Quick Map
   integration deferred;
4. preserve existing protected-entry and fast-travel ownership;
5. review the safe client projection and accessibility behavior before map
   wiring.
