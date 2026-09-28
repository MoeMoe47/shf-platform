# GEO-1 Wave 5E Legacy Disposition

The following dispositions are based on current imports, runtime gates, and
tests. The Census asset is canonical source data, not a legacy pipeline asset.

| Element | Disposition | Evidence and reason |
| --- | --- | --- |
| `public/assets/maps/ohio-counties.geojson` | `SHARED_AND_STILL_REQUIRED` | Qualified Census source for both the Spatial loader and controlled legacy reference. |
| Direct GeoJSON load in `IEPCommandCenterV2.jsx` | `SHARED_AND_STILL_REQUIRED` | The same source is loaded before the Spatial adapter and is required to feed the governed source boundary. |
| Null-input direct loader in `OhioCountyOfficialMapV2.jsx` | `RETAIN_AS_ROLLBACK` | Explicit `DEV + ?iepLegacyMap=1` rollback path; no production activation. |
| Legacy feature parsing / FIPS and label derivation | `RETAIN_AS_ROLLBACK` | Needed only by the explicit rollback renderer input; removing it would remove the tested rollback. |
| Existing `OhioCountyOfficialMapV2` renderer | `SHARED_AND_STILL_REQUIRED` | It remains the production presentation renderer for Spatial view models and rollback features. |
| `?iepLegacyMap=1` seam | `RETAIN_AS_ROLLBACK` | Explicit DEV-only operational rollback, tested in Chromium. |
| `runIepSpatialDualRun()` and comparison helpers | `RETAIN_AS_DIAGNOSTIC` | Explicit DEV-only parity evidence; no production DOM diagnostics. |
| Cutover and historical parity tests | `RETAIN_AS_TEST_REFERENCE` | Preserve migration evidence and prevent regression during later retirement review. |
| `public/geo/ohio-counties.geojson` | `SHARED_AND_STILL_REQUIRED` | Independent ODOT operational/legacy dependency for other map consumers; not used by the IEP Spatial path. |

No element is classified `RETIRE_NOW`: every remaining legacy preparation
element is either a tested rollback/reference seam or shared with the governed
source boundary. Wave 5E therefore retires the legacy **default**, not the
rollback implementation or canonical source asset.

## Production Gating

In production, `?iepLegacyMap=1` and `?iepSpatialDualRun=1` do not activate
their development seams. Ordinary users cannot change the authority path with
query parameters.

## Failure Policy

Blocked Spatial preparation yields a controlled unavailable state. There is no
silent fallback to the direct legacy path.
