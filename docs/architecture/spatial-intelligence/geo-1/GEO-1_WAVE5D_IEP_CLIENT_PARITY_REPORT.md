# GEO-1 Wave 5D IEP Client Parity Report

## Parity Surface

The new client preserves 88 qualified county features, their Census FIPS
identities, labels, Polygon/MultiPolygon types, and exact geometry content.
Static county profiles join by explicit FIPS. Dynamic records with null
identity remain geographically unresolved.

## Performance Sample

One Node measurement over the 88-feature qualified asset recorded:

| Path | Time |
| --- | ---: |
| Legacy asset JSON parse | 1.150 ms |
| Spatial projection pipeline | 11.837 ms |
| IEP client conversion | 3.036 ms |
| Spatial preparation total | 14.873 ms |

This is a development measurement, not a browser performance certification.
The current threshold is parity plus no demonstrated material regression; more
representative browser measurement remains part of browser parity work.

## Preservation

`OhioCountyOfficialMapV2.jsx` remains unchanged. Its route, fetch, D3
projection, rendering, selection, and detail behavior remain the default path.
The ODOT asset is unchanged and no production map switch occurred.
