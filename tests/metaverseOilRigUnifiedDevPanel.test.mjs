import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(new URL("../src/pages/metaverse/MetaverseRegionalScenePage.jsx", import.meta.url), "utf8");
const hookSource = readFileSync(new URL("../src/hooks/metaverse/useOceanMotionEditor.js", import.meta.url), "utf8");
const layerSource = readFileSync(new URL("../src/components/metaverse/RegionalOceanSurfaceLayer.jsx", import.meta.url), "utf8");

test("Oil Rig dev mode exposes one unified live-control panel", () => {
  assert.match(pageSource, /data-unified-oil-rig-dev-panel/);
  for (const section of ["Scene", "Clouds", "Ocean", "Foam & Turbulence", "Cargo Ships", "Seagulls", "Rig Depth", "Debug", "Performance"]) {
    assert.match(pageSource, new RegExp(`title=\\"${section}\\"`));
  }
  for (const control of ["Play All", "Pause All", "Restart All", "Hide All Debug", "Reset Current Section", "Reset Oil Rig DAY"]) {
    assert.match(pageSource, new RegExp(control));
  }
  assert.match(pageSource, /MetaverseDevSection/);
  assert.match(pageSource, /MetaverseWeatherDevSection/);
});

test("regional Oil Rig ocean controls use the shared editor controller", () => {
  assert.match(pageSource, /useOceanMotionEditor\(\{ initialConfig: OIL_RIG_DAY_OCEAN_PRESET, useStoredConfig: false \}\)/);
  assert.match(pageSource, /config=\{oceanController\.config\}/);
  assert.match(pageSource, /quality=\{oceanController\.playback\.quality\}/);
  assert.match(pageSource, /preview=\{oceanController\.playback\.motionPreview\}/);
  assert.match(hookSource, /initialConfig = null, useStoredConfig = true/);
  assert.match(hookSource, /useStoredConfig \? readStoredConfig\(\) : null/);
  assert.match(layerSource, /uTurbulence/);
  assert.match(layerSource, /uFoam/);
});
