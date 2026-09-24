import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  resolveMetaverseDevTimeOverride,
  resolveMetaverseTimeOfDay,
} from "../src/system/metaverse/metaverseTimeOfDay.js";

const regionalPageSource = readFileSync(new URL("../src/pages/metaverse/MetaverseRegionalScenePage.jsx", import.meta.url), "utf8");

test("regional dev scene time query override is dev-only and accepts the four canonical modes", () => {
  for (const mode of ["AUTO", "DAY", "DUSK", "NIGHT"]) {
    assert.equal(resolveMetaverseDevTimeOverride({ isDev: true, search: `?metaverseDev=1&metSceneTime=${mode}` }), mode);
  }
  assert.equal(resolveMetaverseDevTimeOverride({ isDev: false, search: "?metaverseDev=1&metSceneTime=DAY" }), null);
  assert.equal(resolveMetaverseDevTimeOverride({ isDev: true, search: "?metSceneTime=DAY" }), null);
  assert.equal(resolveMetaverseDevTimeOverride({ isDev: true, search: "?metaverseDev=1&metSceneTime=INVALID" }), null);
});

test("regional scene time override feeds the canonical resolver and exposes explicit status readouts", () => {
  assert.equal(resolveMetaverseTimeOfDay({ mode: resolveMetaverseDevTimeOverride({ isDev: true, search: "?metaverseDev=1&metSceneTime=DAY" }), date: new Date(2026, 8, 23, 22) }), "DAY");
  assert.match(regionalPageSource, /resolveMetaverseDevTimeOverride/);
  assert.match(regionalPageSource, /SCENE TIME/);
  assert.match(regionalPageSource, /AUTO TIME: \{devTimeMode === "AUTO" \? "ON" : "OFF"\}/);
  assert.match(regionalPageSource, /RESOLVED SCENE: \{resolvedTimeOfDay\}/);
  assert.match(regionalPageSource, /OVERRIDE: \{devTimeMode\}/);
  assert.match(regionalPageSource, /data-time-of-day=\{timeOfDay\.toLowerCase\(\)\}/);
});
