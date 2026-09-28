# GEO-1 Wave 5D Dynamic IEP County Identity Audit

Status: identity remediation complete with conditions. No IEP map data path was
changed.

## Inventory

| Record family | Source | Classification | County identity finding |
| --- | --- | --- | --- |
| County profiles | `countyProfiles.js` | STATIC_REFERENCE | 88 exact Census-backed FIPS values |
| Profile priority cases | Nested in county profiles | DERIVED_VIEW_MODEL | 132 records inherit only from a county-owned parent |
| IEP dashboard students | `IEPDashboardPage.jsx` | DEMO_RUNTIME_RECORD | 4 records explicitly unresolved (`countyFips: null`) |
| Risk events | `iepRiskAdapter.js` | DERIVED_VIEW_MODEL | Propagates explicit student FIPS or null |
| Command-center priority cases | `IEPCommandCenter.jsx` | DERIVED_VIEW_MODEL | Propagates explicit risk-event FIPS or null |
| Simulation/detail payload | `CountyInteractionLayer.jsx` | DERIVED_VIEW_MODEL | Carries profile FIPS when available; no county inference |
| Selected-entity context | `SelectedEntityContext.jsx` | CONTEXT_STATE | No county identity source; remains unresolved without explicit data |

No API-backed production IEP county record schema or persisted county-bearing
record was found in the audited repository paths. No production-like record was
assigned a guessed FIPS.

## Identity origins

- `MIGRATED_EXACT_REFERENCE`: 88 static county profiles.
- `EXPLICIT_PARENT_RELATIONSHIP`: 132 county-owned profile priority cases.
- `UNRESOLVED`: 4 standalone demo students, their derived risk events, and
  related derived command cases where no county source exists.
- `SOURCE_SUPPLIED`: 0 observed.
- `DOMAIN_VALIDATED`: 0 observed from an external dynamic source.

## Fallback audit

The canonical IEP page and identity layer contain no `entityToCounty` import or
call. The resolver remains in the repository for unrelated legacy consumers.
The initial `activeCountyState = "Franklin"` is a preserved UI initial view,
not a dynamic record identity assignment; missing dynamic records normalize to
`null` and cannot join geometry.

## Gate result

Every record that currently participates in county-owned derived presentation
has explicit or safely propagated identity. Standalone dynamic/demo records
without a source county remain unresolved and excluded from geographic joins.
Production API/domain onboarding remains conditional because no source-supplied
dynamic `countyFips` contract was discovered.
