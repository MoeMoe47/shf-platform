# GEO-1 Wave 5B Regression Harness Implementation Report

## Scope

Wave 5B added read-only regression and forensic tests plus preservation documentation. No production source files, adapters, mappings, routes, coordinate systems, or domain behavior were changed.

## Test Suites

- `tests/spatialMapEstateRoutesWave5B.test.mjs`
- `tests/spatialExchangeMapRegressionWave5B.test.mjs`
- `tests/spatialShfImpactRegressionWave5B.test.mjs`
- `tests/spatialIepCountyMapRegressionWave5B.test.mjs`
- `tests/spatialDisconnectedGlobesWave5B.test.mjs`
- `tests/spatialMapEstateIntegrityWave5B.test.mjs`

The suites cover route/component inventory, Mapbox configuration and fallback, remote county data, SHF publication gating, local IEP geometry, disconnected exports/dependencies, Quick Map uncertainty, coordinate isolation, source identity absence, and the known Franklin fallback.

## Classification

The Franklin fallback is recorded as `KNOWN_EXISTING_DEFECT`. Remote Mapbox/GeoJSON and disconnected importer questions remain dependencies or provenance gaps. No regression or unexpected failure is accepted.

## Verification Results

- Wave 5B suites: `37/37 PASS`.
- Combined `tests/spatial*.test.mjs` run, including prior Spatial/Wave 4/fixture suites and Wave 5B: `227/227 PASS`.
- Frozen prior unit baseline remains `243/243 PASS` when the legacy Quick Map suites are included.
- Existing Chromium parity/accessibility certification: `4/4 PASS` using the verified Vite test port.
- Build: PASS.
- `git diff --check`: PASS.
- Regression failures: `0`.
- Unexpected failures: `0`.

## Known Limitations

- These tests do not provide a real Mapbox token or external network authority.
- Browser certification continues to rely on the existing Wave 4 Chromium suites.
- Route declaration tests do not claim every route is browser-rendered.
- No source mapping is inferred from a legacy ID, label, coordinate, or destination route.

## Next Gate

Wave 5C must choose a first legitimate source mapping only after this preservation baseline is reviewed and the source-authority checklist is satisfied.
