# GEO-1 Wave 5D IEP Spatial Client Onboarding Audit

Status: client infrastructure implemented; default IEP rendering remains unchanged.

## Current route and data flow

The active route is `capital.html#/iep-command-v2`, declared by
`src/router/CapitalRoutes.jsx` as `iep-command-v2` and rendered by
`src/pages/iep-command-v2/IEPCommandCenterV2.jsx`.

Current flow:

```text
capital.html#/iep-command-v2
  -> CapitalRoutes
  -> IEPCommandCenterV2
  -> OhioCountyOfficialMapV2
  -> fetch('/assets/maps/ohio-counties.geojson')
  -> d3-geo geoMercator/geoPath/geoCentroid
  -> county-name keyed centroids and SVG paths
  -> local React activeCountyState
  -> getCountyProfile(activeCountyState)
  -> CountyInteractionLayer / county detail request
```

`OhioCountyOfficialMapV2` currently derives a display county name from
`properties.NAME`, `name`, `county`, or `COUNTY`, strips a trailing
`County`, and uses that label as the path key, `data-county` value, and
interaction argument. The map does not currently consume Spatial features.

`OhioCountyNeutralBase.jsx` is a second, similar consumer of the same asset.
It remains an alternate/legacy geometry consumer and is not selected as the
Wave 5D onboarding seam.

## Current responsibilities

| Responsibility | Current owner | Finding |
| --- | --- | --- |
| Base county geometry | `OhioCountyOfficialMapV2` plus local Census-qualified asset | Local rendering path; not yet pipeline-governed |
| County projection to SVG | IEP map component with `d3-geo` | Client-local projection and fitting |
| County identity for interaction | Normalized county label | Not a sufficient production join key |
| IEP presentation data | `countyProfiles.js` / `getCountyProfile` | Static demonstration data keyed by label |
| Selection/highlight | `activeCountyState`, `selectedCounty`, `hoveredCounty` props | Local presentation state |
| Detail/simulation panel | `CountyInteractionLayer.jsx` | Client UI and Fabric simulation request |
| Navigation request | `onOpenDetail` callback in the page | Current callback references `navigate`; ownership needs explicit validation before onboarding |
| Entity-to-county inference | `entityToCounty.js` is imported by the active page | Unsafe fallback dependency exists at the module boundary; it is not a valid Wave 5D join |

## Stable county identity

The qualified Census asset provides stable five-digit Ohio FIPS identity via
`STATE` + `COUNTY`, consistent with `GEO_ID`. That identity is available for
base geography. Wave 5D-ID now adds validated `countyFips` to the 88 static
county profiles, and repository-controlled dynamic records now carry explicit
or unresolved `countyFips` values under the API contract. Future API-backed
records remain conditional on a producer supplying the same field.

Decision before remediation: `BLOCKED_BY_DOMAIN_IDENTITY` for full client
onboarding. After static-profile hardening, the remaining gate is dynamic
record identity and resolver isolation; the Census geometry adapter remains
production-ready infrastructure.

## Entity-to-county dependency

No in the canonical identity or client path. The legacy resolver remains
available to unrelated consumers and still contains the known Franklin
fallback, but the client and exact-FIPS join do not import or call it.

## Target flow

```text
qualified Census asset
  -> CensusCountyGeometryAdapter
  -> production Projection Pipeline
  -> safe county projection result
  -> IEP client adapter
  -> existing IEP map renderer and separately governed IEP data view
```

The Census adapter remains a neutral geography authority. The implemented IEP
client consumes safe county results, but it does not own Census geometry or
publication authority for IEP records.

## Client adapter decision

A dedicated adapter is needed; `QuickMapClientAdapter` is not appropriate for
`REAL_WORLD` county geometry. Proposed location:
`src/system/spatial/clients/iep/`.

Its only responsibility is converting safe projected county results into an
IEP-map-safe view model. It must not infer county membership, publish IEP
records, call `entityToCounty`, navigate, create Mapbox layers, or construct
domain truth.

## Proposed safe county view model

Only fields justified by the current renderer and accepted client contract:

```text
id              safe Spatial feature identity
countyFips      explicit five-digit county identity
label           safe county label
geometry        qualified client-safe geometry
presentation    safe visual state/modifiers
accessibility   semantic label/state text
interaction     request-only interaction metadata
```

Raw adapter provenance, viewer context, evidence, private IEP records, and
authorization data do not enter the view model.

## Join boundary

The only accepted join is:

```text
IEP record.countyFips <-> projected county.countyFips
```

Both values must be explicit, validated Ohio FIPS values. County name matching,
fuzzy matching, address inference, arbitrary text, `entityToCounty`, and the
Franklin fallback are prohibited. Missing identity is unresolved and must not
produce a county association.

## Current interactions

The map currently supports pointer hover and click on SVG paths. Click updates
`activeCountyState` and opens `CountyInteractionLayer`; hover updates the same
local county state. The panel can run a Fabric simulation using the county
label and has a detail callback. The SVG paths are not keyboard controls, and
the drawer does not yet present a certified dialog/focus lifecycle. These are
baseline findings, not Wave 5D changes.

## Publication and privacy

The base Census county geometry is public geography. That does not make the
static/demo IEP profile or any future attached IEP record public. Domain record
publication remains independently governed. A private or unpublished IEP
record must stay absent even when its county geometry is available.

## Accessibility baseline

Current status is partial. The map exposes an SVG image label, but county paths
are not keyboard-focusable/actionable. Priority case rows receive imperative
keyboard wiring in `IEPCommandCenterV2`; the county drawer has no complete
focus-entry/focus-return contract in the inspected implementation. Wave 5D
must preserve current behavior and certify improvements separately.

Fresh browser baseline note: the existing Quick Map Chromium checks were
re-run on this branch without application changes. The 4-test pair was not
green: the modal close button did not receive focus, and the live-parity run
could not find its fixture markers before reaching its modal-focus assertion.
These are carried as pre-existing browser-certification gaps; they do not
authorize Wave 5D to change the IEP map during planning.

## Entry decision

`READY_FOR_BROWSER_PARITY_WITH_CONDITIONS`

The dedicated client and development dual-run are implemented and pass exact
88-county parity tests. The default map was not switched, and the existing
browser certification condition remains open.
