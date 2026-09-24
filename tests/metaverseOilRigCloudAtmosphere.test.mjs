import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  CLOUD_MOTION_PREVIEW_MULTIPLIERS,
  OIL_RIG_DAY_CLOUD_PRESET,
  REGIONAL_CLOUD_ASSET_BASE,
  REGIONAL_CLOUD_LAYER_IDS,
  cloneCloudSceneConfig,
  resolveCloudLayerSkyBounds,
  resolveCloudLayerEnabled,
  resolveCloudWindVector,
  resolveRenderableCloudInstances,
  validateCloudSceneConfig,
} from "../src/system/metaverse/regionalCloudAtmosphere.js";

const regionalPageSource = readFileSync(new URL("../src/pages/metaverse/MetaverseRegionalScenePage.jsx", import.meta.url), "utf8");
const oceanDevPageSource = readFileSync(new URL("../src/pages/metaverse/OceanEngineDevPage.jsx", import.meta.url), "utf8");
const cloudLayerSource = readFileSync(new URL("../src/components/metaverse/RegionalCloudAtmosphereLayer.jsx", import.meta.url), "utf8");
const foregroundLayerSource = readFileSync(new URL("../src/components/metaverse/RegionalForegroundDepthLayer.jsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");

function readPngDimensions(assetPath) {
  const bytes = readFileSync(new URL(`../${assetPath}`, import.meta.url));
  assert.equal(bytes.toString("ascii", 12, 16), "IHDR", `${assetPath} must be a PNG with an IHDR chunk`);
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

test("Oil Rig DAY cloud preset uses existing approved transparent cloud assets", () => {
  assert.equal(OIL_RIG_DAY_CLOUD_PRESET.id, "oil-rig-day");
  assert.equal(OIL_RIG_DAY_CLOUD_PRESET.sceneId, "oil-rig");
  assert.equal(OIL_RIG_DAY_CLOUD_PRESET.timeOfDay, "DAY");
  assert.deepEqual(validateCloudSceneConfig(OIL_RIG_DAY_CLOUD_PRESET), { valid: true, errors: [] });
  const referencedAssets = new Set();
  for (const layer of OIL_RIG_DAY_CLOUD_PRESET.layers) {
    for (const asset of layer.assets) referencedAssets.add(asset);
    for (const instance of layer.instances) referencedAssets.add(instance.asset);
  }
  assert.ok(referencedAssets.size >= 6);
  for (const asset of referencedAssets) {
    assert.ok(asset.startsWith(REGIONAL_CLOUD_ASSET_BASE), asset);
    assert.ok(existsSync(asset), asset);
    assert.match(asset, /\.png$/);
  }
  assert.equal(OIL_RIG_DAY_CLOUD_PRESET.layers.reduce((count, layer) => count + layer.instances.length, 0), 12);
});

test("Oil Rig DAY cloud preset has three depth layers with subtle relative motion", () => {
  assert.deepEqual(OIL_RIG_DAY_CLOUD_PRESET.layers.map((layer) => layer.id), REGIONAL_CLOUD_LAYER_IDS);
  assert.equal(OIL_RIG_DAY_CLOUD_PRESET.horizonY, 22);
  assert.equal(OIL_RIG_DAY_CLOUD_PRESET.cloudSkyClipY, 24);
  const [far, mid, near] = OIL_RIG_DAY_CLOUD_PRESET.layers;
  assert.ok(far.speedMultiplier < mid.speedMultiplier);
  assert.ok(mid.speedMultiplier < near.speedMultiplier);
  assert.ok(far.naturalSpeedPxPerSecond >= 0.9 && far.naturalSpeedPxPerSecond <= 1.4);
  assert.ok(mid.naturalSpeedPxPerSecond >= 1.8 && mid.naturalSpeedPxPerSecond <= 2.6);
  assert.ok(near.naturalSpeedPxPerSecond >= 3.4 && near.naturalSpeedPxPerSecond <= 4.8);
  assert.ok(far.parallaxMultiplier < mid.parallaxMultiplier);
  assert.ok(mid.parallaxMultiplier < near.parallaxMultiplier);
  assert.ok(far.instances.every((cloud) => cloud.y <= far.skyBounds.maxBottomY));
  assert.ok(far.skyBounds.maxBottomY > OIL_RIG_DAY_CLOUD_PRESET.horizonY);
  assert.ok(mid.skyBounds.maxBottomY < OIL_RIG_DAY_CLOUD_PRESET.horizonY);
  assert.ok(near.skyBounds.maxBottomY < mid.skyBounds.maxBottomY);
  assert.ok(mid.instances.every((cloud) => cloud.y >= 10 && cloud.y < 13));
  assert.ok(near.instances.every((cloud) => cloud.y >= 7 && cloud.y < 9));
});

test("Oil Rig DAY cloud asset bottoms remain inside layer sky-safe bounds", () => {
  const boundsByLayer = resolveCloudLayerSkyBounds(OIL_RIG_DAY_CLOUD_PRESET);
  for (const layer of OIL_RIG_DAY_CLOUD_PRESET.layers) {
    const bounds = boundsByLayer[layer.id];
    assert.ok(bounds.maxBottomY <= OIL_RIG_DAY_CLOUD_PRESET.cloudSkyClipY, `${layer.id} bottom must stay within clipped sky`);
    for (const instance of layer.instances) {
      const { width, height } = readPngDimensions(instance.asset);
      const renderedHeight = instance.width * (height / width);
      const bottom = instance.y + renderedHeight + instance.verticalDrift;
      assert.ok(bottom <= bounds.maxBottomY, `${instance.id} bottom ${bottom.toFixed(2)} exceeds ${layer.id} sky bound ${bounds.maxBottomY}`);
    }
  }
});

test("cloud layer enable and density controls affect renderable instances", () => {
  const config = cloneCloudSceneConfig(OIL_RIG_DAY_CLOUD_PRESET);
  assert.equal(resolveCloudLayerEnabled(config, "near"), true);
  config.layers = config.layers.map((layer) => (layer.id === "near" ? { ...layer, enabled: false } : layer));
  assert.equal(resolveCloudLayerEnabled(config, "near"), false);
  assert.equal(resolveRenderableCloudInstances(config).some((cloud) => cloud.layerId === "near"), false);
  config.density = 0.25;
  assert.ok(resolveRenderableCloudInstances(config).length < resolveRenderableCloudInstances(OIL_RIG_DAY_CLOUD_PRESET).length);
});

test("cloud animation state derives from wind and respects reduced motion", () => {
  const wind = resolveCloudWindVector(270);
  assert.ok(wind.x < 0);
  assert.ok(Math.abs(wind.y) < 0.001);
  const moving = resolveRenderableCloudInstances(OIL_RIG_DAY_CLOUD_PRESET);
  const visible = resolveRenderableCloudInstances(OIL_RIG_DAY_CLOUD_PRESET, { motionPreview: "VISIBLE" });
  const exaggerated = resolveRenderableCloudInstances(OIL_RIG_DAY_CLOUD_PRESET, { motionPreview: "EXAGGERATED" });
  const reduced = resolveRenderableCloudInstances(OIL_RIG_DAY_CLOUD_PRESET, { reducedMotion: true });
  assert.ok(moving.every((cloud) => cloud.speedPxPerSecond > 0));
  assert.ok(reduced.every((cloud) => cloud.speedPxPerSecond === 0));
  assert.ok(CLOUD_MOTION_PREVIEW_MULTIPLIERS.VISIBLE >= 2 && CLOUD_MOTION_PREVIEW_MULTIPLIERS.VISIBLE <= 3);
  assert.ok(CLOUD_MOTION_PREVIEW_MULTIPLIERS.EXAGGERATED >= 5 && CLOUD_MOTION_PREVIEW_MULTIPLIERS.EXAGGERATED <= 7);
  assert.equal(visible[0].speedPxPerSecond, moving[0].speedPxPerSecond * CLOUD_MOTION_PREVIEW_MULTIPLIERS.VISIBLE);
  assert.equal(exaggerated[0].speedPxPerSecond, moving[0].speedPxPerSecond * CLOUD_MOTION_PREVIEW_MULTIPLIERS.EXAGGERATED);
});

test("regional Oil Rig DAY scene renders clouds as non-destructive overlays", () => {
  assert.match(regionalPageSource, /RegionalCloudAtmosphereLayer/);
  assert.match(regionalPageSource, /RegionalForegroundDepthLayer/);
  assert.match(regionalPageSource, /sceneId=\{scene\.id\}/);
  assert.match(regionalPageSource, /timeOfDay=\{resolvedTimeOfDay\}/);
  assert.match(regionalPageSource, /config=\{cloudConfig\}/);
  assert.match(regionalPageSource, /playback=\{cloudPlayback\}/);
  assert.match(cloudLayerSource, /sceneId === normalized\.sceneId/);
  assert.match(cloudLayerSource, /timeOfDay === normalized\.timeOfDay/);
  assert.match(cloudLayerSource, /requestAnimationFrame/);
  assert.match(cloudLayerSource, /MAX_FRAME_DELTA_SECONDS/);
  assert.match(cloudLayerSource, /speedPxPerSecond/);
  assert.match(cloudLayerSource, /dataset\.cloudSpeed/);
  assert.match(cloudLayerSource, /dataset\.cloudBottom/);
  assert.match(cloudLayerSource, /skyMaxBottomY - heightPx/);
  assert.match(cloudLayerSource, /met-regional-clouds__sky-clip/);
  assert.match(cloudLayerSource, /publicAssetUrl\(cloud\.asset\)/);
  assert.match(foregroundLayerSource, /publicAssetUrl\(assetPath\)/);
  assert.match(foregroundLayerSource, /availableTimeModes/);
  assert.match(foregroundLayerSource, /met-regional-foreground-depth/);
  assert.doesNotMatch(regionalPageSource, /oil-rig-background-day\.png.*cloud/i);
  assert.match(cssSource, /\.met-regional-clouds/);
  assert.match(cssSource, /\.met-regional-clouds__sky-line/);
  assert.match(cssSource, /\.met-regional-foreground-depth/);
});

test("developer controls are available in both regional scene and ocean dev preview", () => {
  for (const token of ["Cloud Motion Preview", "Natural", "Visible", "Exaggerated", "Wind Direction Presets", "← West", "→ East", "↑ North", "↓ South", "Wind Direction", "Wind Speed", "Global Speed", "Cloud Density", "Cloud Opacity", "Parallax", "Restart", "Reduced Motion:", "Ignore Reduced Motion for Preview", "Show Motion Trail", "Show Cloud Sky Bounds", "Rig Depth Mask", "Show rig mask bounds", "Preset:"]) {
    assert.match(regionalPageSource, new RegExp(token));
  }
  for (const token of ["Clouds", "Global Cloud Speed", "Animation Speed", "Show cloud bounds/debug boxes", "Show Motion Trail", "Show Cloud Sky Bounds", "Rig Depth Mask", "Show rig mask bounds", "Natural", "Visible", "Exaggerated", "Oil Rig Day"]) {
    assert.match(oceanDevPageSource, new RegExp(token));
  }
  assert.match(oceanDevPageSource, /<RegionalCloudAtmosphereLayer/);
  assert.match(oceanDevPageSource, /<RegionalForegroundDepthLayer/);
});
