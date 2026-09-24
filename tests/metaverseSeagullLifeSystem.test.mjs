import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  OIL_RIG_DAY_SEAGULL_PRESET,
  SEAGULL_ASSET_BASE,
  SEAGULL_ASSETS,
  cloneSeagullSceneConfig,
  resolveRenderableSeagulls,
  resolveSeagullWindVector,
  validateSeagullSceneConfig,
} from "../src/system/metaverse/seagullRegistry.js";

const regionalPageSource = readFileSync(new URL("../src/pages/metaverse/MetaverseRegionalScenePage.jsx", import.meta.url), "utf8");
const layerSource = readFileSync(new URL("../src/components/metaverse/RegionalSeagullLifeLayer.jsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");

test("Oil Rig DAY seagull preset defines reusable flying paths and perch anchors", () => {
  assert.equal(OIL_RIG_DAY_SEAGULL_PRESET.id, "oil-rig-day-seagulls");
  assert.equal(OIL_RIG_DAY_SEAGULL_PRESET.sceneId, "oil-rig");
  assert.equal(OIL_RIG_DAY_SEAGULL_PRESET.timeOfDay, "DAY");
  assert.deepEqual(validateSeagullSceneConfig(OIL_RIG_DAY_SEAGULL_PRESET), { valid: true, errors: [] });
  assert.ok(OIL_RIG_DAY_SEAGULL_PRESET.flightPaths.length >= 5);
  assert.ok(OIL_RIG_DAY_SEAGULL_PRESET.perchAnchors.length >= 6);
  assert.equal(OIL_RIG_DAY_SEAGULL_PRESET.flyingInstances.length, 5);
  assert.equal(OIL_RIG_DAY_SEAGULL_PRESET.perchedInstances.length, 4);
});

test("seagull asset registry points at the prepared fauna library paths", () => {
  assert.equal(SEAGULL_ASSET_BASE, "public/assets/metaverse/fauna/seagulls");
  for (const asset of [...Object.values(SEAGULL_ASSETS.flying), ...Object.values(SEAGULL_ASSETS.perched)]) {
    assert.ok(asset.startsWith(SEAGULL_ASSET_BASE), asset);
    assert.match(asset, /sg_(fly|perch)_0[1-4]\.png$/);
  }
});

test("owner-supplied seagull source PNGs are installed in the repo", () => {
  const missing = [...Object.values(SEAGULL_ASSETS.flying), ...Object.values(SEAGULL_ASSETS.perched)].filter((asset) => !existsSync(asset));
  assert.equal(missing.length, 0, missing.join("\n"));
});

test("renderable seagulls respect count and depth toggles", () => {
  const base = resolveRenderableSeagulls(OIL_RIG_DAY_SEAGULL_PRESET);
  assert.equal(base.flying.length, 5);
  assert.equal(base.perched.length, 3);
  const config = cloneSeagullSceneConfig(OIL_RIG_DAY_SEAGULL_PRESET);
  config.flyingCount = 2;
  config.perchedCount = 1;
  config.nearFlyingEnabled = false;
  const limited = resolveRenderableSeagulls(config);
  assert.equal(limited.flying.length, 2);
  assert.equal(limited.perched.length, 1);
  assert.equal(limited.flying.some((bird) => bird.depth === "near"), false);
});

test("seagull wind vector follows shared environment convention", () => {
  const west = resolveSeagullWindVector(270);
  assert.ok(west.x < 0);
  assert.ok(Math.abs(west.y) < 0.001);
  const east = resolveSeagullWindVector(90);
  assert.ok(east.x > 0);
});

test("regional Oil Rig page mounts seagulls around the rig foreground depth mask", () => {
  assert.match(regionalPageSource, /RegionalSeagullLifeLayer/);
  assert.match(regionalPageSource, /depthMode="behindRig"/);
  assert.match(regionalPageSource, /<RegionalForegroundDepthLayer/);
  assert.match(regionalPageSource, /depthMode="frontRig"/);
  assert.match(regionalPageSource, /windDirection: cloudConfig\.windDirection/);
  assert.match(regionalPageSource, /windSpeed: cloudConfig\.windSpeed/);
  for (const token of ["Birds", "Flying Count", "Perched Count", "Wind Influence", "Glide Amount", "Flap Frequency", "Show Flight Paths", "Show Perch Anchors", "Randomize Perches", "Reset Birds"]) {
    assert.match(regionalPageSource, new RegExp(token));
  }
});

test("seagull layer uses requestAnimationFrame path following and real PNG imgs", () => {
  assert.match(layerSource, /requestAnimationFrame/);
  assert.match(layerSource, /pathPointAt/);
  assert.match(layerSource, /poseAssetFor/);
  assert.match(layerSource, /SEAGULL_ASSETS\.flying/);
  assert.match(layerSource, /SEAGULL_ASSETS\.perched/);
  assert.match(layerSource, /<img/);
  assert.match(layerSource, /onError=\{hideMissingAsset\}/);
  assert.match(cssSource, /\.met-regional-seagulls--behindRig/);
  assert.match(cssSource, /\.met-regional-seagulls--frontRig/);
  assert.match(cssSource, /\.met-regional-seagulls__path/);
  assert.match(cssSource, /\.met-regional-seagulls__anchor/);
});
