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
const failingDraftRing = [
  [90.05902594629895, 89.93067590987869],
  [95.91038103132142, 20.48602215356793],
  [52.09683787330771, 91.15943598824505],
  [8.975962625273151, 90.12357772586843],
  [17.720844950141913, 21.064727601537186],
  [51.80016577499811, 20.678923969557683],
  [95.84608042599152, 20.389571245573055],
  [52.09683787330771, 91.15943598824505],
  [89.69847317459121, 90.3039169052822],
  [89.67322231431945, 90.22002863386331],
  [90.05902594629895, 89.93067590987869],
];
const failingDraftGeometry = { type: "Polygon", coordinates: [failingDraftRing] };
const clockwiseSixPoint = { type: "Polygon", coordinates: [[[10, 10], [90, 10], [90, 50], [70, 90], [30, 90], [10, 50], [10, 10]]] };
const counterClockwiseSixPoint = { type: "Polygon", coordinates: [[[10, 10], [10, 50], [30, 90], [70, 90], [90, 50], [90, 10], [10, 10]]] };

function independentOrientation(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function independentOnSegment(a, b, point) {
  return Math.abs(independentOrientation(a, b, point)) <= 1e-9
    && point[0] >= Math.min(a[0], b[0]) - 1e-9
    && point[0] <= Math.max(a[0], b[0]) + 1e-9
    && point[1] >= Math.min(a[1], b[1]) - 1e-9
    && point[1] <= Math.max(a[1], b[1]) + 1e-9;
}

function independentlyIntersects(a, b, c, d) {
  const first = [independentOrientation(a, b, c), independentOrientation(a, b, d)];
  const second = [independentOrientation(c, d, a), independentOrientation(c, d, b)];
  const crosses = (values) => values[0] > 1e-9 && values[1] < -1e-9 || values[0] < -1e-9 && values[1] > 1e-9;
  return (crosses(first) && crosses(second))
    || (Math.abs(first[0]) <= 1e-9 && independentOnSegment(a, b, c))
    || (Math.abs(first[1]) <= 1e-9 && independentOnSegment(a, b, d))
    || (Math.abs(second[0]) <= 1e-9 && independentOnSegment(c, d, a))
    || (Math.abs(second[1]) <= 1e-9 && independentOnSegment(c, d, b));
}

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
test("independent audit finds the supplied DRAFT segment intersection", () => {
  const edges = failingDraftRing.slice(0, -1).map((point, index) => [point, failingDraftRing[index + 1]]);
  const intersections = [];
  for (let left = 0; left < edges.length; left += 1) {
    for (let right = left + 1; right < edges.length; right += 1) {
      if (right === left + 1 || (left === 0 && right === edges.length - 1)) continue;
      if (independentlyIntersects(...edges[left], ...edges[right])) intersections.push([left, right]);
    }
  }
  assert.deepEqual(intersections, [[1, 6], [1, 7], [2, 6], [2, 7]]);
});
test("the supplied DRAFT coordinate sequence is rejected", () => assert.equal(validateRegionalScenePolygon({ sceneId: "oil-rig", geometry: failingDraftGeometry }).valid, false));
test("simple six-point clockwise Polygon is valid", () => assert.equal(validateRegionalScenePolygon({ sceneId: "oil-rig", geometry: clockwiseSixPoint }).valid, true));
test("simple six-point counter-clockwise Polygon is valid", () => assert.equal(validateRegionalScenePolygon({ sceneId: "oil-rig", geometry: counterClockwiseSixPoint }).valid, true));
test("repeated internal vertex is invalid", () => assert.equal(validateRegionalScenePolygon({ sceneId: "oil-rig", geometry: failingDraftGeometry }).errors.includes("non-closing vertices must not be duplicate or near-duplicate"), true));
test("near-duplicate internal vertices are invalid", () => assert.equal(validateRegionalScenePolygon({ sceneId: "oil-rig", geometry: { type: "Polygon", coordinates: [[[10, 10], [90, 10], [90, 90], [90.0000005, 90.0000005], [10, 90], [10, 10]]] } }).valid, false));
test("only the final coordinate may duplicate the first for closure", () => assert.equal(validateRegionalScenePolygon({ sceneId: "oil-rig", geometry: { type: "Polygon", coordinates: [[[10, 10], [90, 10], [90, 90], [10, 90], [10, 10], [30, 30], [10, 10]]] } }).valid, false));
test("geometry hash is deterministic", () => assert.equal(hashRegionalSceneGeometry(square), hashRegionalSceneGeometry(JSON.parse(JSON.stringify(square)))));
test("geometry hash changes when a vertex changes", () => assert.notEqual(hashRegionalSceneGeometry(square), hashRegionalSceneGeometry({ ...square, coordinates: [[[10, 10], [91, 10], [90, 90], [10, 90], [10, 10]]] })));
