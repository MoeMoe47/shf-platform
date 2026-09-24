import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  METAVERSE_CAMERA_WORLD_OVERSCAN,
  METAVERSE_SCENE_IMAGE_ASPECT_RATIO,
  computeMetaverseCameraWorldRect,
  resolveSourceImageFraction,
} from "../src/system/metaverse/metaverseCameraProjection.js";

const cameraSource = readFileSync(new URL("../src/components/metaverse/MetaverseCamera.jsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");

const IMAGE_WIDTH = 1672;
const IMAGE_HEIGHT = 941;

const CONTAINER_SIZES = [
  { label: "desktop-native", width: 1672, height: 941 },
  { label: "desktop-wide-1920x1080", width: 1920, height: 1080 },
  { label: "desktop-ultrawide-3440x1440", width: 3440, height: 1440 },
  { label: "desktop-square-1000x1000", width: 1000, height: 1000 },
  { label: "tablet-landscape-1024x768", width: 1024, height: 768 },
  { label: "tablet-portrait-768x1024", width: 768, height: 1024 },
  { label: "mobile-portrait-390x844", width: 390, height: 844 },
  { label: "mobile-small-320x568", width: 320, height: 568 },
];

test("MET-15A world rect always keeps the source-image aspect ratio", () => {
  for (const { label, width, height } of CONTAINER_SIZES) {
    const rect = computeMetaverseCameraWorldRect({ containerWidth: width, containerHeight: height });
    const rectAspect = rect.width / rect.height;
    assert.ok(
      Math.abs(rectAspect - METAVERSE_SCENE_IMAGE_ASPECT_RATIO) < 1e-9,
      `${label}: rect aspect ${rectAspect} should equal image aspect ${METAVERSE_SCENE_IMAGE_ASPECT_RATIO}`,
    );
  }
});

test("MET-15A world rect always covers its container (no letterbox gap)", () => {
  for (const { label, width, height } of CONTAINER_SIZES) {
    const rect = computeMetaverseCameraWorldRect({ containerWidth: width, containerHeight: height, overscan: 1 });
    assert.ok(rect.width >= width - 1e-6, `${label}: rect width ${rect.width} should cover container width ${width}`);
    assert.ok(rect.height >= height - 1e-6, `${label}: rect height ${rect.height} should cover container height ${height}`);
  }
});

test("MET-15A world rect is centered on its container", () => {
  for (const { label, width, height } of CONTAINER_SIZES) {
    const rect = computeMetaverseCameraWorldRect({ containerWidth: width, containerHeight: height });
    assert.ok(Math.abs(rect.left - (width - rect.width) / 2) < 1e-6, `${label}: left not centered`);
    assert.ok(Math.abs(rect.top - (height - rect.height) / 2) < 1e-6, `${label}: top not centered`);
  }
});

test("MET-15A default overscan matches the documented constant", () => {
  const { width, height } = CONTAINER_SIZES[0];
  const base = computeMetaverseCameraWorldRect({ containerWidth: width, containerHeight: height, overscan: 1 });
  const overscanned = computeMetaverseCameraWorldRect({ containerWidth: width, containerHeight: height });
  assert.ok(Math.abs(overscanned.width / base.width - METAVERSE_CAMERA_WORLD_OVERSCAN) < 1e-9);
  assert.ok(Math.abs(overscanned.height / base.height - METAVERSE_CAMERA_WORLD_OVERSCAN) < 1e-9);
});

test("MET-15A a normalized marker coordinate resolves to the same source-image fraction across every container size", () => {
  const landmarks = [
    { x: 10, y: 20 },
    { x: 28, y: 39 },
    { x: 50, y: 50 },
    { x: 65, y: 36 },
    { x: 90, y: 80 },
  ];
  for (const point of landmarks) {
    const fractions = CONTAINER_SIZES.map(({ width, height }) => {
      const rect = computeMetaverseCameraWorldRect({ containerWidth: width, containerHeight: height, overscan: 1 });
      return resolveSourceImageFraction(point, rect, { imageWidth: IMAGE_WIDTH, imageHeight: IMAGE_HEIGHT });
    });
    const [first, ...rest] = fractions;
    for (const fraction of rest) {
      assert.ok(Math.abs(fraction.fractionX - first.fractionX) < 1e-9, `x drift for point ${JSON.stringify(point)}`);
      assert.ok(Math.abs(fraction.fractionY - first.fractionY) < 1e-9, `y drift for point ${JSON.stringify(point)}`);
    }
    assert.ok(Math.abs(first.fractionX - point.x / 100) < 1e-9);
    assert.ok(Math.abs(first.fractionY - point.y / 100) < 1e-9);
  }
});

test("MET-15A resolveSourceImageFraction independently reproduces cover-crop drift for a non-aspect-locked rect (regression guard)", () => {
  // A rect that does NOT match the image aspect ratio (the pre-MET-15A
  // .met-camera__markers box: exactly the container, not image-aspect-locked)
  // must show the drift this fix removes, proving the test above is not
  // vacuously true for any rect.
  const point = { x: 50, y: 50 };
  const wide = resolveSourceImageFraction(point, { width: 1920, height: 1080 }, { imageWidth: IMAGE_WIDTH, imageHeight: IMAGE_HEIGHT });
  const tall = resolveSourceImageFraction(point, { width: 390, height: 844 }, { imageWidth: IMAGE_WIDTH, imageHeight: IMAGE_HEIGHT });
  // At dead center (50/50) cover-crop still lands on center regardless of
  // aspect ratio, so use an off-center point to actually detect drift.
  const offCenter = { x: 15, y: 30 };
  const wideOff = resolveSourceImageFraction(offCenter, { width: 1920, height: 1080 }, { imageWidth: IMAGE_WIDTH, imageHeight: IMAGE_HEIGHT });
  const tallOff = resolveSourceImageFraction(offCenter, { width: 390, height: 844 }, { imageWidth: IMAGE_WIDTH, imageHeight: IMAGE_HEIGHT });
  assert.notEqual(wideOff.fractionX, tallOff.fractionX);
  assert.ok(wide.fractionX !== undefined && tall.fractionX !== undefined);
});

test("MET-15A MetaverseCamera applies one shared computed rect to both the world and markers boxes", () => {
  assert.match(cameraSource, /computeMetaverseCameraWorldRect/);
  assert.match(cameraSource, /worldBoxStyle/);
  assert.match(cameraSource, /className="met-camera__world"[\s\S]{0,120}\.\.\.worldBoxStyle/);
  assert.match(cameraSource, /className="met-camera__markers"[\s\S]{0,60}\.\.\.worldBoxStyle/);
});

test("MET-15A metaverse-city.css no longer hardcodes the mismatched -8%/0 inset pair", () => {
  assert.doesNotMatch(cssSource, /\.met-camera__world\s*\{[^}]*inset:\s*-8%/);
  assert.doesNotMatch(cssSource, /\.met-camera__markers\s*\{[^}]*inset:\s*0/);
});
