# Wave 6C Oil Rig Asset Alignment Report

## Scope

This audit covers only the three production background plates referenced by
`regionalSceneRegistry.js` for `oil-rig`. Foreground cutouts, ocean video,
cargo ships, clouds, and Quick Map imagery are separate presentation or
mobility layers and are not scene-coverage geometry authority.

## Production Assets

| Variant | Path | Dimensions | SHA-256 |
| --- | --- | --- | --- |
| DAY | `public/assets/metaverse/regional/oil-rig/oil-rig-background-day.png` | 1536 x 1024 | `3b5d111b624f365a26434f0bb99aebe82bdd0641ffece39992ca9b94b64d8608` |
| DUSK | `public/assets/metaverse/regional/oil-rig/oil-rig-background-dusk.png` | 1536 x 1024 | `882070509dac8430d61b6e82b9b52a9d679b80d8338c08069bf9509ec446d3f2` |
| NIGHT | `public/assets/metaverse/regional/oil-rig/oil-rig-background-night.png` | 1536 x 1024 | `f676c6c3dc430dcc80d078abd01358e7f9b8ad962da34da5ec1dd73c7dcc47f5` |

All three are referenced by the Oil Rig scene declaration and resolved through
`resolveMetaverseAssetVariant` into `MetaverseRegionalScenePage`, which passes
the declared 1536:1024 aspect ratio to `MetaverseCamera`.

## Method

The audit used image-normalized coordinates, where `x = pixelX / 1536` and
`y = pixelY / 1024`, with measurements rounded to 0.1 regional-normalized
units for reporting. Stable structural landmarks were compared across the
three plates. Clouds, water texture, reflections, lighting, and atmospheric
effects were excluded. The method also checks for systematic crop, translation,
scale, horizon, or perspective changes; it is not a pixel-difference test.

The pre-declared sharing tolerance is a maximum displacement of 1.0
scene-normalized unit per landmark, with no structural crop or scale change.
This is 1% of the frozen 0..100 scene frame and leaves room for authoring
trace precision while remaining materially smaller than the 1.08 camera
overscan margin. The tolerance was fixed before classification.

## Landmark Evidence

| Landmark | DAY | DUSK | NIGHT |
| --- | ---: | ---: | ---: |
| Mast apex | [60.0, 3.5] | [60.0, 3.5] | [60.0, 3.5] |
| Left crane tip | [49.8, 24.4] | [49.8, 24.4] | [49.7, 24.4] |
| Right crane tip | [70.1, 28.1] | [70.1, 28.1] | [70.1, 28.0] |
| Central tower sign center | [60.2, 32.5] | [60.2, 32.5] | [60.2, 32.5] |
| Helipad center | [76.5, 40.5] | [76.5, 40.5] | [76.5, 40.5] |
| Left outer deck edge | [43.0, 48.0] | [43.0, 48.0] | [43.0, 48.1] |
| Right helipad deck edge | [84.5, 46.0] | [84.5, 46.0] | [84.5, 46.0] |
| Lower right leg/waterline | [74.0, 68.0] | [74.0, 68.0] | [74.0, 68.1] |

The landmarks are distributed across the upper, middle, lower, left, center,
and right portions of the frame. These coordinates are audit evidence only;
they are not an authored Polygon and must not be imported as scene geometry.

## Pairwise Results

| Pair | Max displacement | Median displacement | Mean displacement | Result |
| --- | ---: | ---: | ---: | --- |
| DAY ↔ DUSK | 0.0 | 0.0 | 0.0 | within tolerance |
| DAY ↔ NIGHT | 0.1 | 0.0 | 0.0 | within tolerance |
| DUSK ↔ NIGHT | 0.1 | 0.0 | 0.0 | within tolerance |

No systematic translation, scale difference, crop difference, horizon shift,
or perspective change was observed in the stable structure. The visible
differences are illumination, sky, cloud, water, and reflection changes.

## Classification

`ALIGNED_WITH_TOLERANCE`.

The three variants may share one scene-local geometry definition, subject to
the composition-family reference and asset-hash checks in the geometry
registry contract. A future asset change that alters framing or structural
registration invalidates this conclusion and moves geometry to `NEEDS_REVIEW`.

## Composition Family

Shared family: `oil-rig` DAY/DUSK/NIGHT composition family. Its deterministic
reference is derived from the scene ID, the three asset hashes, and the
alignment-standard version; it is separate from the geometry hash.
