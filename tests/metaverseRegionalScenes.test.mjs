import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  resolveMetaverseAssetVariant,
  resolveMetaverseTimeOfDay,
} from "../src/system/metaverse/metaverseTimeOfDay.js";
import {
  getImplementedRegionalSceneSlugs,
  getRegionalRouteNeighbors,
  getRegionalSceneBySlug,
  REGIONAL_ROUTE_SEQUENCE,
  REGIONAL_SCENE_CONTRACT_FIELDS,
  REGIONAL_WORLD_ORIENTATION,
  validateRegionalSceneRegistry,
} from "../src/system/metaverse/regionalSceneRegistry.js";

const pageSource = readFileSync(new URL("../src/pages/metaverse/MetaverseRegionalScenePage.jsx", import.meta.url), "utf8");
const cityPageSource = readFileSync(new URL("../src/pages/metaverse/MetaverseCityPage.jsx", import.meta.url), "utf8");
const miniMapSource = readFileSync(new URL("../src/components/metaverse/MetaverseMiniMap.jsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");

test("regional route sequence locks east-to-west geography", () => {
  assert.equal(REGIONAL_WORLD_ORIENTATION.east, "offshore ocean / oil rig");
  assert.equal(REGIONAL_WORLD_ORIENTATION.west, "Silicon Heartland city");
  assert.deepEqual(REGIONAL_ROUTE_SEQUENCE.map((stop) => stop.id), [
    "oil-rig",
    "open-sea",
    "shipping-corridor",
    "harbor-in-distance",
    "harbor-approach",
    "container-yard",
    "freight-highway",
    "farms",
    "woods",
    "river",
    "bridge",
    "mountain-region",
    "final-approach",
    "gateway",
    "silicon-heartland-city",
  ]);
});

test("oil rig scene satisfies the reusable regional scene contract", () => {
  const scene = getRegionalSceneBySlug("oil-rig");
  assert.ok(scene);
  for (const field of REGIONAL_SCENE_CONTRACT_FIELDS) assert.ok(field in scene, field);
  assert.equal(scene.order, 1);
  assert.equal(scene.previousScene, null);
  assert.equal(scene.nextScene, "open-sea");
  assert.equal(scene.travelDirection, "WEST");
  assert.equal(scene.assetStatus.day, "READY");
  assert.equal(scene.assetStatus.dusk, "READY");
  assert.equal(scene.assetStatus.night, "READY");
  assert.ok(scene.visibilityExclusions.includes("city"));
  assert.ok(scene.visibilityExclusions.includes("harbor"));
});

test("open sea scene satisfies the reusable regional scene contract", () => {
  const scene = getRegionalSceneBySlug("open-sea");
  assert.ok(scene);
  for (const field of REGIONAL_SCENE_CONTRACT_FIELDS) assert.ok(field in scene, field);
  assert.equal(scene.order, 2);
  assert.equal(scene.previousScene, "oil-rig");
  assert.equal(scene.nextScene, "shipping-corridor");
  assert.equal(scene.travelDirection, "WEST");
  assert.equal(scene.assetStatus.day, "READY");
  assert.equal(scene.assetStatus.dusk, "READY");
  assert.equal(scene.assetStatus.night, "READY");
  assert.equal(scene.assetStatus.quickMap, "READY");
  assert.ok(scene.visibilityExclusions.includes("oil rig"));
  assert.ok(scene.visibilityExclusions.includes("city"));
  assert.ok(scene.visibilityExclusions.includes("coastline"));
});

test("oil rig approved assets are installed with production-safe names", () => {
  const scene = getRegionalSceneBySlug("oil-rig");
  assert.ok(existsSync(scene.backgroundAsset.dayAsset), scene.backgroundAsset.dayAsset);
  assert.ok(existsSync(scene.backgroundAsset.duskAsset), scene.backgroundAsset.duskAsset);
  assert.ok(existsSync(scene.backgroundAsset.nightAsset), scene.backgroundAsset.nightAsset);
  assert.ok(existsSync(scene.quickMapAsset.asset), scene.quickMapAsset.asset);
  assert.ok(existsSync(scene.foregroundLayer.dayAsset), scene.foregroundLayer.dayAsset);
  assert.match(scene.backgroundAsset.dayAsset, /oil-rig-background-day\.png$/);
  assert.match(scene.backgroundAsset.duskAsset, /oil-rig-background-dusk\.png$/);
  assert.match(scene.backgroundAsset.nightAsset, /oil-rig-background-night\.png$/);
  assert.match(scene.quickMapAsset.asset, /oil-rig-quick-map\.png$/);
  assert.match(scene.foregroundLayer.dayAsset, /oil-rig-day-foreground-cutout\.png$/);
  assert.equal(scene.foregroundLayer.role, "rig-silhouette-depth-mask");
  assert.deepEqual(scene.foregroundLayer.availableTimeModes, ["DAY"]);
});

test("open sea approved time-mode assets are installed with production-safe names", () => {
  const scene = getRegionalSceneBySlug("open-sea");
  assert.ok(existsSync(scene.backgroundAsset.dayAsset), scene.backgroundAsset.dayAsset);
  assert.ok(existsSync(scene.backgroundAsset.duskAsset), scene.backgroundAsset.duskAsset);
  assert.ok(existsSync(scene.backgroundAsset.nightAsset), scene.backgroundAsset.nightAsset);
  assert.ok(existsSync(scene.quickMapAsset.asset), scene.quickMapAsset.asset);
  assert.match(scene.backgroundAsset.dayAsset, /open-sea-background-day\.png$/);
  assert.match(scene.backgroundAsset.duskAsset, /open-sea-background-dusk\.png$/);
  assert.match(scene.backgroundAsset.nightAsset, /open-sea-background-night\.png$/);
  assert.match(scene.quickMapAsset.asset, /open-sea-quick-map\.png$/);
});

test("oil rig time modes resolve directly to scene-specific assets", () => {
  const scene = getRegionalSceneBySlug("oil-rig");
  const day = resolveMetaverseAssetVariant(scene.backgroundAsset, "DAY");
  const dusk = resolveMetaverseAssetVariant(scene.backgroundAsset, "DUSK");
  const night = resolveMetaverseAssetVariant(scene.backgroundAsset, "NIGHT");
  assert.equal(day.assetPath, scene.backgroundAsset.dayAsset);
  assert.equal(dusk.assetPath, scene.backgroundAsset.duskAsset);
  assert.equal(night.assetPath, scene.backgroundAsset.nightAsset);
  assert.equal(day.fallbackUsed, false);
  assert.equal(dusk.fallbackUsed, false);
  assert.equal(night.fallbackUsed, false);
});

test("open sea time modes resolve directly to scene-specific assets", () => {
  const scene = getRegionalSceneBySlug("open-sea");
  const day = resolveMetaverseAssetVariant(scene.backgroundAsset, "DAY");
  const dusk = resolveMetaverseAssetVariant(scene.backgroundAsset, "DUSK");
  const night = resolveMetaverseAssetVariant(scene.backgroundAsset, "NIGHT");
  assert.equal(day.assetPath, scene.backgroundAsset.dayAsset);
  assert.equal(dusk.assetPath, scene.backgroundAsset.duskAsset);
  assert.equal(night.assetPath, scene.backgroundAsset.nightAsset);
  assert.equal(day.fallbackUsed, false);
  assert.equal(dusk.fallbackUsed, false);
  assert.equal(night.fallbackUsed, false);
});

test("oil rig AUTO still resolves through the global time authority, not an AUTO asset", () => {
  const scene = getRegionalSceneBySlug("oil-rig");
  const autoMode = resolveMetaverseTimeOfDay({ mode: "AUTO", date: new Date(2026, 0, 1, 18, 0, 0) });
  const resolved = resolveMetaverseAssetVariant(scene.backgroundAsset, autoMode);
  assert.equal(autoMode, "DUSK");
  assert.equal(resolved.assetPath, scene.backgroundAsset.duskAsset);
  assert.equal(scene.availableTimeModes.includes("AUTO"), false);
});

test("regional registry validates and oil rig plus open sea are implemented in canonical order", () => {
  assert.deepEqual(validateRegionalSceneRegistry(), { valid: true, errors: [] });
  assert.deepEqual(getImplementedRegionalSceneSlugs(), ["oil-rig", "open-sea"]);
  assert.equal(getRegionalRouteNeighbors("oil-rig").next.id, "open-sea");
  assert.equal(getRegionalRouteNeighbors("open-sea").previous.id, "oil-rig");
  assert.equal(getRegionalRouteNeighbors("open-sea").next.id, "shipping-corridor");
});

test("metaverse route delegates implemented regional slugs without replacing city route", () => {
  assert.match(cityPageSource, /getRegionalSceneBySlug/);
  assert.match(cityPageSource, /<MetaverseRegionalScenePage scene=\{regionalScene\} \/>/);
  assert.match(cityPageSource, /<MetaverseCityExperience \/>/);
});

test("regional scene reuses canonical time and shell systems", () => {
  assert.match(pageSource, /MetaverseSidebar/);
  assert.match(pageSource, /MetaverseCamera/);
  assert.match(pageSource, /MetaverseMiniMap/);
  assert.match(pageSource, /resolveMetaverseTimeOfDay/);
  assert.match(pageSource, /resolveMetaverseAssetVariant/);
  assert.match(pageSource, /METAVERSE_TIME_OF_DAY_MODES/);
  assert.match(pageSource, /new Image\(\)/);
  assert.match(pageSource, /getRegionalSceneBySlug/);
  assert.doesNotMatch(pageSource, /Dusk\/night scene-specific assets pending/);
});

test("regional quick map extends the canonical minimap component", () => {
  assert.match(miniMapSource, /regionalScene/);
  assert.match(miniMapSource, /Quick Map/);
  assert.match(miniMapSource, /met-regional-map__canvas/);
  assert.match(miniMapSource, /Approved Quick Map asset pending/);
  assert.match(cssSource, /\.met-regional-map__canvas img/);
  assert.match(cssSource, /object-fit:\s*contain/);
});

test("regional living-world slots exist without fake vessel artwork", () => {
  for (const slot of ["water-effects", "vessels", "rig-effects", "aircraft", "birds", "weather"]) {
    assert.match(pageSource, new RegExp(`data-layer-slot="${slot}"`));
  }
  assert.doesNotMatch(pageSource, /container ship/i);
});
