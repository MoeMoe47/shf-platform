import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const pageSource = fs.readFileSync("src/pages/metaverse/MetaverseCityPage.jsx", "utf8");
const cameraSource = fs.readFileSync("src/components/metaverse/MetaverseCamera.jsx", "utf8");
const hookSource = fs.readFileSync("src/hooks/metaverse/useMetaverseRiverTrace.js", "utf8");
const previewSource = fs.readFileSync("src/hooks/metaverse/useMetaverseRiverFlowPreview.js", "utf8");
const modelSource = fs.readFileSync("src/system/metaverse/metaverseRiverTraceModel.js", "utf8");
const overlaySource = fs.readFileSync("src/components/metaverse/MetaverseRiverTraceAuthoringOverlay.jsx", "utf8");
const panelSource = fs.readFileSync("src/components/metaverse/MetaverseRiverTraceAuthoringPanel.jsx", "utf8");

test("river trace stays behind the existing dev-only riverFlowDebug convention", () => {
  assert.match(hookSource, /params\.has\("riverFlowDebug"\)/);
  assert.match(hookSource, /isDev/);
  assert.match(pageSource, /resolveRiverTraceEnabled/);
});

test("river trace locks the live scene to Page 1 DAY and home framing", () => {
  assert.match(pageSource, /riverTraceEnabled \? "DAY"/);
  assert.match(pageSource, /cameraLevel: "CITY_OVERVIEW", districtId: null, facilityId: null/);
  assert.match(pageSource, /setLevel\("CITY_OVERVIEW"\)/);
  assert.match(pageSource, /setCamera\(CAMERA_HOME\)/);
});

test("river geometry uses the shared 0-100 camera plane and traffic spline math", () => {
  assert.match(modelSource, /sampleRouteAtProgress/);
  assert.match(modelSource, /sampleRouteSpline/);
  assert.match(overlaySource, /viewBox="0 0 100 100"/);
  assert.match(overlaySource, /getBoundingClientRect\(\)/);
  assert.match(cameraSource, /style=\{\{ \.\.\.worldBoxStyle, transform: cameraTransform \}\}/);
});

test("river preview has a single requestAnimationFrame playback loop", () => {
  assert.match(previewSource, /requestAnimationFrame\(run\)/);
  assert.match(previewSource, /Play|setStatus\("PLAYING"\)/);
  assert.match(previewSource, /resolveRiverParticlePositions/);
  assert.match(previewSource, /resolveRiverZoneAtProgress/);
  assert.match(panelSource, /Play Flow/);
  assert.match(panelSource, /Reverse Preview/);
});

test("river authoring supports centerline, banks, zones, explicit reversal, and persistence", () => {
  assert.match(modelSource, /RIVER_GEOMETRY_TYPES/);
  assert.match(modelSource, /RIVER_FLOW_ZONE_TYPES/);
  assert.match(modelSource, /reverseRiverDirection/);
  assert.match(hookSource, /localStorage\.setItem\(RIVER_TRACE_STORAGE_KEY/);
  assert.match(hookSource, /pickSelectedPointForZone/);
  assert.match(panelSource, /Left Bank/);
  assert.match(panelSource, /Right Bank/);
  assert.match(panelSource, /Save River/);
});
