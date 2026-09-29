# GEO-1 Wave 6 Final Acceptance and Closure

## Objective

Wave 6 closes the first production set of Spatial clients without expanding
Spatial source authority, inventing geometry, migrating deferred clients, or
creating cross-space transforms.

The accepted V1 scope is exactly:

- IEP Ohio County Map
- Metaverse Quick Map
- Metaverse Regional Scene - Oil Rig

All other audited clients and candidates remain outside Wave 6 V1 unless they
enter through a later source, geometry, provenance, publication, and client
contract gate.

## Accepted V1 Scope

| Client | Classification | Authority | Coordinate family / space | Identity model | Spatial integration |
| --- | --- | --- | --- | --- | --- |
| IEP Ohio County Map | `QUALIFIED` | `us-census-bureau-2010-cartographic-boundary` | `REAL_WORLD` / `real-world.county-geojson` | 5-digit Ohio county FIPS | Census adapter, Spatial projection pipeline, IEP county client adapter |
| Metaverse Quick Map | `QUALIFIED` | qualified client contract; legacy marker records not promoted | `METAVERSE` / `metaverse.quick-map` | Spatial client marker contract | Quick Map client adapter and parity contract |
| Metaverse Regional Scene - Oil Rig | `QUALIFIED` | scene: `silicon-heartland-metaverse-regional-scene-registry`; geometry: `silicon-heartland-metaverse-regional-geometry-registry` | `METAVERSE` / `metaverse.regional-scene` | regional scene id `oil-rig` | Metaverse Regional Scene adapter |

## IEP Acceptance

IEP consumes qualified Census county geometry. The source authority is
`us-census-bureau-2010-cartographic-boundary`, the coordinate family is
`REAL_WORLD`, and the coordinate space is `real-world.county-geojson`.

County identity remains the exact 5-digit Ohio FIPS code. County names,
feature order, `entityToCounty`, Franklin defaults, ODOT attributes, and UI
state are not canonical identity.

The Spatial projection path remains the canonical production path for the IEP
county map. The legacy path is retained only as an explicit development
rollback and does not silently replace Spatial on failure.

## Quick Map Acceptance

Quick Map remains in `METAVERSE` / `metaverse.quick-map`. Its Wave 6 acceptance
is limited to the qualified client contract and preservation of the Spatial
client behavior.

The legacy Quick Map marker registry remains unmapped/provisional. Route
strings, marker labels, and normalized x/y positions are not promoted into
source authority, source record identity, provenance, or production geometry
authority by this closure.

## Oil Rig Acceptance

Oil Rig is the first production-qualified Metaverse Regional Scene Spatial
client.

| Field | Accepted value |
| --- | --- |
| sceneId | `oil-rig` |
| domain | `metaverse-regional` |
| featureType | `regional-scene` |
| sourceAuthority | `silicon-heartland-metaverse-regional-scene-registry` |
| geometry authority | `silicon-heartland-metaverse-regional-geometry-registry` |
| coordinate family | `METAVERSE` |
| coordinate space | `metaverse.regional-scene` |
| geometry type | `Polygon` |
| geometry hash | `201e189ef24d2adb` |
| lifecycle | `APPROVED` |
| geometry qualification | `QUALIFIED` |
| Spatial eligibility | `ELIGIBLE` |
| feature ID | `spatial:metaverse-regional:regional-scene:silicon-heartland-metaverse-regional-scene-registry:oil-rig` |
| Wave 6C acceptance commit | `10b1177003b0dab4bb093f43d9f91ecc16d9f8c1` |

Spatial projects the approved registry geometry only. Spatial does not own Oil
Rig scene existence, scene order, navigation, imagery, DAY/DUSK/NIGHT state,
traffic, water mobility, transit, sky bridge, emergency/dispatch, camera
state, publication authority, or source domain truth.

## Qualified With Conditions

ODOT TIMS County operational geography remains `QUALIFIED_WITH_CONDITIONS` as
a future source candidate. It does not become a Wave 6 production client.

Current disposition:

- source identity and FIPS crosswalk are qualified with conditions
- no production adapter exists
- no runtime source registration exists
- no live fetch architecture is accepted
- rights clarification remains incomplete
- governed snapshot requirements remain open
- no named ODOT-specific consuming client is accepted

## Blocked

| Candidate | Reason |
| --- | --- |
| SHS operational maps | Mapbox token dependency, remote county GeoJSON provenance, mixed SHS/Exchange authority, and publication policy remain unresolved. |
| Exchange / Capital maps | Existing routes and Mapbox implementation do not establish source authority, provenance, or a Spatial adapter contract. |
| SHF Impact geography | Current records remain draft/unpublished; public projection requires explicit `publicApproved === true`. |
| SHF Ohio map engine | Disconnected/restoration candidate with hardcoded metrics and no accepted source authority. |
| Transit / Sky Bridge | Registry-only or pending evidence; no confirmed source authority, geometry provenance, or client contract. |
| Emergency / Dispatch | Capability metadata exists, but no confirmed dispatch engine or production emergency authority exists. |

## Deferred

| Candidate | Reason |
| --- | --- |
| Open Sea regional scene | Implemented scene without human-authored, reviewed, approved, registered, qualified geometry; `NOT_ELIGIBLE`. |
| Metaverse master-city mapping | Separate coordinate space and registry surface; no Wave 6 production adapter or transform. |
| Traffic spatial client | Authoring/review/reference data only; no production traffic authority. |
| Water Mobility spatial client | River/water registries are decorative/reference or presentation systems; no production water mobility authority. |
| Disconnected globes / legacy spatial views | `OperationalGlobe`, `RealGlobe`, and `OutcomeGlobe` remain unmounted or disposition candidates, not Spatial adapters. |

## Not Justified

| Candidate | Reason |
| --- | --- |
| CivicSure | Demo/jurisdiction concepts exist, but no canonical Spatial source contract is accepted. |
| Career | References exist, but no Spatial source, geometry, provenance, or publication contract is accepted. |
| Opportunities | Services/references exist, but no accepted Spatial projection contract exists. |
| Events | References exist, but spatial/public boundaries and contract tests remain absent. |
| Workforce | Roadmap/domain references only. |
| Projects | Roadmap/domain references only. |

## Coordinate-Space Isolation

Wave 6 accepts no implicit transform between:

- `real-world.latlng`
- `real-world.county-geojson`
- `metaverse.quick-map`
- `metaverse.master-city`
- `metaverse.regional-scene`
- `metaverse.camera-world`

All audited coordinate spaces remain isolated. Transform availability is
`NONE`, transform authority is `null`, and adapters expose no transform or
calibration helpers.

## Identity and Provenance Protections

- IEP county identity is exact 5-digit Ohio FIPS.
- Quick Map legacy markers do not become source records.
- Oil Rig geometry is sourced only from the approved Regional Geometry
  Registry entry with hash `201e189ef24d2adb`.
- Open Sea and every other regional scene remain ineligible until reviewed,
  approved, registered geometry exists.
- The known `entityToCounty` Franklin fallback remains isolated outside
  canonical IEP and new Spatial paths.

Remaining active non-canonical `entityToCounty` consumers:

- `src/pages/shf-command/SHFImpactCommandCenter.jsx`
- `src/pages/shf-command/sections/AgentSyncStatus.jsx`

## Authority Boundaries

Spatial owns projection coordination, SpatialFeature validation, layer
assignment, presentation-state resolution, selection primitives, and sanitized
client projection.

Spatial does not own scene existence, scene ordering, navigation, imagery,
DAY/DUSK/NIGHT state, traffic, water mobility, transit, sky bridge,
emergency/dispatch, camera state, Quick Map source truth, master-city geometry,
publication authority, or source domain truth.

## Known Conditions

- ODOT remains parked until rights, snapshot governance, and a named
  ODOT-specific client are accepted.
- SHS/Exchange, SHF, traffic, water, transit, emergency, master-city, legacy
  globes, CivicSure, Career, Opportunities, Events, Workforce, and Projects are
  not Wave 6 production clients.
- Open Sea remains deferred and not eligible.
- No Wave 6 client may use a cross-space transform without a later accepted
  coordinate transform authority.

## Future Entry Gates

A future Spatial client or source may enter only with:

- confirmed source authority
- accepted source record identity
- validated geometry source
- coordinate family and coordinate space contract
- provenance and verification contract
- publication and privacy policy
- regression-protected client contract
- no unsafe fallback identity
- no implicit transform
- explicit authority boundaries

## Test Evidence

Final Wave 6 regression evidence is recorded by the closure commit.

Required final checks:

- full Spatial suite
- IEP/Census Spatial tests
- Quick Map tests
- Regional Scene tests
- targeted Wave 6 audit tests
- `npm run build`
- `git diff --check`

## Final Acceptance Decision

`WAVE_6_COMPLETE_WITH_CONDITIONS`
