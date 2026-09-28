# GEO-1 Wave 6A Additional Client Audit

## Scope

Wave 6A revalidates the remaining map estate after the accepted Quick Map and
IEP Spatial clients. It creates no adapter, source mapping, transform,
publication approval, or client migration.

The estate contains 12 confirmed map/client or disconnected implementation
records: 8 active or mounted candidates and 4 disconnected, frozen, test-only,
or unmounted candidates.

## Candidate Findings

| Candidate | Current evidence | Authority/provenance | Readiness | Blocking conditions |
| --- | --- | --- | --- | --- |
| Exchange / Capital Unified Truth | `capital.html#/exchange/unified-truth`, `SHSOperationalMapboxMap.jsx`; Mapbox county layers, operational points, and evidence UI | Mapbox is a renderer/tile platform; remote county source is Plotly GitHub data; domain marker authority is mixed/hardcoded | `BLOCKED` | Remote source provenance/license, domain record identity, token and external-service dependency, publication boundary |
| SHF public impact | Foundation impact route and `SHFImpactOhioMap.jsx`; Census-like county base plus SHF records | SHF owns impact records; base geometry is separate; current records are all `publicApproved:false` | `BLOCKED` | No eligible public records; publication/verification authority remains unresolved |
| ODOT operational geography | Local detailed county asset matches ODOT TIMS; FIPS and operational attributes available | ODOT Office of Technical Services is the source authority candidate; service-version drift is documented | `QUALIFIED_WITH_CONDITIONS` | Complete reuse/license terms, governed snapshot/version, and minimal operational use case |
| Metaverse regional scenes | 15-stop scene registry, scene assets, route context, quick-map images | Presentation registry owns scene sequencing; no confirmed geographic source authority | `PARTIAL` | Scene coordinate/source contract and authority are presentation-oriented, not production geographic records |
| OperationalGlobe | Component exists; unmounted; local US GeoJSON plus external globe imagery | No confirmed owner or route | `REFERENCE_ONLY` | No mounted client, source contract, or publication boundary |
| RealGlobe | Component exists; unmounted; direct remote Plotly county fetch | Demo-like direct dependency; no confirmed authority | `DEPRECATE_CANDIDATE` | Unmounted duplicate behavior, remote provenance, and no governed source boundary |
| OutcomeGlobe | Component exists; hardcoded arcs and external globe imagery; no confirmed route | Presentation-only; no domain/source authority | `REFERENCE_ONLY` | Hardcoded geography and disconnected route |
| SHFOhioMapEngine | Component exists; uses `OhioCountyNeutralBase` and hardcoded metrics | SHF candidate; metrics are not a qualified source | `DEPRECATE_CANDIDATE` | Duplicate presentation, hardcoded domain values, no confirmed route or source authority |

Other registry domains remain discovery candidates rather than implementation
targets: CivicSure, Career, Opportunities, Events, Traffic, Water Mobility,
Transit/Sky Bridge, Emergency/Dispatch, Workforce, and Projects.

## Authority Rules

Mapbox is a rendering/tile platform, not automatically a domain authority.
ODOT and Census remain separate authorities even when their county geometries
describe the same physical places. SHF impact authority and publication
authority remain independent from base geometry. Metaverse regional coordinates
remain separate from REAL_WORLD county coordinates.

## Selection Outcome

ODOT operational county geography is the strongest next qualification
candidate. It adds a distinct high-resolution operational geography capability
while preserving the existing Census base authority and avoiding an immediate
domain migration.
