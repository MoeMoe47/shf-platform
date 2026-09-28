# GEO-1 Wave 5 Adapter Readiness Matrix

Statuses are based on current repository evidence, not the earlier roadmap labels alone.

| Domain / system | Status | Evidence and blocker |
| --- | --- | --- |
| Metaverse | READY WITH CONDITIONS | Rich registries and Quick Map client exist; source authority for legacy markers remains unresolved. |
| Missions | READY WITH CONDITIONS | Metaverse mission surfaces exist, but no accepted spatial adapter contract has been connected. |
| SHF | PARTIAL | Impact filters and county map exist, but records are sample/draft and publication is not approved. |
| SHS | PARTIAL | Operational Mapbox surface exists; token, remote data, and authority boundary require acceptance. |
| Exchange / Capital | PARTIAL | Unified Truth route and Mapbox component exist; source/projection and token policy remain unresolved. |
| CivicSure | PARTIAL | Domain material exists, but no confirmed geometry/source adapter evidence was found in this pass. |
| Career | PARTIAL | Destination/content concepts exist; canonical spatial records are not established. |
| Opportunities | PARTIAL | Domain surfaces exist; no confirmed coordinate ownership or publication adapter. |
| Events | PARTIAL | Event capabilities exist; temporal/source authority mapping remains incomplete. |
| Traffic | PARTIAL | Metaverse traffic registries exist; they are not confirmed geographic authority or route engine integration. |
| Water Mobility | PARTIAL | Regional registry labels authority as pending and configured routes are empty. |
| Transit / Sky Bridge | BLOCKED | Capability/visual evidence exists, but no confirmed production transit authority. |
| Emergency / Dispatch | BLOCKED | Emergency terminology/capabilities exist, but no confirmed production authority. |
| Workforce | NOT JUSTIFIED | No evidence sufficient for a spatial adapter in this pass. |
| Projects | NOT JUSTIFIED | No evidence sufficient for a spatial adapter in this pass. |

## Wave 5D IEP Addendum

The Census county geometry adapter is production-ready infrastructure, but the
IEP client is `BLOCKED_BY_DOMAIN_IDENTITY`. The audit found a label-keyed
profile path and an `entityToCounty.js` dependency; no explicit validated
`countyFips` join was established for dynamic IEP records. This does not
change the neutral `census-geography` adapter readiness or authorize IEP map
migration.

Wave 5D-ID has now hardened all 88 static county profiles with additive
validated `countyFips` values and removed the resolver import from the active
IEP page. Dynamic IEP record identity remains a gate, and the resolver remains
available to unrelated legacy consumers.

Wave 5D-DYN now makes repository-controlled dynamic/demo records explicit:
county-owned derived views propagate validated parent FIPS, while standalone
records without a source relationship remain null and excluded from geography.
Production/API onboarding remains `READY WITH CONDITIONS` until the source
schema supplies authoritative `countyFips: string | null`.

Wave 5D-API freezes that future contract without inventing an API or database
model. Current client readiness is `READY WITH CONDITIONS`; future production
data readiness is `FUTURE_IMPLEMENTATION_REQUIRED` because no IEP county-bearing
backend authority exists in the repository.

## Readiness Rule

`READY WITH CONDITIONS` means an adapter can be planned around a confirmed domain boundary but cannot be registered until source identity, coordinates, publication, and regression evidence are accepted. `PARTIAL` and `BLOCKED` are not migration permission.
