# GEO-1 Wave 6C-R Regional Scene Red-Test Contract

## Runtime Status

No regional adapter, client adapter, registration, or runtime source wiring
exists in this phase. The planned factory is:

```text
createMetaverseRegionalSceneAdapter()
```

The planned module is:

```text
src/system/spatial/adapters/metaverseRegionalSceneAdapter.js
```

The red suite must fail because that runtime is missing. It must not weaken or
alter any existing production behavior.

## Planned Cases

The focused suite contains 20 cases covering:

1. factory exists
2. exact `metaverse-regional` domain
3. exact source authority
4. exact `regional-scene` feature type
5. `METAVERSE` family required
6. `metaverse.regional-scene` required
7. REAL_WORLD rejected
8. Quick Map space rejected
9. master-city space rejected
10. exact registry scene ID becomes `sourceRecordId`
11. label cannot become identity
12. route position cannot become identity
13. only eligible registry declarations may project
14. unregistered scene rejected
15. unimplemented route-context scene follows the eligibility rule
16. provenance is required
17. navigation authority is absent
18. Traffic/Water/Transit authority is absent
19. no implicit transform exists
20. Spatial ID uses the existing deterministic helper

## Coordinate Gate

The current registry has no approved scene-local geometry. A future positive
projection fixture may be added only when an owner-approved geometry payload
exists. Until then, `canProject()` must fail closed for records without a
legitimate geometry payload; no test fixture may invent coordinates merely to
turn the contract green.

## Existing Regression Classification

- Expected red: the 20 regional runtime contract cases.
- Contract failure: any existing Spatial, regional, Quick Map, or IEP test
  failure.
- Regression failure: any changed production behavior or registry mismatch.
- Unexpected failure: any failure not caused by the intentionally missing
  regional runtime.
