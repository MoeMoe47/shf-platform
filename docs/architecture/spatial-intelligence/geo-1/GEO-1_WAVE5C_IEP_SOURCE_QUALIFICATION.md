# GEO-1 Wave 5C IEP Ohio County Source Qualification

## Decision

**QUALIFIED_WITH_CONDITIONS**

Official matching now identifies Candidate A as a 2010 Census cartographic boundary product and Candidate B as an ODOT TIMS County export. No production adapter may be implemented until the source-specific conditions below are encoded and reviewed.

## Geometry Asset

| Field | Finding | Status |
| --- | --- | --- |
| Primary file | `public/assets/maps/ohio-counties.geojson` | CONFIRMED |
| File size | 65,989 bytes | CONFIRMED |
| GeoJSON type | `FeatureCollection` | CONFIRMED |
| Feature count | 88 | CONFIRMED |
| Original source | Not recorded in the file or adjacent metadata | UNKNOWN |
| Original publisher | Not recorded | UNKNOWN |
| Source URL | Not recorded | UNKNOWN |
| Retrieval/import provenance | File is tracked in Git; upstream import process is not recorded | PARTIAL |
| License/use permission | No asset-specific license or attribution evidence found | UNKNOWN / `LICENSE_UNCONFIRMED` |
| Geometry vintage/version | Not recorded | UNKNOWN |
| Modification history | Git history exists, but does not establish upstream lineage | PARTIAL |

The file's reachable history contains commit `f0a4eab` (`Lock Truth Spine V1 and Interaction Feedback Layer V1`), but that commit does not establish the external source or license. Repository-wide GEO-0 records also identify local geometry provenance and licensing as unresolved.

## Duplicate Asset Risk

`public/geo/ohio-counties.geojson` is a second, non-identical copy. The files have different sizes and SHA-1 hashes:

```text
public/assets/maps/ohio-counties.geojson  b62c1317f7c82c3d78711fc16d8e9a219a7ea2a8
public/geo/ohio-counties.geojson          92ea716d030c4ff923139748596e14a212a77799
```

The qualification target is the asset consumed by `OhioCountyOfficialMapV2`. The duplicate must be reconciled before production mapping so that two unverified geometry sources do not become competing authorities.

## Consumers

Confirmed consumers include:

- `src/pages/iep-command-v2/OhioCountyOfficialMapV2.jsx`
- `src/pages/iep-command-v2/OhioCountyNeutralBase.jsx`
- `src/pages/iep-command-v2/IEPCommandCenterV2.jsx`
- `src/pages/shf-command/components/SHFImpactOhioMap.jsx`
- `src/pages/shf-command/SHFOhioMapEngine.jsx`

The IEP route is mounted by `src/router/CapitalRoutes.jsx` at `iep-command-v2`. Consumption proves client use, not source authority.

## County Identity

Observed properties include `GEO_ID`, `STATE`, `COUNTY`, `NAME`, `LSAD`, and `CENSUSAREA`. Each feature has an `id` or `properties.GEO_ID`; the observed stable identifier candidates are unique and complete across all 88 features. `GEO_ID`/feature `id` is the preferred candidate for a future source record identity. County name is not sufficient by itself.

Observed integrity:

- duplicate stable identifiers: 0
- missing stable identifiers: 0
- duplicate county names: 0
- null geometries: 0
- geometry types: `Polygon`, `MultiPolygon`

These are structural observations only. They do not establish that the identifiers are authoritative or licensed for redistribution.

## Coordinate Behavior

The coordinate values are longitude/latitude-like decimal pairs in GeoJSON position order. Existing consumers use D3 geographic/identity projections and do not declare a custom transform in the source asset.

- coordinate family: `REAL_WORLD`
- proposed coordinate space: `real-world.county-geojson`, subject to registry and provenance acceptance
- coordinate order: longitude, latitude
- observed bounds: longitude `-84.820157` to `-80.518693`; latitude `38.404338` to `41.977523`
- transform required by the source: none observed

The Ohio-looking bounds do not authorize a new coordinate space or a transform. A future adapter must use a registered real-world county space and reject mismatches.

## Ownership and Publication

The unknown external publisher is the source-authority candidate. The IEP application is a consumer of the geometry, not automatically its owner. Spatial would be a projection coordinator/client and must not claim geometry authority.

Base county geometry and IEP records attached to counties are separate concerns:

- base geometry may be publicly usable only after source and license qualification;
- attached IEP/domain records retain their own publication, verification, and authorization rules;
- county geometry does not make attached IEP data public.

## Required Evidence Before Requalification

1. Identify and cite the original publisher and source URL.
2. Confirm license, attribution, redistribution, and modification terms.
3. Record retrieval date, source version/vintage, and import/modification history.
4. Reconcile the two repository copies and select one governed asset.
5. Confirm coordinate ownership and the accepted registered coordinate space.
6. Confirm that the proposed identifier is the publisher's stable county identity.

## Provenance Recovery Addendum

The initial table above records the pre-research repository-only state. The official-source findings below supersede its UNKNOWN source fields where explicitly stated.

The two assets were introduced independently:

| Path | First observed commit | Author | Commit message | Rename/copy evidence |
| --- | --- | --- | --- | --- |
| `public/assets/maps/ohio-counties.geojson` | `f0a4eab` (2026-05-14) | MoeMoe47 | `Lock Truth Spine V1 and Interaction Feedback Layer V1` | None found |
| `public/geo/ohio-counties.geojson` | `82d5a181` (2026-04-08) | MoeMoe47 | `backup before SHF guided tour install` | None found |

`git log --follow`, `git log -S'ohio-counties'`, and the all-history filename search found no upstream URL, import script, rename, or content-changing follow-up commit that explains either asset. The same introducing commit as the first asset also added `public/assets/shf-command/maps/shf-impact-ohio-counties.png`, but that co-commit relationship is not source provenance.

The duplicate relationship is **UNKNOWN**, not `DERIVED_COPY` or `LEGACY_COPY`. The files match in count and apparent county coverage but differ in schema, identifiers, resolution, bounds, and all matched geometries. No repository evidence proves that either was generated from the other.

Independent statuses:

- provenance: `PROVENANCE_UNRESOLVED`
- licensing: `LICENSE_UNRESOLVED`
- duplicate relationship: `UNKNOWN`
- qualification decision: `BLOCKED_BY_PROVENANCE`

## Official Source Matching Addendum

External official-source comparison materially improves the qualification:

- Candidate A matches the official 2010 Census county cartographic product `gz_2010_us_050_00_20m.zip` at `1:20,000,000` after GeoJSON/shapefile representation and coordinate precision normalization. All 88 IDs and six local attributes match; all 88 county point sets match after six-decimal normalization.
- Candidate B matches the official ODOT TIMS County layer at `https://tims.dot.state.oh.us/ags/rest/services/Boundaries/County/FeatureServer/0`. All 88 FIPS IDs match, 82/88 compared attributes match exactly, and 85/88 geometries match exactly. The remaining differences are in service-maintained `OBJECTID`, `ODOT_DISTRICT`, `Shape__Area`, `Shape__Length`, or three county geometries.

Candidate A is the recommended base-geometry candidate because its official metadata explicitly states product use with Census acknowledgement and its purpose is small-scale visual mapping. Candidate B remains a legitimate ODOT operational source candidate, but the service metadata exposes copyright/credits rather than a complete reuse license. Neither source should be used for analytic geometry claims without honoring its source-specific limitations.

Updated qualification: `QUALIFIED_WITH_CONDITIONS` for a narrowly scoped Census-based visual county-geometry adapter. ODOT attribute ingestion and any switch to ODOT geometry remain separately conditional.

## Wave 5C Contract Freeze

The first production county geometry adapter is scoped to the matched Census 2010 Cartographic Boundary File represented by `public/assets/maps/ohio-counties.geojson`. The scope is statewide/county overview visualization at the qualified `1:20,000,000` cartographic scale. It is not a parcel, address, survey-grade, precise-boundary-adjudication, or entity-to-county inference source.

Frozen contract values:

| Contract field | Value |
| --- | --- |
| `domain` | `census-geography` |
| `featureType` | `county` |
| `sourceAuthority` | `us-census-bureau-2010-cartographic-boundary` |
| `sourceRecordId` | five-digit Ohio county FIPS, extracted from `GEO_ID` and cross-checked against `STATE` + `COUNTY` |
| `coordinateFamily` | `REAL_WORLD` |
| `coordinateSpaceId` | `real-world.county-geojson` |
| adapter status | contract/red tests only; production adapter not implemented |

`census-geography` is a neutral source-domain name. IEP is the consuming application context, not the Census geometry authority. The existing `createSpatialFeatureId` helper remains the only feature-ID constructor; no alternate ID format is introduced.

Public base geometry does not publish attached IEP records. Private or unpublished IEP data remains subject to its own publication and authorization rules. The adapter must not call `entityToCounty.js`, infer county membership, add ODOT attributes, mutate geometry, or transform coordinates.

Candidate B, `public/geo/ohio-counties.geojson`, remains an unchanged ODOT operational/legacy dependency and is not merged with or promoted to the Census base-geometry authority.
