# Oil Rig DAY Seagull Life System

The Oil Rig DAY scene has a reusable seagull fauna layer for future ocean and coastal scenes. It is data-driven through `src/system/metaverse/seagullRegistry.js` and rendered by `RegionalSeagullLifeLayer`.

## Assets

The system expects owner-supplied transparent PNGs at:

- `public/assets/metaverse/fauna/seagulls/sg_fly_01.png`
- `public/assets/metaverse/fauna/seagulls/sg_fly_02.png`
- `public/assets/metaverse/fauna/seagulls/sg_fly_03.png`
- `public/assets/metaverse/fauna/seagulls/sg_fly_04.png`
- `public/assets/metaverse/fauna/seagulls/sg_perch_01.png`
- `public/assets/metaverse/fauna/seagulls/sg_perch_02.png`
- `public/assets/metaverse/fauna/seagulls/sg_perch_03.png`
- `public/assets/metaverse/fauna/seagulls/sg_perch_04.png`

No seagull art is generated in code. Missing image loads are hidden so the scene does not show broken-image icons while the asset library is being installed.

## Flight Paths

`OIL_RIG_DAY_SEAGULL_PRESET.flightPaths` defines reusable path types:

- horizon glides
- mid rig circle
- mid arc pass
- near fly-by

Each path stores normalized control points, depth, loop behavior, and wind influence. Flying instances reference paths by `pathId`.

## Perch Anchors

`perchAnchors` define normalized attachment points on believable rig structures such as the helipad rail, upper deck rail, crane rail, tower crossbeam, and lower deck edge. Perched instances reference anchors and choose one of the four perched assets.

## Layering

The Oil Rig scene mounts `RegionalSeagullLifeLayer` twice:

1. `depthMode="behindRig"` after clouds and before the foreground rig cutout for far/mid flying birds.
2. `depthMode="frontRig"` after the foreground rig cutout for near fly-bys and perched birds.

This preserves the rig depth mask and keeps perched birds physically attached to the foreground rig layer.

## Wind

The regional page passes the cloud wind direction and speed into the seagull runtime config. Birds respond with subtle drift/nudge rather than full physics, keeping clouds and wildlife environmentally coherent.

## Dev Controls

In `/metaverse/oil-rig?metaverseDev=1`, the Birds panel includes:

- Birds on/off
- flying count
- perched count
- bird speed
- wind influence
- glide amount
- flap frequency
- scale multiplier
- flying/far/near/perched toggles
- show flight paths
- show perch anchors
- debug labels
- randomize perches
- reset birds

## Extending

Future coastal scenes can add a new preset using the same registry shape: define flight paths, perch anchors, and default instances, then mount `RegionalSeagullLifeLayer` around any scene-specific foreground mask as needed.
