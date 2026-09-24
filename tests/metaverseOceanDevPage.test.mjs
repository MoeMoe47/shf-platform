import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const cityPage = readFileSync(new URL("../src/pages/metaverse/MetaverseCityPage.jsx", import.meta.url), "utf8");
const pageSource = readFileSync(new URL("../src/pages/metaverse/OceanEngineDevPage.jsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/pages/metaverse/ocean-engine-dev.css", import.meta.url), "utf8");
const hookSource = readFileSync(new URL("../src/hooks/metaverse/useOceanMotionEditor.js", import.meta.url), "utf8");

test("ocean dev route is wired under metaverse developer routes", () => {
  assert.match(cityPage, /\/metaverse\/dev\/ocean/);
  assert.match(cityPage, /<OceanEngineDevPage/);
});

test("ocean dev page exposes scene editor, playback, debug, and persistence surfaces", () => {
  for (const token of [
    "Ocean Motion Engine",
    "DRAW_FLOW",
    "DRAW_TURBULENCE",
    "DRAW_FOAM",
    "DRAW_WAKE",
    "SceneCanvas",
    "PlaybackBar",
    "Import JSON",
    "Layer Visibility",
  ]) {
    assert.match(pageSource, new RegExp(token));
  }
});

test("ocean editor persists locally and supports import/export without backend authority", () => {
  assert.match(hookSource, /localStorage/);
  assert.match(hookSource, /exportJson/);
  assert.match(hookSource, /importJson/);
  assert.doesNotMatch(hookSource, /fetch\(/);
});

test("ocean dev UI uses a serious panel/stage layout", () => {
  assert.match(cssSource, /\.ocean-dev-shell/);
  assert.match(cssSource, /grid-template-columns: 260px minmax\(0, 1fr\) 340px/);
  assert.match(cssSource, /\.ocean-playback/);
});

