# GEO-1 Wave 4B Quick Map Client Adapter Design

Status: DESIGN ONLY. The production Quick Map client adapter is intentionally
not implemented in Wave 4B design.

## Boundary

```text
ClientProjectionResult[]
        |
        v
QuickMapClientAdapter
        |
        v
QuickMapMarkerViewModel[]
```

The adapter is a presentation compatibility boundary. It consumes only the
already-sanitized `ClientProjectionResult` shape from the Wave 3B runtime and
produces the smallest marker model required by the existing renderer.

It does not accept raw domain records, raw `SpatialFeature` values,
`InternalProjectionResult` values, or untrusted arbitrary objects.

## Proposed Placement

```text
src/system/spatial/clients/quickMap/
  index.js
  QuickMapClientAdapter.js
```

This placement keeps the client adapter under Spatial runtime ownership while
leaving the existing Metaverse renderer and registry untouched. The first
implementation should be framework-neutral and should not import React.

## Responsibilities

- validate the client-result envelope and required feature fields;
- require `coordinateFamily = METAVERSE`;
- require `coordinateSpaceId = metaverse.quick-map`;
- validate finite x/y values within 0..100;
- allowlist marker fields;
- map permitted status/state information to presentation fields;
- preserve safe accessibility metadata;
- omit hidden or suppressed results;
- provide deterministic marker ordering without changing source authority;
- expose safe interaction metadata for later Wave 4C selection work.

## Explicit Non-responsibilities

The adapter must not:

- project raw domain records;
- decide truth, verification, publication, or authorization;
- assign source authority, source record IDs, or provenance;
- create destination IDs or route truth;
- navigate directly;
- convert coordinates or calibrate coordinate spaces;
- infer geography or emergency state;
- execute domain actions;
- promote the 15 existing registry entries into Spatial records.

## Marker View Model

The proposed allowlisted model is:

```text
{
  id,              // visible client identity or safe opaque reference
  x,
  y,
  label,
  state,
  modifiers,
  accessibility,
  interaction
}
```

Field rules:

- `id`: visible client feature identity only for eligible projected results;
  restricted notices use only the frozen opaque notice reference when the
  notice mode permits a marker; hidden results have no marker.
- `x`, `y`: copied exactly from safe client geometry/position after bounded
  validation. No transform or rounding is introduced by the adapter.
- `label`: safe client label only. Private labels and descriptions are never
  reconstructed.
- `state`: safe resolved visual/availability state permitted by the client
  result.
- `modifiers`: only the frozen derived modifier list.
- `accessibility`: safe label/state/selected/highlighted/freshness/verification
  semantics supplied by the client result.
- `interaction`: only safe intent metadata such as `SELECT`, `FOCUS`, or
  `OPEN_RECORD` when the result explicitly permits it. It is not an executor.

The existing renderer currently needs marker position, label, current/live
display context, and accessible labels. Existing aggregate presence,
event/opportunity, civic, and current-location overlays remain separate until
their source authority and projection contracts are established.

## Status Handling

| Client status | Adapter result |
| --- | --- |
| `PROJECTED` | marker, if Quick Map coordinates and safe fields validate |
| `STALE` | marker with stale presentation only when the client result permits it |
| `UNAVAILABLE` | safe unavailable marker only when supplied by the client result |
| `RESTRICTED` notice | generic restricted notice only; no record identity or private data |
| `RESTRICTED` hide | no marker |
| `SUPPRESSED` | no marker |
| `INVALID` | no marker; diagnostic remains outside the marker model |

The adapter must never make a hidden record selectable. A notice is not a
record and cannot be used to derive navigation.

## Coordinate Rules

Accepted values are exactly:

```text
coordinateFamily: METAVERSE
coordinateSpaceId: metaverse.quick-map
```

Rejected values include `metaverse.master-city`, every REAL_WORLD space,
unknown spaces, malformed geometry, and out-of-range coordinates. The adapter
must fail closed and never call a transform registry as a fallback. No Quick
Map/master-city calibration is part of Wave 4B.

## Identity and Privacy

Visible projected markers may use the accepted client feature identity from
Wave 3B. A hidden record must not expose its deterministic feature ID or source
record ID. Restricted notices may use only the frozen opaque notice reference
and generic notice fields. Private provenance, evidence, adapter identity,
geometry, title, description, and source record identity stay outside the
marker model.

## Dual-source Migration

Wave 4B may run two sources side by side:

1. Existing Quick Map registry markers remain client-owned presentation records
   with their current IDs, `UNMAPPED`/`PROVISIONAL` status, and navigation
   behavior.
2. Spatial fixture markers use a separate namespace and explicit test source
   authority, source record ID, provenance, publication state, and Quick Map
   coordinates.

Labels are not identity. Equal labels must not merge records. Duplicate
coordinates must not merge records. Marker ordering must be deterministic and
must keep the two source classes distinguishable to accessibility consumers.

Existing registry markers retain the existing renderer and navigation path;
Spatial markers cannot directly invoke navigation.

## Test-only Pilot

The test-only source authority is a fixture concern only. It may use the
existing Wave 3B fixture adapter and a deterministic source record with:

- `sourceAuthority` explicitly marked test-only;
- deterministic `sourceRecordId`;
- valid Quick Map coordinate space and provenance;
- valid publication state;
- no production destination identity.

The intended proof is:

```text
fixture source
  -> test projection adapter
  -> Spatial Projection Pipeline
  -> ClientProjectionResult
  -> QuickMapClientAdapter
  -> marker view model
```

No test fixture is imported by production code.

## Selection and Navigation Preparation

Wave 4B may expose `selectable`, `featureId`, and `interactionType` metadata
when those fields are safe. It must not connect the Selection Store or
Interaction Bus as a production flow; that belongs to Wave 4C.

The adapter never navigates. Existing district and fast-travel behavior stays
owned by `MetaverseCityPage`. A test marker with no real destination has no
navigation action.

## Proposed API Shape

The runtime implementation should expose a small factory and pure conversion
methods:

```text
createQuickMapClientAdapter()
  toMarkerModels(clientProjectionResults)
  mergeMarkerSources({ legacyMarkers, spatialMarkers })
```

The factory must not expose `navigate`, `executeDomainAction`, coordinate
transform, or calibration methods. The exact return/error representation may
follow repository conventions, but invalid input must fail closed.

## Accessibility

Every marker view model must provide an accessible name and safe state text.
It should preserve unavailable, stale, restricted, selected, and highlighted
semantics where supplied. Keyboard activation will consume the same metadata
as pointer activation, but browser focus traversal remains Wave 4D work.
