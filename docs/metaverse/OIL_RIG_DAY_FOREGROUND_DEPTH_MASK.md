# Oil Rig DAY Foreground Depth Mask

The Oil Rig DAY cloud system uses a non-destructive foreground cutout so animated sky clouds can pass visually behind the rig silhouette while the approved master background remains untouched.

## Asset

- Foreground cutout: `public/assets/metaverse/regional/oil-rig/oil-rig-day-foreground-cutout.png`
- Source plate: `public/assets/metaverse/regional/oil-rig/oil-rig-background-day.png`
- Size: 1536 x 1024, matching the approved DAY master plate
- Format: transparent PNG foreground layer

The cutout contains the major rig silhouette and foreground structure that should sit above moving cloud overlays: derrick, cranes, helipad/platform structures, and main rig superstructure. It does not replace or modify the source background.

## Layering

The regional scene renders in this order:

1. Approved Oil Rig DAY master image
2. Existing animated cloud atmosphere layers
3. `RegionalForegroundDepthLayer` using the transparent rig cutout
4. UI/debug overlays

Because the cutout uses the same full-plate dimensions and world box as the master image, it stays aligned through existing camera zoom and pan behavior.

## Configuration

The layer is registered on the Oil Rig scene in `src/system/metaverse/regionalSceneRegistry.js` as `foregroundLayer` with role `rig-silhouette-depth-mask`. It is currently available only for the DAY scene.

## Developer Controls

Open `/metaverse/oil-rig?metaverseDev=1` and use:

- `Rig Depth Mask` to toggle the foreground depth layer on/off
- `Show rig mask bounds` to outline the full foreground layer and approximate rig protection area

The Ocean Engine dev page also exposes the same controls for oil-rig cloud/ocean preview validation.

## Future Use

Other regional scenes can reuse this pattern by adding a transparent foreground layer to their scene registry entry and rendering through `RegionalForegroundDepthLayer`. Future refinements could add per-scene alpha masks, foreground-only inspection mode, or separate mask assets for dusk/night variants if those scenes need cloud depth effects.
