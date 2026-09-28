# GEO-1 Wave 5C IEP Geometry Provenance Recovery

## Scope

This record traces and compares the two Ohio county GeoJSON assets without modifying either file and without implementing a production adapter.

## Git History

| Path | First introduction | Author | Commit message | Related same-commit evidence |
| --- | --- | --- | --- | --- |
| `public/assets/maps/ohio-counties.geojson` | `f0a4eaba46ec3ef78f0bba7842a2d8ecb948d946` (2026-05-14) | MoeMoe47 | `Lock Truth Spine V1 and Interaction Feedback Layer V1` | `public/assets/shf-command/maps/shf-impact-ohio-counties.png` added in the same commit |
| `public/geo/ohio-counties.geojson` | `82d5a1811fac79503a5f14a43c82df4670b17f65` (2026-04-08) | MoeMoe47 | `backup before SHF guided tour install` | No source metadata or import companion found |

`git log --follow` shows no rename or copy. `git log -S'ohio-counties'` finds the two introductions and later documentation references, but no source URL or import command. `git log -G'Ohio.*count'` adds no upstream dataset evidence. The commits are repository events, not external provenance.

## File Comparison

| Measure | `public/assets/maps/ohio-counties.geojson` | `public/geo/ohio-counties.geojson` |
| --- | ---: | ---: |
| Bytes | 65,989 | 4,443,359 |
| SHA-256 | `40c161c8b142b71e26f049e97c6644c9aaf0cbb1f2326ca2cfe365b3c288484f` | `d562c4a4e424b6bceba03b35750a1846a6ed643c04437b28f631c9f0f485bf43` |
| Top-level keys | `features`, `type` | `features`, `type` |
| Features | 88 | 88 |
| Geometry types | Polygon, MultiPolygon | Polygon, MultiPolygon |
| Property schema | `CENSUSAREA`, `COUNTY`, `GEO_ID`, `LSAD`, `NAME`, `STATE` | `AREA_ID`, `AREA_SQMI`, `COUNTY`, `COUNTY_CD`, `COUNTY_SEAT`, `ELEVATION_MAXIMUM`, `ELEVATION_MINIMUM`, `FIPS_COUNTY_CD`, `LAT_NORTH_DD`, `LAT_SOUTH_DD`, `LONG_EAST_DD`, `LONG_WEST_DD`, `OBJECTID`, `ODOT_DISTRICT`, `POP_1990`, `POP_2000`, `POP_2010`, `POP_2020`, `STATE_PLANE_ZONE`, `Shape__Area`, `Shape__Length` |
| Bounds | `-84.820157..-80.518693`, `38.404338..41.977523` | `-84.82040705104033..-80.51888942741738`, `38.40313782373916..41.977231991468344` |

Normalized property hashes are `65b55c86b3649a0924591cf8d04bb32a2f3cc7393b87d3f5a7c6c7041895acd6` and `4fcf78dda5a88939371884c062c45a3687a98a52a41655d24087823abb02fb60`. Normalized geometry-set hashes are `d56e97c1a60bcfc9a4dc365a3e8bd6ad08bec438d158be2cbd5552ad4e757fba` and `52b65772a7c6438fe273f540b3140f97f24d911e889686c7413d51c31d45f624`.

## Identity and Geometry Findings

The first file has feature IDs such as `39055` and `GEO_ID` values such as `0500000US39055`. The second has sequential feature IDs `89` through `176` and `FIPS_COUNTY_CD` values such as `39145`. The two files reconcile to the same 88 county candidates through the first file's numeric ID and the second file's `FIPS_COUNTY_CD`.

There are no IDs only in one file after that crosswalk, no duplicate crosswalk IDs, and no missing crosswalk IDs. However:

- property schemas are materially different;
- all 88 matched geometries differ byte-for-byte;
- all 88 remain different after six-decimal coordinate rounding;
- all 88 have different coordinate counts and/or bounds in the comparison;
- the second asset is substantially more detailed (for example, Geauga has 13 coordinate positions in the first versus 1,154 in the second).

The evidence supports **UNKNOWN relationship**, with different-resolution or different-source content plausible. It does not prove `DERIVED_COPY`, reprojection, simplification lineage, or manual editing.

## Current Consumers

| Asset | Consumers | Relevant assumptions |
| --- | --- | --- |
| `/assets/maps/ohio-counties.geojson` | `OhioCountyOfficialMapV2`, `OhioCountyNeutralBase`, `SHFRegionalCountyCluster` fallback | D3 GeoJSON geometry; `NAME`/`name`/`county`/`COUNTY` label fallbacks; feature-derived paths/centroids |
| `/geo/ohio-counties.geojson` | `src/pages/shf-command/SHFOhioMap.jsx`, `src/components/maps/OhioBaseMap.jsx` | Consumers may rely on the second file's county/operational properties and detailed geometry |

The IEP regression suite directly reads the first asset. Swapping either path would be a behavior change and was not attempted.

## Dataset Fingerprints

The first schema resembles a Census-style county export because of `GEO_ID`, `STATE`, `COUNTY`, `NAME`, `LSAD`, and `CENSUSAREA`. The second schema contains fields that may be associated with an Ohio transportation/operations dataset, including `ODOT_DISTRICT`, `COUNTY_CD`, `COUNTY_SEAT`, population vintages, and shape metrics. These are fingerprints only. They do not establish Census, ODOT, Ohio GIS, ArcGIS, or any other publisher origin.

## Source and License Search

No repository README, comment, script, package reference, archived note, attribution record, source URL, license, or import command was found that identifies either asset's upstream publisher or terms. GEO-0 records explicitly preserve the unresolved status of source, license, freshness, and authoritative lineage.

## Reconciliation Matrix

| Path | First-seen commit | Last-known introduced path | Feature count | Geometry detail | Suspected origin | License evidence | Current consumers | Canonical candidate? |
| --- | --- | --- | ---: | --- | --- | --- | --- | --- |
| `public/assets/maps/ohio-counties.geojson` | `f0a4eab` | unchanged | 88 | simplified relative to other copy | Census-like fingerprint, unproven | none | IEP and SHF regional consumers | UNKNOWN |
| `public/geo/ohio-counties.geojson` | `82d5a181` | unchanged | 88 | materially more detailed | Ohio operational/ODOT-like fingerprint, unproven | none | SHF/Ohio base-map consumers | UNKNOWN |

## Status

- provenance: `PROVENANCE_UNRESOLVED`
- license: `LICENSE_UNRESOLVED`
- duplicate relationship: `UNKNOWN`
- source authority: UNKNOWN
- coordinate ownership: UNKNOWN
- qualification: `BLOCKED_BY_PROVENANCE`

## Outside Evidence Required

1. Original publisher and exact dataset/source URL for each candidate.
2. License or public-domain/redistribution terms, including attribution and modification requirements.
3. Dataset version/date and retrieval/import record.
4. Publisher documentation for the accepted county identifier.
5. Confirmation of coordinate ownership and permitted production use.
6. A decision on which asset is governed, or an external explanation for maintaining both.

No download, replacement, deletion, rename, or production mapping was performed.

## Official Source Matching Addendum

### Candidate A — Census

Candidate A matches the official Census product `gz_2010_us_050_00_20m.zip`, the 2010 national county cartographic boundary file at `1:20,000,000`:

- all 88 Ohio county IDs matched by `GEO_ID`/FIPS;
- all six local attributes matched after numeric normalization;
- all 88 geometry point sets matched after six-decimal normalization;
- local geometry contains 1,865 coordinate positions, equal to the official 20m Ohio subset;
- 500k and 5m products did not match the local geometry point sets;
- official metadata identifies the publisher as the U.S. Department of Commerce, U.S. Census Bureau, Geography Division / Cartographic Products Branch;
- official metadata dates the product to 2010 and describes it as generalized small-scale mapping data.

Official product URL:

`https://www2.census.gov/geo/tiger/GENZ2010/gz_2010_us_050_00_20m.zip`

Official Census metadata states that the products are free to use in a product or publication with acknowledgement to the U.S. Census Bureau, and limits the boundary information to appropriate small-scale visual display rather than geographic analysis, geocoding, or precise area relationships. The local file has no CRS metadata, while the downloaded shapefile declares NAD83 geographic coordinates; the match therefore remains documented as format/representation conversion, not a production transform.

Classification: **OFFICIAL_MATCH_WITH_FORMAT_CONVERSION**.

### Candidate B — ODOT TIMS

Candidate B was compared with the official ODOT TIMS County layer:

`https://tims.dot.state.oh.us/ags/rest/services/Boundaries/County/FeatureServer/0`

Official metadata identifies:

- service item ID: `5a65fb89de864e0b97bbcb346dd761f3`;
- layer name: `County`;
- description: boundaries of Ohio's 88 counties;
- publisher/copyright: `ODOT Office of Technical Services`;
- polygon geometry;
- default spatial reference EPSG:3857 / WKID 102100;
- GeoJSON query support;
- annual update frequency at the service level;
- the same field family as the local file, including `FIPS_COUNTY_CD`.

The comparison used the service's WGS84 GeoJSON query export in `/tmp` and did not alter the repository. Results:

- 88/88 FIPS IDs matched;
- 82/88 compared attributes matched exactly;
- 85/88 geometries matched exactly;
- Franklin, Union, and Madison were the three geometry exceptions;
- service-managed differences include `OBJECTID`, three `ODOT_DISTRICT` values, and shape metrics.

Classification: **OFFICIAL_MATCH_WITH_FORMAT_CONVERSION**, with service-version drift conditions. ODOT's copyright/credits text is recorded, but no complete reuse license was established; it is not treated as a license.

### Candidate Disposition

| Local asset | Disposition | Reason |
| --- | --- | --- |
| `public/assets/maps/ohio-counties.geojson` | `CANONICAL_SOURCE_CANDIDATE` | Exact matched Census 2010 20m product for constrained visual base geometry |
| `public/geo/ohio-counties.geojson` | `LEGACY_DEPENDENCY` | Strong ODOT TIMS match used by existing operational consumers; not imported into the base Spatial contract |

This disposition does not delete, replace, rename, or migrate either asset.

## Updated Qualification

- Candidate A provenance: `PROVENANCE_CONFIRMED` for the matched 2010 Census product, subject to recording the source URL and attribution in any implementation.
- Candidate A license/use: `LICENSE_CONFIRMED_WITH_CONDITIONS` based on official product metadata; small-scale visual use and Census acknowledgement are required.
- Candidate B provenance: `PROVENANCE_CONFIRMED` as an ODOT TIMS export match, with service-version drift documented.
- Candidate B license/use: `LICENSE_PARTIAL`; official copyright/credits are known, but complete reuse terms remain unresolved.
- Overall adapter qualification: `QUALIFIED_WITH_CONDITIONS` for the narrow Census base-geometry path only.
