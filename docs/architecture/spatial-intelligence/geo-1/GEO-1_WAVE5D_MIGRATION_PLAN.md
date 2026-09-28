# GEO-1 Wave 5D IEP Migration Plan

Wave 5D is staged onboarding planning. The current IEP map and asset path stay
unchanged.

## 5D-A — Discovery and parity contract

Freeze the current route, geometry consumer, profile/data path, interactions,
accessibility baseline, privacy behavior, and performance measurements. Define
explicit `countyFips` on the IEP domain side or formally record why onboarding
cannot proceed.

## 5D-B — IEP Spatial client adapter

Implemented as infrastructure only. The adapter converts safe Census
projection results into an IEP county view model and remains independent of
React, D3, Mapbox, `entityToCounty`, and domain publication logic.

## 5D-C — Development-only dual run

Implemented as a gated comparison seam used by tests. It compares the legacy
asset path with real pipeline/client output by feature count, FIPS set,
geometry, labels, and safe domain joins. It is not connected to the default
route and does not migrate legacy records.

## 5D-D — Browser parity certification

Use Chromium with controlled fixtures to verify rendered parity, selection,
hover, keyboard/focus, privacy, error handling, and route stability. Include
the negative case where missing county identity produces no fabricated join.

## 5D-E — Production switch decision

Completed for the controlled Wave 5D cutover. The Spatial path now supplies
the county view models behind the existing renderer. The legacy path remains
available only through the explicit development `iepLegacyMap=1` rollback seam;
Spatial failure is surfaced as a controlled unavailable state rather than an
invisible fallback. Retirement of the legacy path remains a Wave 5E decision.

Wave 5E decision: the Spatial path is accepted as the default. The legacy
direct preparation path remains only as an explicit DEV rollback, and the
dual-run remains an explicit DEV diagnostic. The canonical Census source and
existing renderer remain in service; no silent fallback or legacy asset removal
was performed.

## Failure and rollback

The Spatial path fails closed. During the migration window, a documented
legacy fallback may keep the existing map available, but it must not substitute
Franklin County or manufacture a record association. Any fallback must be
observable in tests and telemetry appropriate to the application.

## Performance target

The qualified asset is approximately 65 KB with 88 features. Before switching,
measure legacy versus Spatial parse/projection/client conversion time and first
render. Require equal feature/FIPS/geometry parity and no material regression
in route readiness or interaction latency. Optimize only after measurement.
