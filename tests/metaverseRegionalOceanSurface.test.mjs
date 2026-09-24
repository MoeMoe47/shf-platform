import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { OCEAN_QUALITY_MODES, OIL_RIG_DAY_OCEAN_PRESET, createOilRigOceanSceneConfig, normalizeOceanSceneConfig } from "../src/system/metaverse/oceanMotionEngine.js";
import { OIL_RIG_OCEAN_MASK, validateOilRigOceanMask } from "../src/system/metaverse/oilRigOceanMask.js";

const layerSource = readFileSync(new URL("../src/components/metaverse/RegionalOceanSurfaceLayer.jsx", import.meta.url), "utf8");
const regionalPageSource = readFileSync(new URL("../src/pages/metaverse/MetaverseRegionalScenePage.jsx", import.meta.url), "utf8");
const devPageSource = readFileSync(new URL("../src/pages/metaverse/OceanEngineDevPage.jsx", import.meta.url), "utf8");

test("Oil Rig DAY ocean mask matches the locked master and protects the rig cutout", () => {
  assert.deepEqual(validateOilRigOceanMask(OIL_RIG_OCEAN_MASK), { valid: true, errors: [] });
  assert.deepEqual(OIL_RIG_OCEAN_MASK.dimensions, { width: 1536, height: 1024 });
  assert.ok(OIL_RIG_OCEAN_MASK.horizonY > 20 && OIL_RIG_OCEAN_MASK.horizonY < 22);
  assert.match(OIL_RIG_OCEAN_MASK.maskAsset, /oil-rig-day-ocean-mask\.png$/);
  assert.match(OIL_RIG_OCEAN_MASK.sourceForegroundAsset, /oil-rig-day-foreground-cutout\.png$/);
});

test("production ocean defaults provide three enabled wave scales and perspective controls", () => {
  const config = createOilRigOceanSceneConfig();
  assert.equal(OIL_RIG_DAY_OCEAN_PRESET.name, "Oil Rig DAY Production Ocean Surface");
  assert.equal(config.surface.enabled, true);
  assert.deepEqual(Object.keys(config.waves), ["swell", "medium", "ripple"]);
  assert.ok(config.waves.swell.amplitude > config.waves.medium.amplitude);
  assert.ok(config.waves.medium.amplitude > config.waves.ripple.amplitude);
  assert.equal(config.global.flowDirection, 250);
  assert.equal(config.global.horizonY, 21.1);
  assert.ok(config.global.horizonSuppression > 0.8);
});

test("ocean validation clamps surface parameters and preserves all quality modes", () => {
  const normalized = normalizeOceanSceneConfig({ surface: { enabled: false }, global: { flowDirection: 720, displacementStrength: 4, horizonSuppression: -1 } });
  assert.equal(normalized.surface.enabled, false);
  assert.equal(normalized.global.flowDirection, 0);
  assert.equal(normalized.global.displacementStrength, 2);
  assert.equal(normalized.global.horizonSuppression, 0);
  assert.deepEqual(OCEAN_QUALITY_MODES, ["Low", "Medium", "High", "Ultra"]);
});

test("regional and dev routes mount the reusable WebGL ocean renderer and its controls", () => {
  assert.match(layerSource, /webgl/);
  assert.match(layerSource, /uSource/);
  assert.match(layerSource, /uMask/);
  assert.match(layerSource, /maskAsset/);
  assert.match(layerSource, /sampleUv\.y = min\(sampleUv\.y, 1\.0 - uHorizon/);
  assert.match(layerSource, /fbm/);
  assert.match(layerSource, /boundedRenderSize/);
  assert.match(layerSource, /qualityPixelBudget/);
  assert.match(layerSource, /document\.hidden/);
  assert.match(layerSource, /canvas\.dataset\.renderQuality/);
  assert.match(layerSource, /reducedMotion/);
  assert.match(regionalPageSource, /<RegionalOceanSurfaceLayer/);
  assert.match(devPageSource, /<RegionalOceanSurfaceLayer/);
  assert.match(devPageSource, /Ocean Renderer On \/ Off/);
  assert.match(devPageSource, /Show ocean mask/);
  assert.match(devPageSource, /Show depth bands/);
  assert.match(devPageSource, /Freeze renderer/);
});
