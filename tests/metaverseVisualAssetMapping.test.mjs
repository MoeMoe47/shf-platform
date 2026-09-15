import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import {
  METAVERSE_CAMERA_LEVELS,
  METAVERSE_CAMERA_TRANSITIONS,
  METAVERSE_IMAGE_ROLE_RULES,
  METAVERSE_OVERLAY_LAYERS,
  METAVERSE_PRODUCTION_BACKGROUND_SET,
  METAVERSE_REFERENCE_ASSETS,
  METAVERSE_TARGET_ASSET_ROOT,
  METAVERSE_VISUAL_ASSET_REGISTRY,
  METAVERSE_VISUAL_ASSET_STATUSES,
  METAVERSE_VISUAL_STYLE_LOCK,
} from "../src/system/metaverse/metaverseVisualAssets.js";

const requiredDistricts = [
  "civic-district",
  "career-education-district",
  "data-center-district",
  "learning-arcade-district",
  "treasury-commerce-district",
  "technology-innovation-district",
  "community-district",
  "student-life-district",
  "public-realm",
];

test("MET-2A locks the canonical camera hierarchy", () => {
  assert.deepEqual(METAVERSE_CAMERA_LEVELS, [
    "CITY_OVERVIEW",
    "DISTRICT_VIEW",
    "FACILITY_VIEW",
    "ACTIVITY_SIMULATION_VIEW",
  ]);
});

test("MET-2A maps the minimum production background set", () => {
  assert.ok(METAVERSE_PRODUCTION_BACKGROUND_SET.some((asset) => asset.assetId === "met-city-master-overview"));
  for (const district of requiredDistricts) {
    assert.ok(
      METAVERSE_PRODUCTION_BACKGROUND_SET.some((asset) => asset.district === district),
      `Missing district background mapping for ${district}`,
    );
  }

  for (const facility of ["main-data-center", "data-center-training-lab", "innovation-lab", "student-hub"]) {
    assert.ok(
      METAVERSE_PRODUCTION_BACKGROUND_SET.some((asset) => asset.facility === facility),
      `Missing facility background mapping for ${facility}`,
    );
  }
});

test("MET-2A production targets use the canonical metaverse asset root", () => {
  for (const asset of METAVERSE_PRODUCTION_BACKGROUND_SET) {
    assert.equal(asset.productionBackground, true);
    assert.equal(asset.referenceOnly, false);
    assert.ok(asset.targetPath.startsWith(`${METAVERSE_TARGET_ASSET_ROOT}/`), asset.targetPath);
    assert.ok(METAVERSE_VISUAL_ASSET_STATUSES.includes(asset.status));
  }
});

test("MET-2A remediation marks every production background ready with an existing approved file", () => {
  for (const asset of METAVERSE_PRODUCTION_BACKGROUND_SET) {
    assert.equal(asset.status, "READY", `${asset.assetId} must be READY`);
    assert.equal(asset.peopleFree, true, `${asset.assetId} must be classified people-free`);
    assert.equal(asset.containsMockDashboardUi, false, `${asset.assetId} must not reference a mock/dashboard image`);
    assert.ok(existsSync(asset.targetPath), `${asset.targetPath} must exist`);
  }
});

test("MET-2A keeps existing repository assets as references only", () => {
  assert.ok(METAVERSE_REFERENCE_ASSETS.length >= 4);
  for (const asset of METAVERSE_REFERENCE_ASSETS) {
    assert.equal(asset.status, "REFERENCE_ONLY");
    assert.equal(asset.productionBackground, false);
    assert.equal(asset.referenceOnly, true);
  }
});

test("MET-2A image role rules prohibit baked dynamic authority", () => {
  const productionProhibitions = METAVERSE_IMAGE_ROLE_RULES.PRODUCTION_BACKGROUND.prohibited.join(" ");
  for (const term of ["dynamic names", "online counts", "chat content", "task status", "fake credentials"]) {
    assert.match(productionProhibitions, new RegExp(term, "i"));
  }
  assert.ok(METAVERSE_IMAGE_ROLE_RULES.OVERLAY_ONLY.allowed.includes("presence"));
  assert.ok(METAVERSE_IMAGE_ROLE_RULES.OVERLAY_ONLY.allowed.includes("accessibility controls"));
});

test("MET-2A defines the five visual overlay layers", () => {
  assert.deepEqual(
    METAVERSE_OVERLAY_LAYERS.map((layer) => layer.id),
    ["environment", "navigation", "presence", "activity", "system"],
  );
});

test("MET-2A transition map preserves non-authoritative camera motion", () => {
  assert.ok(METAVERSE_CAMERA_TRANSITIONS.length >= 8);
  for (const transition of METAVERSE_CAMERA_TRANSITIONS) {
    assert.ok(transition.from);
    assert.ok(transition.to);
    assert.ok(transition.trigger);
    assert.ok(transition.cameraBehavior);
    assert.ok(transition.accessibleEquivalent);
  }
  assert.ok(METAVERSE_CAMERA_TRANSITIONS.some((transition) => /MET-3/.test(String(transition.requiredUnlock))));
});

test("MET-2A visual style excludes incompatible art directions", () => {
  const exclusions = METAVERSE_VISUAL_STYLE_LOCK.exclusions.join(" ");
  assert.match(exclusions, /cartoon/i);
  assert.match(exclusions, /cyberpunk decay/i);
  assert.match(exclusions, /prominent people/i);
});

test("MET-2A registry asset IDs are unique", () => {
  const ids = METAVERSE_VISUAL_ASSET_REGISTRY.map((asset) => asset.assetId);
  assert.equal(new Set(ids).size, ids.length);
});
