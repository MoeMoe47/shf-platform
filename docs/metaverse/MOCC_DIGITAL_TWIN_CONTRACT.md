# MOCC Digital Twin Contract (Phase 9)

The Quick Map / Mini Map remains the canonical Digital Twin spatial surface. No competing map or coordinate system is introduced.

## Base map

The MOCC Digital Twin is the existing Quick Map:

- **Image:** `MINIMAP_ASSET`, rendered through the existing `MetaverseMiniMap` component.
- **Coordinate space:** `metaverse.quick-map`, the same canonical space. `digitalTwin.baseMap.reused` is always `true`.

No new image, coordinate space, spatial registry or layer registry is created.

## Overlays

Implemented overlays are canonical spatial layers registered in `DEFAULT_SPATIAL_LAYERS`. All three share these properties:

- the only supported space is `metaverse.quick-map`;
- not published;
- time-aware;
- require `metaverse.operations.view`.

| Overlay | Layer |
| --- | --- |
| infrastructure | `metaverse.mocc.infrastructure` |
| incidents | `metaverse.mocc.incidents` |
| mobility | `metaverse.mocc.mobility` |

The Spatial Command Center's qualified layer list is unchanged.

Fourteen further overlays are declared `PLANNED` with `layerId: null`:

- rail/sky-bridge, aviation, port logistics;
- fire/EMS, dispatch, hospital;
- public works, water utility, telecom/fiber;
- weather;
- mission and team aggregates;
- AI agents, civic events.

## Placement rule

A feature is placed only when `MINIMAP_LOCATION_REGISTRY` has a calibrated location whose `destinationId` names the feature's canonical destination.

- Nothing is inferred from labels, geometry or district names.
- Every other feature is `mapStatus: "UNMAPPED"`, with `position: null`, and is listed in the overlay's feature table rather than drawn.
- Today all districts and the data-center campus are unmapped, so overlay features list honestly as `UNMAPPED`. That is the expected state until calibration work maps them.

## Audio landmarks

World audio landmarks follow the same rule. Each one anchors to one of the following:

- a calibrated Quick Map location (`marina-harbor`, `fire`, `hospital`);
- an existing regional scene (`river`, `oil-rig`).

The east-to-west regional geography (oil rig → … → gateway → Silicon Heartland city) is unchanged.
