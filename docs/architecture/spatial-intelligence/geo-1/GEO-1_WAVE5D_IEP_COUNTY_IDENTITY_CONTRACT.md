# GEO-1 Wave 5D IEP County Identity Contract

## Canonical field

IEP/domain records use:

```text
countyFips: string
```

The value must be exactly five numeric characters, have Ohio state prefix
`39`, and belong to the qualified 88-county Census identity set. County names
remain display metadata only.

The domain stores `countyFips`, not a generated Spatial feature ID.

## Authority and validation

`src/shared/spatial/countyIdentity.js` is the neutral validation layer. It
contains the qualified identity manifest derived from
`public/assets/maps/ohio-counties.geojson` and provides:

- `isQualifiedOhioCountyFips(value)`
- `validateQualifiedOhioCountyFips(value)`
- `resolveExactQualifiedCountyNameToFips(value)` for one-time static-data hardening
- `joinIepRecordToCounty(record, countyFeature)` for explicit FIPS joins

The helper does not infer from addresses, entities, organizations, labels, or
text. It does not mutate records and does not call `entityToCounty`.

## Join rule

```text
record.countyFips === countyFeature.sourceRecordId
```

Both values must be validated qualified Ohio FIPS strings. Missing, unknown,
or mismatched identity remains unresolved.

## Publication independence

Adding a valid county FIPS changes identity only. It does not change privacy,
authorization, public approval, publication state, workflow state, or domain
authority.

## Compatibility

`countyProfiles.js` retains its existing normalized name keys and display
labels. Each qualified static profile now receives an additive `countyFips`.
The `__default` profile remains unresolved with `countyFips: null`.
