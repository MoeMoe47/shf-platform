# GEO-1 Wave 6C Regional Geometry Authoring Plan

## Reusable Patterns

The repository has reusable DEV authoring patterns in:

- `src/hooks/metaverse/useMetaverseTrafficAuthoring.js` - state, undo, local draft, import/export, and explicit owner save behavior. Classification: `DEV_AUTHORING_TOOL`.
- `src/system/metaverse/traffic/metaverseTrafficAuthoringModel.js` - pure point editing, clamping, validation, and serialization. Classification: `DEV_AUTHORING_TOOL`.
- `src/components/metaverse/traffic-authoring/MetaverseTrafficAuthoringPanel.jsx` - review/import/export controls. Classification: `DEV_AUTHORING_TOOL`.
- `src/hooks/metaverse/useMetaverseRiverTrace.js` and `src/system/metaverse/metaverseRiverTraceModel.js` - explicit point editing for River-owned geometry. Classification: `DEV_AUTHORING_TOOL` / `REVIEW_TOOL`.
- `src/system/metaverse/metaverseRoadTraceRegistry.js` - approved/reference road trace data, not a Regional scene authority. Classification: `REFERENCE_ONLY` for this scope.
- `src/components/metaverse/MetaverseRiverTraceAuthoringOverlay.jsx` and `MetaverseRiverTraceAuthoringPanel.jsx` - overlay and review surfaces. Classification: `DEV_AUTHORING_TOOL`.

Reusable behavior includes explicit point placement, immutable edits, bounds
checking, undo/reset, preview, validation, and JSON import/export. These are
patterns only; Traffic and Water authority must not be reused for scene
coverage authority.

## Future Tool Requirements

A future DEV-only tool should select an implemented scene, display an approved
asset variant, author a Polygon, edit vertices, undo/reset, preview, validate,
export canonical geometry, show coordinates, and compare variants. It must
never alter image assets, route order, or mobility registries.

## Lifecycle

```text
DRAFT -> REVIEW -> APPROVED -> SUPERSEDED
                   \-> REJECTED
```

Only approved entries can be consumed by a future Spatial adapter.

## First Candidates

`oil-rig` and `open-sea` are both `READY_WITH_CONDITIONS`: implemented and
asset-backed, but blocked by the unfrozen Regional coordinate standard,
geometry ownership approval, and asset-alignment evidence. No geometry is
traced in this phase.
