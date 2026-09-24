import assert from "node:assert/strict";
import test from "node:test";

import {
  CANONICAL_DESTINATION_IDS,
  createDestinationReference,
  getCanonicalDestinationId,
  isCanonicalDestinationId,
  validateCanonicalDestinationReferences,
} from "../src/system/metaverse/metaverseCanonicalDestinationRegistry.js";
import {
  METAVERSE_FACILITIES,
  getDestinationById,
  getFacilityById,
} from "../src/system/metaverse/metaverseNavigationModel.js";
import {
  MINIMAP_LOCATION_REGISTRY,
  validateMiniMapCanonicalReferences,
} from "../src/system/metaverse/metaverseMiniMapRegistry.js";
import {
  getRegionalSceneDestinationReference,
  REGIONAL_ROUTE_SEQUENCE,
} from "../src/system/metaverse/regionalSceneRegistry.js";

test("canonical destination projection is unique and explicit", () => {
  assert.equal(CANONICAL_DESTINATION_IDS.length, 36);
  assert.equal(new Set(CANONICAL_DESTINATION_IDS).size, CANONICAL_DESTINATION_IDS.length);
  assert.equal(isCanonicalDestinationId("career-center"), true);
  assert.equal(isCanonicalDestinationId("career centre"), false);
});

test("known historical identifiers resolve without fuzzy matching", () => {
  assert.equal(getCanonicalDestinationId("public-works"), "public-works-office");
  assert.equal(getCanonicalDestinationId("park"), "city-park");
  assert.equal(getCanonicalDestinationId("student-profile-access"), "student-profile-portfolio-access");
  assert.equal(getCanonicalDestinationId("Public Works"), null);
  assert.equal(getCanonicalDestinationId("unknown-place"), null);
});

test("frontend facility compatibility preserves legacy keys and exposes canonical references", () => {
  assert.equal(getFacilityById("public-works").destinationId, "public-works-office");
  assert.equal(getFacilityById("public-works-office").id, "public-works");
  assert.equal(getFacilityById("park").destinationId, "city-park");
  assert.equal(getDestinationById("student-profile-portfolio-access").destinationId, "student-profile-portfolio-access");
  assert.equal(METAVERSE_FACILITIES.every((facility) => facility.destinationId), true);
  assert.deepEqual(validateCanonicalDestinationReferences(METAVERSE_FACILITIES), []);
});

test("unknown canonical references fail safely and Quick Map infrastructure remains provisional", () => {
  assert.deepEqual(createDestinationReference("not-a-destination"), { destinationId: null });
  assert.deepEqual(validateCanonicalDestinationReferences([{ destinationId: "not-a-destination" }, { destinationId: null }]), [
    "unknown canonical destination reference: not-a-destination",
  ]);
  assert.deepEqual(validateMiniMapCanonicalReferences(), []);
  const infrastructure = MINIMAP_LOCATION_REGISTRY.filter((location) => location.category === "INFRASTRUCTURE");
  assert.equal(infrastructure.length, 6);
  assert.equal(infrastructure.every((location) => location.markerClassification === "PROVISIONAL_INFRASTRUCTURE" && location.destinationId === null), true);
});

test("regional scene identity remains separate from destination identity", () => {
  assert.deepEqual(getRegionalSceneDestinationReference("oil-rig"), { sceneId: "oil-rig", destinationId: null });
  assert.equal(REGIONAL_ROUTE_SEQUENCE.map((scene) => scene.id).includes("oil-rig"), true);
});
