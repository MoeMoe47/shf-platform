# GEO-1A Selection Contract

Shared Spatial Selection lets maps, panels, dashboards, and inspectors refer to the same projected object without transferring authority.

## Canonical Selection Fields

```text
selectionId
featureId
domain
sourceAuthority
coordinateFamily
coordinateSpaceId
layerId
selectionReason
timestamp
provenance
eligibleActions
```

## Supported Behavior

Selecting a county, facility, destination, route segment, event marker, or mission marker may let authorized panels react with detail views, evidence panels, route previews, or domain action requests.

## Prohibitions

Selection must not:

- grant permissions
- fabricate data
- modify canonical domain state
- imply verification
- bypass publication rules
- convert coordinates implicitly

## Authority Check

Every action derived from selection remains subject to the target domain authority, identity/authorization, evidence state, and publication state.
