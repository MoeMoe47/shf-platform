# GEO-1 Wave 5D IEP Dual-Run Certification

## Comparison

The development/test comparison uses:

```text
legacy ohio-counties.geojson feature collection
vs
Projection Pipeline -> ClientProjectionResult[] -> IepCountyClientAdapter
```

Results are compared by explicit five-digit FIPS, then by labels and exact
geometry serialization. The implementation does not deduplicate by label or
array order.

## Gate

Activation requires `import.meta.env.DEV` as represented by the explicit
development argument and the query flag `iepSpatialDualRun=1`. The disabled
path returns no comparison and no county models. The default IEP route does
not import or activate the seam.

## Certified Development Results

- Legacy features: 88
- Spatial county models: 88
- FIPS parity: exact
- Label parity: exact
- Geometry parity: exact
- Missing counties: 0
- Extra counties: 0
- Static profile joins: 88/88
- Unresolved dynamic records: excluded from geographic joins
- Unsafe Franklin assignments: 0

## Conditions

This is data-path certification, not browser certification. The existing
Chromium baseline remains a separate `0/4 PASS` condition. Production/default
IEP rendering was not switched.
