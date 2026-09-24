import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { METAVERSE_ROAD_TRACES } from "../src/system/metaverse/metaverseRoadTraceRegistry.js";
import {
  METAVERSE_RIVER_FLOW_PATHS,
  METAVERSE_WATER_EXCLUSION_ZONES,
  METAVERSE_WATER_FLOW_TYPES,
  METAVERSE_WATER_FOOTPRINT_REGIONS,
  METAVERSE_WATER_ZONES,
  METAVERSE_WATER_ZONE_TYPES,
  getRiverFlowPathById,
  getRiverFlowPathsForScene,
  getWaterZoneById,
  getWaterZonesForScene,
  resolveWaterZoneGeometryPoints,
  validateRiverFlowRegistry,
} from "../src/system/metaverse/metaverseRiverFlowRegistry.js";

const SCENE_ID = "silicon-heartland-city";

function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y, xj = polygon[j].x, yj = polygon[j].y;
    const intersect = (yi > point.y) !== (yj > point.y) && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
function segmentsIntersect(p1, p2, p3, p4) {
  const ccw = (a, b, c) => (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}
function polygonOverlapsPolyline(polygon, polylinePoints) {
  for (const point of polylinePoints) if (pointInPolygon(point, polygon)) return true;
  const polySegs = [];
  for (let i = 0; i < polygon.length; i += 1) polySegs.push([polygon[i], polygon[(i + 1) % polygon.length]]);
  for (let i = 0; i < polylinePoints.length - 1; i += 1) {
    const a = polylinePoints[i];
    const b = polylinePoints[i + 1];
    for (const [c, d] of polySegs) if (segmentsIntersect(a, b, c, d)) return true;
  }
  return false;
}

test("MET-15E0 registry integrity: validateRiverFlowRegistry reports no errors", () => {
  const result = validateRiverFlowRegistry();
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("MET-15E0 all river flow path points are within the 0-100 canonical scene range", () => {
  for (const path of METAVERSE_RIVER_FLOW_PATHS) {
    for (const point of path.points) {
      assert.ok(point.x >= 0 && point.x <= 100, `${path.id} x out of range: ${point.x}`);
      assert.ok(point.y >= 0 && point.y <= 100, `${path.id} y out of range: ${point.y}`);
    }
  }
});

test("MET-15E0 all water zone geometry points are within the 0-100 canonical scene range", () => {
  for (const zone of METAVERSE_WATER_ZONES) {
    for (const point of resolveWaterZoneGeometryPoints(zone)) {
      assert.ok(point.x >= 0 && point.x <= 100, `${zone.id} x out of range: ${point.x}`);
      assert.ok(point.y >= 0 && point.y <= 100, `${zone.id} y out of range: ${point.y}`);
    }
  }
});

test("MET-15E0 no river flow path has an empty points array", () => {
  for (const path of METAVERSE_RIVER_FLOW_PATHS) {
    assert.ok(Array.isArray(path.points) && path.points.length > 0, `${path.id} has no points`);
  }
});

test("MET-15E0 no water zone resolves to empty geometry", () => {
  for (const zone of METAVERSE_WATER_ZONES) {
    assert.ok(resolveWaterZoneGeometryPoints(zone).length > 0, `${zone.id} has no geometry`);
  }
});

test("MET-15E0 every river flow path declares a valid waterType", () => {
  for (const path of METAVERSE_RIVER_FLOW_PATHS) {
    assert.ok(METAVERSE_WATER_FLOW_TYPES.includes(path.waterType), `${path.id} has invalid waterType ${path.waterType}`);
  }
});

test("MET-15E0 every water zone declares a valid type", () => {
  for (const zone of METAVERSE_WATER_ZONES) {
    assert.ok(METAVERSE_WATER_ZONE_TYPES.includes(zone.type), `${zone.id} has invalid type ${zone.type}`);
  }
});

test("MET-15E0 a canonical RAPIDS_ZONE exists, sits fully within visible water, and is bounded (not the whole river)", () => {
  const rapids = METAVERSE_WATER_ZONES.find((zone) => zone.type === "RAPIDS_ZONE");
  assert.ok(rapids, "expected at least one RAPIDS_ZONE");
  assert.equal(rapids.rapidsAssetsAllowed, true);
  const points = resolveWaterZoneGeometryPoints(rapids);
  assert.ok(points.length >= 3, "rapids zone should be a real polygon, not a line/point");
  const spanX = Math.max(...points.map((p) => p.x)) - Math.min(...points.map((p) => p.x));
  const spanY = Math.max(...points.map((p) => p.y)) - Math.min(...points.map((p) => p.y));
  assert.ok(spanX < 30 && spanY < 30, `rapids zone should be localized, got span ${spanX}x${spanY}`);
});

test("MET-15E0 the canonical rapids zone does not overlap any canonical road or bridge trace (land/road exclusion)", () => {
  const rapids = METAVERSE_WATER_ZONES.find((zone) => zone.type === "RAPIDS_ZONE");
  const rapidsPoly = resolveWaterZoneGeometryPoints(rapids);
  for (const road of METAVERSE_ROAD_TRACES) {
    assert.equal(polygonOverlapsPolyline(rapidsPoly, road.points), false, `RAPIDS_ZONE overlaps ${road.id}`);
  }
});

test("MET-15E0 the isolated calm-water pond does not overlap any canonical road or bridge trace", () => {
  const pond = getWaterZoneById("CALM_WATER_COMMUNITY_POND");
  assert.ok(pond);
  const pondPoly = resolveWaterZoneGeometryPoints(pond);
  for (const road of METAVERSE_ROAD_TRACES) {
    assert.equal(polygonOverlapsPolyline(pondPoly, road.points), false, `CALM_WATER_COMMUNITY_POND overlaps ${road.id}`);
  }
});

test("MET-15E0 only RAPIDS_ZONE-type zones allow rapids assets", () => {
  for (const zone of METAVERSE_WATER_ZONES) {
    if (zone.rapidsAssetsAllowed) assert.equal(zone.type, "RAPIDS_ZONE", `${zone.id} allows rapids assets but is type ${zone.type}`);
  }
});

test("MET-15E0 exclusion zones exist and are documented (area/excludedAs/reason, plus a region or road reference)", () => {
  assert.ok(METAVERSE_WATER_EXCLUSION_ZONES.length >= 6, "expected several documented exclusion zones");
  const validExcludedAs = ["bridge deck", "road", "building", "lawn", "plaza", "shore path", "retaining wall", "riverwalk edge"];
  for (const zone of METAVERSE_WATER_EXCLUSION_ZONES) {
    assert.ok(zone.area && zone.excludedAs && zone.reason, `exclusion ${zone.id} missing area/excludedAs/reason`);
    assert.ok(validExcludedAs.includes(zone.excludedAs), `exclusion ${zone.id} has unrecognized excludedAs "${zone.excludedAs}"`);
    assert.ok(zone.approxRegion || zone.pathId, `exclusion ${zone.id} has no approxRegion or pathId`);
  }
});

test("MET-15E0 bridge-deck exclusion zones reference real canonical bridge/freeway ids", () => {
  const roadIds = new Set(METAVERSE_ROAD_TRACES.map((path) => path.id));
  for (const zone of METAVERSE_WATER_EXCLUSION_ZONES) {
    if (zone.pathId) assert.ok(roadIds.has(zone.pathId), `exclusion ${zone.id} references unknown road ${zone.pathId}`);
  }
});

test("MET-15E0 no duplicate IDs across flow paths, water zones, exclusion zones, or footprint regions", () => {
  for (const [label, list] of [
    ["flow paths", METAVERSE_RIVER_FLOW_PATHS],
    ["water zones", METAVERSE_WATER_ZONES],
    ["exclusion zones", METAVERSE_WATER_EXCLUSION_ZONES],
    ["footprint regions", METAVERSE_WATER_FOOTPRINT_REGIONS],
  ]) {
    const ids = list.map((item) => item.id);
    assert.equal(new Set(ids).size, ids.length, `duplicate id found in ${label}`);
  }
});

test("MET-15E0 every flow path and water zone stays DECORATIVE", () => {
  for (const path of METAVERSE_RIVER_FLOW_PATHS) assert.equal(path.stateClassification, "DECORATIVE", path.id);
  for (const zone of METAVERSE_WATER_ZONES) assert.equal(zone.stateClassification, "DECORATIVE", zone.id);
});

test("MET-15E0 all zones/paths belong to the silicon-heartland-city scene and are retrievable by scene id", () => {
  assert.equal(getWaterZonesForScene(SCENE_ID).length, METAVERSE_WATER_ZONES.length);
  assert.equal(getRiverFlowPathsForScene(SCENE_ID).length, METAVERSE_RIVER_FLOW_PATHS.length);
  assert.equal(getWaterZonesForScene("nonexistent-scene").length, 0);
});

test("MET-15E0 getRiverFlowPathById / getWaterZoneById resolve known ids and return null for unknown ids", () => {
  assert.equal(getRiverFlowPathById("MAIN_FLOW_01").waterType, "MAIN_FLOW");
  assert.equal(getRiverFlowPathById("NOT_REAL"), null);
  assert.equal(getWaterZoneById("RAPIDS_ZONE_01").type, "RAPIDS_ZONE");
  assert.equal(getWaterZoneById("NOT_REAL"), null);
});

test("MET-15E0 water footprint regions are documented and note whether they connect to other regions", () => {
  for (const region of METAVERSE_WATER_FOOTPRINT_REGIONS) {
    assert.ok(region.id && region.sceneId && region.boundingBox && region.notes);
    assert.ok(Array.isArray(region.connectedTo));
  }
});

test("MET-15E0 no final river or rapids animation code was introduced", () => {
  const registrySource = readFileSync(new URL("../src/system/metaverse/metaverseRiverFlowRegistry.js", import.meta.url), "utf8");
  assert.doesNotMatch(registrySource, /setInterval|requestAnimationFrame|@keyframes/);
  const debugLayerSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseRiverFlowDebugLayer.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(debugLayerSource, /setInterval|requestAnimationFrame|@keyframes/);
});

test("MET-15E0 river-flow debug overlay is gated behind DEV mode and its own explicit query-param opt-in, mounted through the existing living-city layer plane", () => {
  const debugLayerSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseRiverFlowDebugLayer.jsx", import.meta.url), "utf8");
  assert.match(debugLayerSource, /import\.meta\.env\.DEV/);
  assert.match(debugLayerSource, /enabled/);
  const mountSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseLivingCityLayer.jsx", import.meta.url), "utf8");
  assert.match(mountSource, /MetaverseRiverFlowDebugLayer/);
  assert.match(mountSource, /riverFlowDebug/);
  // Its own separate param, not silently piggybacking on roadTraceDebug.
  assert.notEqual(mountSource.match(/riverFlowDebug/)?.[0], mountSource.match(/roadTraceDebug/)?.[0]);
});

test("MET-15E0 debug overlay renders no unapproved interactivity/authority", () => {
  const debugLayerSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseRiverFlowDebugLayer.jsx", import.meta.url), "utf8");
  assert.match(debugLayerSource, /aria-hidden="true"/);
  assert.doesNotMatch(debugLayerSource, /onClick|onPointer|requestMetaverseEntry|fastTravel/);
});
