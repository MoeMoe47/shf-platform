// MINIMAP V2 — regression suite.
//
// Covers: the owner-approved top-view map asset install, the new
// location/pin registry (calibrated vs. deliberately-uncalibrated
// entries), the dev-only calibration mode, the infrastructure marker
// layer, and the "View Full Map" modal reusing the same base-map
// rendering rather than a second implementation.
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  MINIMAP_ASSET,
  MINIMAP_ASSET_DIMENSIONS,
  MINIMAP_LOCATION_REGISTRY,
  getCalibratedMiniMapLocations,
  getUncalibratedMiniMapLocations,
  resolveMiniMapCalibrationModeEnabled,
} from "../src/system/metaverse/metaverseMiniMapRegistry.js";

const miniMapSource = readFileSync(new URL("../src/components/metaverse/MetaverseMiniMap.jsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");
const assetPath = new URL("../public/assets/metaverse/minimap/silicon-heartland-metaverse-top-map.png", import.meta.url);

const REQUIRED_LABELS = [
  "Civic District",
  "Career & Education",
  "Public Realm",
  "Data Center",
  "Technology & Innovation",
  "Learning Arcade",
  "Treasury & Commerce",
  "Community",
  "Residential / Student Life",
  "Airport",
  "Hospital",
  "Police",
  "Fire",
  "Mall / Retail",
  "Marina / Harbor",
];

test("MINIMAP V2 — the approved top-view map asset is installed at the canonical path and is a real, non-trivial PNG", () => {
  assert.ok(existsSync(assetPath), "silicon-heartland-metaverse-top-map.png must exist under public/assets/metaverse/minimap/");
  const stats = statSync(assetPath);
  assert.ok(stats.size > 100000, "installed asset must be a real image file, not a stub");
  assert.equal(MINIMAP_ASSET, "public/assets/metaverse/minimap/silicon-heartland-metaverse-top-map.png");
});

test("MINIMAP V2 — MINIMAP_ASSET_DIMENSIONS matches the actual installed file's own byte content (sanity hash check against a known-good build)", () => {
  const buffer = readFileSync(assetPath);
  const hash = createHash("sha256").update(buffer).digest("hex");
  // This pins the exact approved asset — if this ever fails, the file
  // at this path was replaced/regenerated, which STEP 2's brief
  // explicitly prohibits ("do not redraw/regenerate the map").
  assert.equal(hash, "b3a50c0a1427923260870b9cd8d09db9b15c1cad327746909102aba774c2bdea");
  assert.deepEqual(MINIMAP_ASSET_DIMENSIONS, { width: 1448, height: 1086 });
});

test("MINIMAP V2 — the location registry contains all 15 required categories with the exact required labels", () => {
  assert.equal(MINIMAP_LOCATION_REGISTRY.length, 15);
  const labels = MINIMAP_LOCATION_REGISTRY.map((location) => location.label);
  for (const required of REQUIRED_LABELS) {
    assert.ok(labels.includes(required), `registry must include "${required}"`);
  }
});

test("MINIMAP V2 — every registry entry has the required shape (id/label/category/icon/x/y/calibrated/destinationRoute)", () => {
  for (const location of MINIMAP_LOCATION_REGISTRY) {
    assert.equal(typeof location.id, "string");
    assert.equal(typeof location.label, "string");
    assert.ok(["DISTRICT", "INFRASTRUCTURE"].includes(location.category));
    assert.equal(typeof location.icon, "string");
    assert.equal(typeof location.calibrated, "boolean");
    assert.ok("destinationRoute" in location);
    if (location.calibrated) {
      assert.equal(typeof location.x, "number");
      assert.equal(typeof location.y, "number");
      assert.ok(location.x >= 0 && location.x <= 100);
      assert.ok(location.y >= 0 && location.y <= 100);
    } else {
      assert.equal(location.x, null, `${location.id} is uncalibrated and must not have a guessed x`);
      assert.equal(location.y, null, `${location.id} is uncalibrated and must not have a guessed y`);
    }
  }
});

test("MINIMAP V2 — the nine canonical Silicon Heartland districts are deliberately left UNCALIBRATED (no guessed coordinates against the new map)", () => {
  const uncalibrated = getUncalibratedMiniMapLocations();
  const uncalibratedIds = uncalibrated.map((l) => l.id);
  for (const id of [
    "civic-district", "career-education-district", "public-realm", "data-center-district",
    "technology-innovation-district", "learning-arcade-district", "treasury-commerce-district",
    "community-district", "student-life-district",
  ]) {
    assert.ok(uncalibratedIds.includes(id), `${id} must be uncalibrated pending owner review`);
  }
  assert.equal(uncalibrated.length, 9);
});

test("MINIMAP V2 — the six infrastructure landmarks have a provisional (not final) calibrated position", () => {
  const calibrated = getCalibratedMiniMapLocations();
  assert.equal(calibrated.length, 6);
  for (const location of calibrated) {
    assert.equal(location.category, "INFRASTRUCTURE");
    assert.equal(location.provisional, true, `${location.id} must be flagged provisional, not asserted as final`);
    assert.equal(location.destinationRoute, null, "infrastructure markers have no real navigation target yet — must not fake one");
  }
});

test("MINIMAP V2 — dev-only calibration mode follows the same review-flag convention as every other Metaverse gate (dev build + explicit param, off by default)", () => {
  assert.equal(resolveMiniMapCalibrationModeEnabled({ isDev: false, search: "?minimapCalibrate=1" }), false);
  assert.equal(resolveMiniMapCalibrationModeEnabled({ isDev: true, search: "" }), false);
  assert.equal(resolveMiniMapCalibrationModeEnabled({ isDev: true, search: "?minimapCalibrate=1" }), true);
});

test("MINIMAP V2 — the City Map canvas paints the approved map as a background-image (never bakes markers into the PNG; no canvas-pixel drawing anywhere)", () => {
  assert.match(miniMapSource, /backgroundImage: `url\(\$\{mapAssetUrl\}\)`/);
  assert.match(miniMapSource, /const mapAssetUrl = publicAssetUrl\(MINIMAP_ASSET\);/);
  assert.doesNotMatch(miniMapSource, /<canvas|getContext\(["']2d["']\)|drawImage/, "markers must be DOM overlays, never drawn onto image pixels");
});

test("MINIMAP V2 — infrastructure markers render as non-interactive identifying pins (no onClick/navigation), separate from district markers", () => {
  assert.match(miniMapSource, /met-citymap__infra-marker/);
  assert.match(miniMapSource, /infrastructureLocations\.map\(\(location\) => \(/);
  const infraBlockMatch = miniMapSource.match(/\{?infrastructureLocations\.map\(\(location\) => \([\s\S]{0,700}?\)\)\}?/);
  assert.ok(infraBlockMatch, "infrastructure marker block must exist");
  assert.doesNotMatch(infraBlockMatch[0], /onClick/, "infrastructure markers must not be click-to-navigate targets yet (no real destination exists)");
});

test("MINIMAP V2 — \"View Full Map\" opens a modal that reuses the SAME base-map rendering function, not a second/duplicated map implementation", () => {
  assert.match(miniMapSource, /const \[fullMapOpen, setFullMapOpen\] = useState\(false\);/);
  assert.match(miniMapSource, /onClick=\{\(\) => setFullMapOpen\(true\)\}/);
  assert.match(miniMapSource, /renderMapLayers\("compact"\)/);
  assert.match(miniMapSource, /renderMapLayers\("full"\)/);
  // Only ONE definition of the district-marker loop must exist — both
  // the compact canvas and the full-map modal call the same function.
  const districtLoopOccurrences = (miniMapSource.match(/districts\.map\(\(district\) => \{/g) || []).length;
  assert.equal(districtLoopOccurrences, 1, "district markers must be defined once and reused, not duplicated for the modal");
});

test("MINIMAP V2 — the full-map modal closes via backdrop click and an explicit close button", () => {
  assert.match(miniMapSource, /className="met-citymap__modal-backdrop" onClick=\{\(\) => setFullMapOpen\(false\)\}/);
  assert.match(miniMapSource, /className="met-citymap__modal-close" onClick=\{\(\) => setFullMapOpen\(false\)\}/);
  assert.match(miniMapSource, /role="dialog"/);
  assert.match(miniMapSource, /aria-modal="true"/);
});

test("MINIMAP V2 — marker layer order matches the brief: district/location -> current student (is-you) -> event flag -> infrastructure -> legend", () => {
  const districtIdx = miniMapSource.indexOf("districts.map((district)");
  const infraIdx = miniMapSource.indexOf("infrastructureLocations.map((location)");
  const legendIdx = miniMapSource.indexOf('className="met-citymap__legend"');
  assert.ok(districtIdx > -1 && infraIdx > -1 && legendIdx > -1);
  assert.ok(districtIdx < infraIdx, "district/student/event markers must render before infrastructure markers");
  assert.ok(infraIdx < legendIdx, "infrastructure markers must render before the legend");
});

// MINIMAP V3 split the canvas into an outer clipping viewport
// (.met-citymap__canvas, fallback background-color) and an inner
// transformable layer (.met-citymap__canvas-inner, the actual
// background-image + Recenter/Fit World zoom) — see
// tests/metaverseMiniMapV3.test.mjs for the dedicated suite.
test("MINIMAP V2 — CSS keeps the canvas background image-based with a fallback color, and gives infrastructure markers a distinct (non-color-only) shape", () => {
  assert.match(cssSource, /\.met-citymap__canvas\s*\{[^}]*background-color:/s);
  assert.match(cssSource, /\.met-citymap__canvas-inner\s*\{[^}]*background-size:\s*cover;/s);
  assert.match(cssSource, /\.met-citymap__infra-marker\s*\{/);
  assert.match(cssSource, /\.met-citymap__canvas--full\s*\{/);
});
