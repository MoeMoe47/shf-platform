import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { METAVERSE_DEV_CAPABILITIES, validateMetaverseDevCapabilities } from "../src/system/metaverse/metaverseDevCapabilities.js";
import { METAVERSE_WEATHER_MODES, createMetaverseEnvironmentConfig, applyMetaverseWeatherPreset } from "../src/system/metaverse/metaverseEnvironmentRuntime.js";

const consoleSource = readFileSync(new URL("../src/components/metaverse/MetaverseDevConsole.jsx", import.meta.url), "utf8");
const regionalSource = readFileSync(new URL("../src/pages/metaverse/MetaverseRegionalScenePage.jsx", import.meta.url), "utf8");
const citySource = readFileSync(new URL("../src/pages/metaverse/MetaverseCityPage.jsx", import.meta.url), "utf8");

test("registered scene capabilities validate and contextual sections are filtered", () => {
  for (const [sceneId, capabilities] of Object.entries(METAVERSE_DEV_CAPABILITIES)) assert.deepEqual(validateMetaverseDevCapabilities(capabilities), { valid: true, errors: [] }, sceneId);
  assert.equal(validateMetaverseDevCapabilities({ imaginarySystem: true }).valid, false);
  assert.match(consoleSource, /getEnabledMetaverseDevSections/);
  assert.match(consoleSource, /data-metaverse-dev-console/);
  assert.match(regionalSource, /capabilities=\{capabilities\}/);
  assert.match(citySource, /<MetaverseDevConsole/);
});

test("weather runtime presets normalize shared wind and precipitation state", () => {
  assert.ok(METAVERSE_WEATHER_MODES.includes("THUNDERSTORM"));
  const clear = createMetaverseEnvironmentConfig();
  const rain = applyMetaverseWeatherPreset(clear, "RAIN");
  assert.equal(rain.precipitationType, "RAIN");
  assert.equal(rain.precipitationEnabled, true);
  assert.ok(rain.precipitationIntensity > 0);
  assert.equal(typeof rain.windDirection, "number");
  assert.equal(typeof rain.visibility, "number");
});

test("weather renderer and regional ocean expose shared environmental integration", () => {
  const layer = readFileSync(new URL("../src/components/metaverse/MetaverseWeatherEnvironmentLayer.jsx", import.meta.url), "utf8");
  const ocean = readFileSync(new URL("../src/components/metaverse/RegionalOceanSurfaceLayer.jsx", import.meta.url), "utf8");
  assert.match(layer, /data-weather-layer/);
  assert.match(layer, /precipitationType/);
  assert.match(ocean, /uRain/);
  assert.match(ocean, /environmentRef/);
});
