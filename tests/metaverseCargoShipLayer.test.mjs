import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  CARGO_SHIP_ASSET_BASE,
  CARGO_SHIP_ASSETS,
  OIL_RIG_DAY_CARGO_SHIP_PRESET,
  cloneCargoShipSceneConfig,
  resolveRenderableCargoShips,
  resolveCargoShipWindVector,
  validateCargoShipSceneConfig,
} from "../src/system/metaverse/cargoShipRegistry.js";

const pageSource = readFileSync(new URL("../src/pages/metaverse/MetaverseRegionalScenePage.jsx", import.meta.url), "utf8");
const layerSource = readFileSync(new URL("../src/components/metaverse/RegionalCargoShipLayer.jsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");

test("Oil Rig DAY cargo ship preset is valid and renders a restrained three-ship corridor by default", () => {
  assert.equal(OIL_RIG_DAY_CARGO_SHIP_PRESET.id, "oil-rig-day-cargo-ships");
  assert.equal(OIL_RIG_DAY_CARGO_SHIP_PRESET.sceneId, "oil-rig");
  assert.deepEqual(validateCargoShipSceneConfig(OIL_RIG_DAY_CARGO_SHIP_PRESET), { valid: true, errors: [] });
  assert.equal(OIL_RIG_DAY_CARGO_SHIP_PRESET.shipCount, 3);
  assert.equal(OIL_RIG_DAY_CARGO_SHIP_PRESET.globalSpeed, 0.48);
  const result = resolveRenderableCargoShips(OIL_RIG_DAY_CARGO_SHIP_PRESET);
  assert.equal(result.ships.length, 3);
  assert.deepEqual(result.ships.map((ship) => ship.depth), ["far", "mid", "far"]);
  const eastboundFarX = result.ships[0].route.controlPoints[0].x
    + (result.ships[0].route.controlPoints.at(-1).x - result.ships[0].route.controlPoints[0].x) * result.ships[0].phase;
  const midCorridorX = result.ships[1].route.controlPoints[0].x
    + (result.ships[1].route.controlPoints.at(-1).x - result.ships[1].route.controlPoints[0].x) * result.ships[1].phase;
  const westboundFarX = result.ships[2].route.controlPoints[0].x
    + (result.ships[2].route.controlPoints.at(-1).x - result.ships[2].route.controlPoints[0].x) * result.ships[2].phase;
  assert.ok(eastboundFarX > 45 && eastboundFarX < 55, "left far ship starts in open water left of the rig");
  assert.ok(midCorridorX > 20 && midCorridorX < 35, "mid ship starts in open water on the left corridor");
  assert.ok(westboundFarX > 78 && westboundFarX < 92, "right far ship starts on the westbound corridor");
  assert.ok(result.ships[0].widthPx < result.ships[1].widthPx);
  assert.ok(result.ships[2].widthPx < result.ships[1].widthPx);
});

test("cargo ship routes keep slow mixed-direction maritime traffic", () => {
  const [eastboundFar, westboundFar, midCorridor] = OIL_RIG_DAY_CARGO_SHIP_PRESET.routes;
  assert.ok(eastboundFar.speedPxPerSecond <= 1.9);
  assert.ok(westboundFar.speedPxPerSecond <= 1.6);
  assert.ok(midCorridor.speedPxPerSecond <= 2.25);
  assert.ok(eastboundFar.controlPoints[0].x < eastboundFar.controlPoints.at(-1).x);
  assert.ok(westboundFar.controlPoints[0].x > westboundFar.controlPoints.at(-1).x);
  assert.ok(midCorridor.controlPoints[0].x < midCorridor.controlPoints.at(-1).x);
  assert.ok(eastboundFar.controlPoints[0].y < midCorridor.controlPoints[0].y);
  assert.ok(westboundFar.controlPoints[0].y < midCorridor.controlPoints[0].y);
});

test("registry uses all four supplied cargo ship PNGs", () => {
  const assets = Object.values(CARGO_SHIP_ASSETS);
  assert.equal(assets.length, 4);
  for (const asset of assets) {
    assert.ok(asset.path.startsWith(CARGO_SHIP_ASSET_BASE));
    assert.match(asset.path, /\/[1-4]\.png$/);
    assert.equal(existsSync(asset.path), true, asset.path);
    assert.ok(asset.waterline > 0.6 && asset.waterline < 0.8);
  }
});

test("ship count and depth toggles resolve without changing route definitions", () => {
  const config = cloneCargoShipSceneConfig(OIL_RIG_DAY_CARGO_SHIP_PRESET);
  config.shipCount = 1;
  config.showFarShips = false;
  const result = resolveRenderableCargoShips(config);
  assert.equal(result.ships.length, 1);
  assert.equal(result.ships[0].depth, "mid");
  assert.equal(result.routes.length, 3);
});

test("wind vector follows shared environmental convention", () => {
  assert.ok(resolveCargoShipWindVector(270).x < 0);
  assert.ok(resolveCargoShipWindVector(90).x > 0);
});

test("regional page mounts cargo ships between clouds and rig-depth birds", () => {
  assert.match(pageSource, /RegionalCargoShipLayer/);
  assert.match(pageSource, /OIL_RIG_DAY_CARGO_SHIP_PRESET/);
  assert.match(pageSource, /Cargo Ships/);
  assert.match(pageSource, /Show Routes/);
  assert.match(pageSource, /Show Ship Bounds/);
  assert.match(pageSource, /Randomize Ships/);
  assert.match(pageSource, /Reset Ships/);
  assert.ok(pageSource.indexOf("<RegionalCloudAtmosphereLayer") < pageSource.indexOf("<RegionalCargoShipLayer"));
  assert.ok(pageSource.indexOf("<RegionalCargoShipLayer") < pageSource.indexOf('depthMode="behindRig"'));
});

test("cargo ship layer uses RAF motion, waterline anchoring, and route debug tools", () => {
  assert.match(layerSource, /requestAnimationFrame/);
  assert.match(layerSource, /routePointAt/);
  assert.match(layerSource, /ship\.asset\.waterline/);
  assert.match(layerSource, /dataset\.shipSpeed/);
  assert.match(layerSource, /publicAssetUrl\(ship\.asset\.path\)/);
  assert.match(cssSource, /\.met-regional-cargo-ships/);
  assert.match(cssSource, /\.met-regional-cargo-ships__route/);
  assert.match(cssSource, /\.met-regional-cargo-ship__waterline/);
});
