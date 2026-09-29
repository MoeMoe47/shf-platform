import test from "node:test";
import assert from "node:assert/strict";
import {
  imageLocalToRegionalScene,
  isRegionalSceneCoordinate,
  regionalSceneToImageLocal,
} from "../src/system/metaverse/regionalGeometry/regionalSceneCoordinate.js";
import { hashRegionalSceneGeometry } from "../src/system/metaverse/regionalGeometry/regionalSceneGeometryHash.js";
import { validateRegionalScenePolygon } from "../src/system/metaverse/regionalGeometry/regionalSceneGeometryValidator.js";

const square = { type: "Polygon", coordinates: [[[10, 10], [90, 10], [90, 90], [10, 90], [10, 10]]] };

test("coordinate origin and axes are scene-normalized", () => {
  assert.deepEqual(imageLocalToRegionalScene([0, 0], { width: 1000, height: 500 }), [0, 0]);
  assert.deepEqual(imageLocalToRegionalScene([1000, 500], { width: 1000, height: 500 }), [100, 100]);
});
test("bounds endpoints are valid", () => assert.equal(isRegionalSceneCoordinate(0) && isRegionalSceneCoordinate(100), true));
test("negative x is rejected", () => assert.equal(isRegionalSceneCoordinate(-1), false));
test("x above bounds is rejected", () => assert.equal(isRegionalSceneCoordinate(101), false));
test("negative y is rejected by point conversion validation", () => assert.equal(regionalSceneToImageLocal([-1, 50], { width: 100, height: 100 }), null));
test("non-finite values are rejected", () => assert.equal(isRegionalSceneCoordinate(Number.NaN) || isRegionalSceneCoordinate(Infinity), false));
test("image-local to normalized conversion preserves proportions", () => assert.deepEqual(imageLocalToRegionalScene([768, 512], { width: 1536, height: 1024 }), [50, 50]));
test("normalized to image-local conversion is inverse", () => assert.deepEqual(regionalSceneToImageLocal([25, 75], { width: 1536, height: 1024 }), [384, 768]));
test("conversion rejects invalid image rectangles", () => assert.equal(imageLocalToRegionalScene([1, 1], { width: 0, height: 10 }), null));
test("conversion does not clamp out-of-range image values", () => assert.deepEqual(imageLocalToRegionalScene([-10, 0], { width: 100, height: 100 }), [-10, 0]));
test("valid closed Polygon passes", () => assert.equal(validateRegionalScenePolygon({ sceneId: "oil-rig", geometry: square }).valid, true));
test("open ring fails closed", () => assert.equal(validateRegionalScenePolygon({ sceneId: "oil-rig", geometry: { ...square, coordinates: [[[10, 10], [90, 10], [90, 90], [10, 90]]] } }).valid, false));
test("insufficient vertices fail", () => assert.equal(validateRegionalScenePolygon({ sceneId: "oil-rig", geometry: { type: "Polygon", coordinates: [[[10, 10], [10, 10], [10, 10], [10, 10]]] } }).valid, false));
test("zero-area Polygon fails", () => assert.equal(validateRegionalScenePolygon({ sceneId: "oil-rig", geometry: { type: "Polygon", coordinates: [[[10, 10], [20, 20], [30, 30], [10, 10]]] } }).valid, false));
test("invalid coordinate fails", () => assert.equal(validateRegionalScenePolygon({ sceneId: "oil-rig", geometry: { type: "Polygon", coordinates: [[[10, 10], [101, 20], [20, 30], [10, 10]]] } }).valid, false));
test("wrong scene fails", () => assert.equal(validateRegionalScenePolygon({ sceneId: "open-sea", geometry: square }).valid, false));
test("unimplemented scene fails eligibility", () => assert.equal(validateRegionalScenePolygon({ sceneId: "oil-rig", geometry: square, implemented: false }).valid, false));
test("unpublishable scene fails eligibility", () => assert.equal(validateRegionalScenePolygon({ sceneId: "oil-rig", geometry: square, publishable: false }).valid, false));
test("self-intersecting Polygon fails", () => assert.equal(validateRegionalScenePolygon({ sceneId: "oil-rig", geometry: { type: "Polygon", coordinates: [[[10, 10], [90, 90], [90, 10], [10, 90], [10, 10]]] } }).valid, false));
test("geometry hash is deterministic", () => assert.equal(hashRegionalSceneGeometry(square), hashRegionalSceneGeometry(JSON.parse(JSON.stringify(square)))));
test("geometry hash changes when a vertex changes", () => assert.notEqual(hashRegionalSceneGeometry(square), hashRegionalSceneGeometry({ ...square, coordinates: [[[10, 10], [91, 10], [90, 90], [10, 90], [10, 10]]] })));
