import test from "node:test";
import assert from "node:assert/strict";
import {
  addOceanFlowPoint,
  advanceOceanPlayback,
  applyOceanWeatherPreset,
  createFlowPath,
  createOilRigOceanSceneConfig,
  deleteOceanFlowPoint,
  moveOceanFlowPoint,
  normalizeOceanSceneConfig,
  OIL_RIG_DAY_OCEAN_PRESET,
  parseOceanSceneConfigJson,
  resolveCombinedOceanMotion,
  sampleOceanFlowAtProgress,
  validateOceanSceneConfig,
} from "../src/system/metaverse/oceanMotionEngine.js";

test("Ocean starter scene is a valid locked oil-rig overlay config", () => {
  const scene = createOilRigOceanSceneConfig();
  const validation = validateOceanSceneConfig(scene);

  assert.equal(validation.valid, true);
  assert.equal(OIL_RIG_DAY_OCEAN_PRESET.name, "Oil Rig DAY Production Ocean Surface");
  assert.equal(scene.metadata.lockedMasterScene, true);
  assert.match(scene.backgroundImageUrl, /oil-rig-background-day\.png$/);
  assert.ok(scene.flowPaths.length >= 3);
  assert.ok(scene.turbulenceZones.length >= 3);
  assert.ok(scene.foamZones.length >= 2);
});

test("flow path helpers create, move, delete, and sample curved paths", () => {
  let path = createFlowPath({ label: "Test Current" });
  path = addOceanFlowPoint(path, { x: -10, y: 42 });
  path = addOceanFlowPoint(path, { x: 52, y: 58 });
  path = addOceanFlowPoint(path, { x: 110, y: 44 });
  path = moveOceanFlowPoint(path, 1, { x: 48, y: 60 });
  const sample = sampleOceanFlowAtProgress(path, 0.5);

  assert.equal(path.points[0].x, 0);
  assert.equal(path.points[2].x, 100);
  assert.equal(path.points[1].x, 48);
  assert.ok(sample.x > 20 && sample.x < 80);

  path = deleteOceanFlowPoint(path, 1);
  assert.equal(path.points.length, 2);
});

test("weather presets adjust global sea state while preserving editable schema", () => {
  const scene = createOilRigOceanSceneConfig();
  const rough = applyOceanWeatherPreset(scene, "Rough");

  assert.equal(rough.weatherPreset, "Rough");
  assert.ok(rough.global.speed > scene.global.speed);
  assert.ok(rough.waves.swell.amplitude > scene.waves.swell.amplitude);
  assert.equal(validateOceanSceneConfig(rough).valid, true);
});

test("playback advances with loop support and frame accounting", () => {
  const playback = { playing: true, time: 9.5, duration: 10, timeScale: 1, loop: true, frame: 4, quality: "High" };
  const next = advanceOceanPlayback(playback, 1);

  assert.ok(next.time < 1);
  assert.equal(next.frame, 5);
  assert.equal(next.playing, true);
});

test("motion sampling returns non-destructive overlay offsets", () => {
  const scene = createOilRigOceanSceneConfig();
  const sample = resolveCombinedOceanMotion(scene, { x: 50, y: 63 }, 12.5);

  assert.equal(typeof sample.offsetX, "number");
  assert.equal(typeof sample.offsetY, "number");
  assert.ok(sample.opacity >= 0);
  assert.ok(sample.turbulence > 0);
});

test("config JSON round trips through the parser and normalizer", () => {
  const scene = createOilRigOceanSceneConfig({ name: "Round Trip" });
  const parsed = parseOceanSceneConfigJson(JSON.stringify(scene));
  const normalized = normalizeOceanSceneConfig(parsed.config);

  assert.deepEqual(parsed.errors, []);
  assert.equal(normalized.name, "Round Trip");
  assert.equal(normalized.metadata.version, 1);
});
