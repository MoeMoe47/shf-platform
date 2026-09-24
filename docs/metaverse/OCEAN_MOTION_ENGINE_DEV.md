# Ocean Motion Engine Dev Tool

The Ocean Motion Engine is a developer-facing simulation/editor for making approved ocean master plates feel alive through non-destructive animated overlays. The first target scene is the offshore oil rig regional plate at `public/assets/metaverse/regional/oil-rig/oil-rig-background-day.png`.

## Route

Open the tool at:

`/metaverse/dev/ocean`

The live regional oil-rig page is not replaced. The dev page locks the master background image and renders motion above it.

## Architecture

- `src/system/metaverse/oceanMotionEngine.js` owns the schema, starter scene, weather presets, path helpers, validation, playback stepping, and motion sampling.
- `src/hooks/metaverse/useOceanMotionEditor.js` owns editor state, selection, local persistence, keyboard shortcuts, JSON import/export, and playback state.
- `src/pages/metaverse/OceanEngineDevPage.jsx` renders the institutional editor shell, locked scene image, canvas motion overlays, SVG debug/edit overlays, properties, layers, save/load, and playback controls.
- `src/pages/metaverse/ocean-engine-dev.css` provides the dark studio-tool layout.

## Data Model

`OceanSceneConfig` includes:

- scene id/name, background image, dimensions, metadata/version
- global intensity, speed, horizon/foreground perspective settings
- weather preset
- large swell, medium wave, and small ripple layer settings
- shimmer/specular settings
- flow paths with control points, speed, strength, width, falloff, layer, debug color
- foam zones
- turbulence zones
- wake/disturbance zones
- playback defaults
- debug state

All coordinates use the existing metaverse 0-100 scene coordinate convention.

## Editor Workflow

Use the left panel to select tools:

- `Draw Flow` creates and extends current bands.
- `Turbulence`, `Foam`, and `Wake` place local zones on the locked plate.
- `Select` chooses objects and handles.
- Delete/Backspace removes the selected point or object.
- Space toggles playback.

The right panel edits scene/global settings, selected object properties, wave layers, shimmer, presets, performance, and JSON persistence.

## Save / Load

The tool stores drafts in browser `localStorage` under `met-ocean-motion-engine-dev-v1`. Export downloads a normalized JSON config. Import accepts a pasted `OceanSceneConfig` JSON payload and normalizes it before use.

## Future Expansion

The engine is ready to expand toward vessels, moving wake emitters, harbor and river plates, docks/bridges, emergency marine response, weather-driven sea states, and production-approved runtime overlays once a config is reviewed and promoted.

