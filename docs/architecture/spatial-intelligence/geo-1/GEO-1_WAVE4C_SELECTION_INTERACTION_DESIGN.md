# GEO-1 Wave 4C Selection and Interaction Design

## Boundary

Wave 4C adds an optional Spatial-marker path to the existing Quick Map. Legacy
registry markers remain on their current rendering and navigation path.

```text
Spatial marker activation
  -> Quick Map interaction controller
  -> Interaction Bus
  -> Selection Store
  -> React presentation subscription
```

The controller accepts only the safe marker model produced by the Wave 4B
client adapter. It does not accept raw records or internal projection results.

## Marker Classes

- Legacy markers: rendered and activated by the existing `MetaverseMiniMap`
  behavior; they never enter the Spatial selection store implicitly.
- Spatial markers: carry a safe selection context in interaction metadata and
  use the Wave 2B store/bus when those collaborators are supplied.

## Events

Wave 4C uses only `SELECT`, `DESELECT`, `FOCUS`, `HIGHLIGHT`, and `OPEN_RECORD`.
The controller creates deterministic local IDs, preserves correlation and
coordinate-space identity, and includes no source record ID or private
provenance. `OPEN_RECORD` is a request only and has no executor or navigation
implementation.

## Selection

Selection is single-valued. The store validates the feature catalog before
accepting a selection; selecting another Spatial marker replaces the previous
selection. Hidden, unavailable-to-select, malformed, or coordinate-incompatible
markers are rejected without creating an event.

Focus and highlight are transient interaction events. They do not select,
navigate, mutate domain records, or change current-location state.

## UI Composition

`MetaverseMiniMap` receives optional `spatialMarkers`,
`spatialSelectionStore`, and `spatialInteractionBus` props. When absent, the
existing map is unchanged. Spatial markers render as separate siblings after
legacy markers and use their client-safe state/accessibility fields.

`MetaverseCityPage` remains the owner of district navigation and protected
entry checks. Wave 4C does not pass legacy markers through the new path.

## Accessibility

Spatial markers are keyboard-capable buttons using the same activation path as
pointer activation. Accessible labels and state text come from the sanitized
marker model. Full focus-return and screen-reader journey certification stays
deferred to Wave 4D.
