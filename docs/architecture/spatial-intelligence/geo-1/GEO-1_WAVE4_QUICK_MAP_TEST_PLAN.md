# GEO-1 Wave 4 Quick Map Test Plan

Status: PLANNING ONLY. Tests are specified before client integration.

## Test Principles

- Preservation tests must prove current behavior before adding Spatial wiring.
- Spatial tests must use safe `ClientProjectionResult` values, not internal
  projection results.
- No test may invent a production authority, coordinate transform, domain
  record, or destination permission.
- Existing Metaverse tests remain regression tests and are not weakened.

## Wave 4A Preservation Tests

1. The canonical city Quick Map asset exists at the current path and retains
   its approved content hash.
2. The asset reports natural dimensions of 1448 x 1086.
3. The city coordinate space remains normalized `quick-map`, bounded 0..100.
4. The nine district registry records remain explicitly `UNMAPPED` until
   owner-reviewed calibration.
5. The six infrastructure records remain `PROVISIONAL` and destination-less.
6. City markers are DOM overlays and are not baked into the PNG.
7. City markers and the full-map modal share the same render path.
8. The Quick Map collapsed, compact, and expanded states remain functional.
9. Recenter and Fit World preserve the existing local scale/origin behavior.
10. Existing district marker activation still reaches the protected
    `selectDistrict` path.
11. Existing fast-travel calls still check the service response before scene
    transition.
12. Existing regional Quick Map panels preserve current/previous/next route
    presentation and missing-asset status behavior.
13. Existing responsive layout and touch-target requirements remain intact.
14. Existing reduced-motion input remains accepted by the map surface.

## Spatial Client Tests

15. Only `metaverse.quick-map` results render in the city Quick Map adapter.
16. A `metaverse.master-city` feature is rejected rather than silently
    converted or rendered.
17. A REAL_WORLD feature is rejected rather than rendered in Quick Map space.
18. A client result with `NOT_PUBLISHED` or hidden status never becomes a
    marker or semantic-list item.
19. A restricted result follows its frozen mask mode and does not expose
    source record ID, feature ID, private labels, geometry, evidence, or
    adapter identity.
20. Stable feature IDs survive projection and marker rerendering.
21. Selection remains single-selection and carries the Quick Map coordinate
    space unchanged.
22. Selection changes presentation only and does not mutate a Metaverse domain
    fixture or invoke protected entry by itself.
23. Highlight remains distinct from selection and does not become domain
    state.
24. Unknown, stale, unavailable, and removed features are cleared, hidden, or
    marked unavailable according to the client contract without replacement.
25. Provisional infrastructure records do not become destination actions.
26. No Franklin County fallback or other fabricated geography is introduced.

## Interaction Tests

27. Marker and semantic-list activation publish the same `SELECT` interaction.
28. Explicit clear publishes or applies `DESELECT` without an event loop.
29. Keyboard focus can publish `FOCUS` without changing authorization.
30. `OPEN_RECORD` is emitted only when a real record reference exists.
31. No route/follow/action interaction is emitted from a surface that has no
    corresponding current capability.
32. Correlation IDs and source authority remain intact through the client
    adapter.
33. Subscriber failure does not corrupt selection or existing navigation.

## Accessibility Tests

34. Every visible projected marker has a non-visual accessible label.
35. The semantic list uses the same safe result set as the visual markers.
36. Selection is announced through selected semantics without exposing hidden
    data.
37. Unavailable, stale, restricted, and highlighted states have text
    equivalents where the client contract permits them.
38. Full-map modal focus enters and returns predictably.
39. Keyboard activation and pointer activation have equivalent selection
    behavior.
40. Reduced-motion mode avoids required motion for meaning or navigation.

## Acceptance Evidence

The proposed plan contains 40 tests. Wave 4A should implement tests 1-14
first. Tests 15-40 may be contract fixtures until the client adapter exists;
they must not be marked green by source-text assertions that claim runtime
behavior which has not been implemented.

The existing evidence sources are:

- `tests/metaverseMiniMapV2.test.mjs`
- `tests/metaverseMiniMapV3.test.mjs`
- `tests/metaverseMinimapFinalReconciliation.test.mjs`
- `tests/metaverseCoordinateCalibration.test.mjs`
- `tests/metaverseCanonicalDestination.test.mjs`
- `tests/metaverseDestinationRelationships.test.mjs`
