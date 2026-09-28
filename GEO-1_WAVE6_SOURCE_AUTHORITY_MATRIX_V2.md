# GEO-1 Wave 6 Source Authority Matrix V2

This matrix keeps authority dimensions separate. A renderer, coordinate owner,
or client consumer is not thereby the source or publication authority.

| Client / layer | Domain authority | Geometry authority | Publication authority | Verification authority | Coordinate owner | Renderer | Spatial adapter/client | Readiness | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Metaverse Quick Map | Record owners unresolved | Metaverse presentation registry candidate | Record owner/unknown | Unknown | Metaverse registry | MetaverseMiniMap | Quick Map adapter/client | Accepted with legacy-marker conditions | Source mappings absent for legacy entries |
| IEP county base | IEP owns attached records | U.S. Census Bureau 2010 cartographic boundary | Geometry public rule; IEP records separate | Census/source contract for geometry | `real-world.county-geojson` | OhioCountyOfficialMapV2 | Census adapter + IEP client | Accepted with DEV rollback | Future API producers must supply `countyFips` |
| Exchange county base | Exchange/SHS layer owner unresolved | Remote county dataset candidate | Exchange policy | Unknown | Mapbox/GeoJSON consumer boundary | SHSOperationalMapboxMap | None | Blocked | Remote provenance/license and identity |
| Exchange operational markers | Exchange/SHS domain candidate | Marker-local/hardcoded or API-dependent | Role-dependent | Unknown | Mapbox geographic view | Mapbox markers/layers | None | Blocked | No confirmed source record authority |
| SHF public impact | SHF impact data | Separate qualified base geometry candidate | SHF approval | SHF verification | County geometry consumer | SHFImpactOhioMap | None | Blocked | All current records `publicApproved:false` |
| ODOT county operations | ODOT operational domain | ODOT TIMS County layer | ODOT terms/policy | ODOT service metadata | Approved ODOT snapshot | Future operational renderer | Not implemented | Qualified with conditions | Written rights clarification, active approved snapshot, and first consumer |
| Metaverse regional scenes | Regional scene presentation registry; authority contract pending | Approved regional scene assets/registry | Metaverse presentation policy | Registry validation and Metaverse runtime; Spatial does not verify domain truth | `metaverse.regional-scene` | RegionalScenePage | Future `metaverse-regional` / `regional-scene` contract only | Qualified with conditions | Registry is presentation-oriented; 2 implemented scenes of 15 route stops; no runtime feature contract |
| OperationalGlobe | Unknown | Local/remote geographic layers | Unknown | Unknown | REAL_WORLD lat/lng candidate | globe.gl | None | Reference only | Unmounted and ungoverned |
| RealGlobe | Unknown | Remote Plotly county data | Unknown | Unknown | REAL_WORLD lat/lng candidate | globe.gl | None | Deprecate candidate | Direct remote demo dependency |
| OutcomeGlobe | Exchange presentation candidate | Hardcoded arcs | Unknown | Unknown | REAL_WORLD lat/lng presentation | react-globe.gl | None | Reference only | No source records or route |
| SHFOhioMapEngine | SHF candidate | `OhioCountyNeutralBase` | SHF policy | Unknown | Consumer-local | React/D3 base map | None | Deprecate candidate | Duplicate/hardcoded metrics |

## Canonical Existing Authorities

The accepted Census county source remains `census-geography::county` with
five-digit Ohio FIPS and `real-world.county-geojson`. ODOT must never be
registered under that collision key; a future ODOT adapter would require its
own source authority and explicit operational layer contract.

## Wave 6B ODOT Evidence

The current ODOT FeatureServer layer is the `County` layer, item
`5a65fb89de864e0b97bbcb346dd761f3`, credited to `ODOT Office of Technical
Services`, and describes annual updates for 88 Ohio counties. The service
metadata establishes public-information access and a use disclaimer, but does
not provide a complete redistribution/modification license. The local asset
crosswalk is 88/88 FIPS, 82/88 non-service-managed attribute matches, and
85/88 exact geometry matches against a WGS84 GeoJSON query export. This is
conditional source evidence, not adapter authorization.
