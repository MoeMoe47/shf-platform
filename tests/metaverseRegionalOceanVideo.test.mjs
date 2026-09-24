import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  OIL_RIG_DAY_OCEAN_VIDEO_PRESET,
  validateRegionalOceanVideoPreset,
} from "../src/system/metaverse/regionalOceanVideo.js";

const videoLayerSource = readFileSync(new URL("../src/components/metaverse/RegionalOceanVideoLayer.jsx", import.meta.url), "utf8");
const regionalPageSource = readFileSync(new URL("../src/pages/metaverse/MetaverseRegionalScenePage.jsx", import.meta.url), "utf8");
const sceneRegistrySource = readFileSync(new URL("../src/system/metaverse/regionalSceneRegistry.js", import.meta.url), "utf8");

test("Oil Rig cinematic ocean video contract is scene-aligned and has a disabled foam extension", () => {
  assert.deepEqual(validateRegionalOceanVideoPreset(), { valid: true, errors: [] });
  assert.deepEqual(OIL_RIG_DAY_OCEAN_VIDEO_PRESET.oceanVideoBounds, { x: 0, y: 21.1, width: 100, height: 78.9 });
  assert.match(OIL_RIG_DAY_OCEAN_VIDEO_PRESET.video.webm, /oil-rig-day-ocean-loop\.webm$/);
  assert.match(OIL_RIG_DAY_OCEAN_VIDEO_PRESET.video.mp4, /oil-rig-day-ocean-loop\.mp4$/);
  assert.equal(OIL_RIG_DAY_OCEAN_VIDEO_PRESET.foamExtension.enabled, false);
  assert.match(OIL_RIG_DAY_OCEAN_VIDEO_PRESET.foamExtension.webm, /oil-rig-day-foam-loop\.webm$/);
});

test("production uses the cinematic plate when available and leaves procedural rendering dev-only", () => {
  assert.match(sceneRegistrySource, /oceanVideo:\s*OIL_RIG_DAY_OCEAN_VIDEO_PRESET/);
  assert.match(regionalPageSource, /<RegionalOceanVideoLayer/);
  assert.match(regionalPageSource, /enabled=\{!devModeEnabled \|\| oceanRenderer === "CINEMATIC_PLATE"\}/);
  assert.match(regionalPageSource, /devModeEnabled && oceanRenderer === "PROCEDURAL_DEBUG"/);
  assert.match(videoLayerSource, /OCEAN VIDEO ASSET MISSING/);
  assert.match(videoLayerSource, /publicAssetUrl\(OIL_RIG_DAY_OCEAN_VIDEO_PRESET\.video\.webm\)/);
  assert.match(videoLayerSource, /publicAssetUrl\(OIL_RIG_DAY_OCEAN_VIDEO_PRESET\.video\.mp4\)/);
  assert.match(videoLayerSource, /document\.hidden/);
  assert.match(videoLayerSource, /metaverse-ocean-video-command/);
});
