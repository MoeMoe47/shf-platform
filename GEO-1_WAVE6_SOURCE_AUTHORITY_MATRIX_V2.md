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
| ODOT county operations | ODOT operational domain | ODOT TIMS County layer | ODOT terms/policy | ODOT service metadata | ODOT service snapshot | Future operational renderer | Not implemented | Qualified with conditions | Reuse terms and versioned snapshot |
| Metaverse regional scenes | Presentation registry | Scene assets/registry | Metaverse presentation policy | Unknown | METAVERSE regional spaces | RegionalScenePage | None | Partial | No canonical geographic source records |
| OperationalGlobe | Unknown | Local/remote geographic layers | Unknown | Unknown | REAL_WORLD lat/lng candidate | globe.gl | None | Reference only | Unmounted and ungoverned |
| RealGlobe | Unknown | Remote Plotly county data | Unknown | Unknown | REAL_WORLD lat/lng candidate | globe.gl | None | Deprecate candidate | Direct remote demo dependency |
| OutcomeGlobe | Exchange presentation candidate | Hardcoded arcs | Unknown | Unknown | REAL_WORLD lat/lng presentation | react-globe.gl | None | Reference only | No source records or route |
| SHFOhioMapEngine | SHF candidate | `OhioCountyNeutralBase` | SHF policy | Unknown | Consumer-local | React/D3 base map | None | Deprecate candidate | Duplicate/hardcoded metrics |

## Canonical Existing Authorities

The accepted Census county source remains `census-geography::county` with
five-digit Ohio FIPS and `real-world.county-geojson`. ODOT must never be
registered under that collision key; a future ODOT adapter would require its
own source authority and explicit operational layer contract.
