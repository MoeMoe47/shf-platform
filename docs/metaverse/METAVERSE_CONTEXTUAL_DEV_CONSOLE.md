# Metaverse Contextual Dev Console

## Purpose

The contextual developer console is the single live-tuning surface for Metaverse scenes in development mode (`?metaverseDev=1`). It renders only controls declared by the active scene's capability metadata. Dedicated authoring pages remain deeper geometry and calibration tools.

Developer controls must never create authority or runtime behavior separate from the production scene system they inspect.

## Audit Inventory

| Page/scene | Route | Runtime systems currently mounted | Contextual sections |
| --- | --- | --- | --- |
| Oil Rig | `/metaverse/oil-rig` | locked background, ocean WebGL layer, clouds, cargo ships, seagulls, rig depth layer, Quick Map | Scene, Clouds, Ocean, Foam & Turbulence, Weather, Cargo Ships, Wildlife, Rig Depth, Debug, Performance |
| Open Sea | `/metaverse/open-sea` | regional background/shell, cloud-capable regional layer, seagull-capable regional layer, Quick Map | Scene, Clouds, Weather, Wildlife, Debug, Performance |
| Silicon Heartland City | `/metaverse` | city background, time-of-day, cloud/ambient/weather slots, presence/event overlays, review-gated traffic/river authoring | Scene, Weather, Debug, Performance |
| Ocean Engine | `/metaverse/dev/ocean` | deep ocean authoring/editor, flow paths, foam/turbulence/wake geometry | Dedicated editor; not a contextual scene console |

The remaining labels in `REGIONAL_ROUTE_SEQUENCE` (Shipping Corridor, Harbor, Container Yard, Freight Highway, Farms, Woods, River, Bridge, Mountain Region, Gateway, and Final Approach) are route-planning entries without registered scene objects and are intentionally excluded until their runtime layers are implemented.

## Capability Registry

Capabilities live in `src/system/metaverse/metaverseDevCapabilities.js` and are mirrored on registered regional scene declarations. A capability may be a boolean or a constrained object, such as `weather.precipitation: ["rain"]`.

The console maps capability IDs to shared sections. A missing capability means the section is absent; planned systems do not receive placeholder controls.

## Shared Runtime Rule

Sections receive the actual runtime controller used by the scene. Ocean controls use `useOceanMotionEditor`; weather uses `useMetaverseEnvironmentRuntime`; cloud wind is derived from the environment controller on regional scenes. No demo-only state is created by the console.

## Master Playback and Reset

`Play All`, `Pause All`, and `Restart All` coordinate only controllers mounted by that scene. Scene reset calls canonical scene presets and does not touch navigation, account, progress, or server state.

## Dedicated Tool Separation

Contextual console: live tuning while looking at a scene.

Dedicated editor: geometry authoring, trace editing, mask inspection, and advanced calibration. For example, `/metaverse/dev/ocean` retains flow drawing and zone editing rather than being replaced by the compact console.

## Adding a New Scene

1. Register the scene and its actual runtime layers.
2. Declare valid capabilities in the capability registry and scene config.
3. Create or reuse runtime controllers for those layers.
4. Pass section content/controllers to `MetaverseDevConsole`.
5. Add a focused metadata test and browser acceptance for relevant/irrelevant sections.

