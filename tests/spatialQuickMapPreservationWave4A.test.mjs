import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import test from "node:test";

import {
  COORDINATE_FAMILIES,
  DEFAULT_COORDINATE_SPACES,
  PUBLICATION_ELIGIBILITY_LEVELS,
  defaultCoordinateSpaceRegistry,
} from "../src/shared/spatial/index.js";
import {
  MINIMAP_ASSET,
  MINIMAP_ASSET_DIMENSIONS,
  MINIMAP_LOCATION_REGISTRY,
  QUICK_MAP_COORDINATE_SPACE,
  isNormalizedQuickMapCoordinate,
} from "../src/system/metaverse/metaverseMiniMapRegistry.js";
import {
  MASTER_CITY_COORDINATE_SPACE,
  METAVERSE_DESTINATION_RELATIONSHIPS,
} from "../src/system/metaverse/metaverseDestinationRelationshipRegistry.js";
import {
  REGIONAL_ROUTE_SEQUENCE,
  REGIONAL_SCENE_DESTINATION_REFS,
} from "../src/system/metaverse/regionalSceneRegistry.js";
import {
  DOMAINS,
  VIEWERS,
  createTestPipeline,
  featureIdFor,
  sourceRecord,
} from "./helpers/spatial/wave3bProjectionFixtures.mjs";

const miniMapSource = readFileSync(new URL("../src/components/metaverse/MetaverseMiniMap.jsx", import.meta.url), "utf8");
const cityPageSource = readFileSync(new URL("../src/pages/metaverse/MetaverseCityPage.jsx", import.meta.url), "utf8");
const regionalScenePageSource = readFileSync(new URL("../src/pages/metaverse/MetaverseRegionalScenePage.jsx", import.meta.url), "utf8");
const navigationSource = readFileSync(new URL("../src/system/metaverse/metaverseNavigationModel.js", import.meta.url), "utf8");
const assetPath = new URL(`../${MINIMAP_ASSET}`, import.meta.url);

// Test-only future client boundary. This is deliberately not imported by production code.
function createQuickMapClientFixture(results) {
  return results.filter((result) => (
    result?.status === "PROJECTED"
    && result.feature?.coordinateFamily === COORDINATE_FAMILIES.METAVERSE
    && result.feature?.coordinateSpaceId === "metaverse.quick-map"
  ));
}

test("Wave 4A asset and dimensions remain canonical", () => {
  assert.equal(existsSync(assetPath), true);
  assert.ok(statSync(assetPath).size > 100000);
  assert.deepEqual(MINIMAP_ASSET_DIMENSIONS, { width: 1448, height: 1086 });
  assert.deepEqual(QUICK_MAP_COORDINATE_SPACE, {
    id: "quick-map",
    units: "normalized-percent",
    minX: 0,
    maxX: 100,
    minY: 0,
    maxY: 100,
    sourceWidth: 1448,
    sourceHeight: 1086,
  });
});

test("Wave 4A coordinate space keeps bounded top-left normalized coordinates", () => {
  assert.equal(defaultCoordinateSpaceRegistry.get("metaverse.quick-map").space.family, COORDINATE_FAMILIES.METAVERSE);
  const quickMap = DEFAULT_COORDINATE_SPACES.find((space) => space.id === "metaverse.quick-map");
  assert.match(quickMap.origin, /top-left/i);
  assert.match(quickMap.axisOrientation, /x-right y-down/i);
  assert.match(quickMap.boundsOrRange, /0\.\.100/);
  for (const location of MINIMAP_LOCATION_REGISTRY) {
    if (location.x !== null || location.y !== null) assert.equal(isNormalizedQuickMapCoordinate(location.x, location.y), true);
  }
});

test("Wave 4A keeps master-city separate and registers no implicit transform", () => {
  assert.notEqual(MASTER_CITY_COORDINATE_SPACE.id, QUICK_MAP_COORDINATE_SPACE.id);
  assert.equal(DEFAULT_COORDINATE_SPACES.find((space) => space.id === "metaverse.quick-map").transformAvailability, "NONE");
  assert.equal(DEFAULT_COORDINATE_SPACES.find((space) => space.id === "metaverse.master-city").transformAvailability, "NONE");
  assert.equal(METAVERSE_DESTINATION_RELATIONSHIPS.every((entry) => entry.quickMap === null || entry.quickMap.coordinateSpaceId === "quick-map"), true);
});

test("Wave 4A preserves all 15 registry entries and their uncertainty", () => {
  assert.equal(MINIMAP_LOCATION_REGISTRY.length, 15);
  assert.equal(MINIMAP_LOCATION_REGISTRY.filter((entry) => entry.category === "DISTRICT").length, 9);
  assert.equal(MINIMAP_LOCATION_REGISTRY.filter((entry) => entry.category === "INFRASTRUCTURE").length, 6);
  assert.equal(MINIMAP_LOCATION_REGISTRY.filter((entry) => entry.category === "DISTRICT").every((entry) => entry.status === "UNMAPPED" && entry.x === null && entry.y === null), true);
  assert.equal(MINIMAP_LOCATION_REGISTRY.filter((entry) => entry.category === "INFRASTRUCTURE").every((entry) => entry.status === "PROVISIONAL" && entry.destinationId === null), true);
});

test("Wave 4A does not add synthetic authority or provenance to static registry records", () => {
  for (const entry of MINIMAP_LOCATION_REGISTRY) {
    assert.equal(Object.hasOwn(entry, "sourceAuthority"), false);
    assert.equal(Object.hasOwn(entry, "sourceRecordId"), false);
    assert.equal(Object.hasOwn(entry, "provenance"), false);
  }
});

test("Wave 4A preserves the three existing city view modes and persistence", () => {
  assert.match(miniMapSource, /const MAP_STATES = \["collapsed", "compact", "expanded"\]/);
  assert.match(miniMapSource, /window\.localStorage\.getItem\(MAP_STATE_STORAGE_KEY\)/);
  assert.match(miniMapSource, /window\.localStorage\.setItem\(MAP_STATE_STORAGE_KEY, value\)/);
  assert.match(miniMapSource, /mapState === "collapsed"/);
  assert.match(miniMapSource, /mapState === "compact"/);
  assert.match(miniMapSource, /mapState === "expanded"/);
});

test("Wave 4A preserves Recenter, Fit World, and full-map controls", () => {
  assert.match(miniMapSource, /aria-label="Recenter map on your district"/);
  assert.match(miniMapSource, /aria-label="Fit world"/);
  assert.match(miniMapSource, /aria-label="View full map"/);
  assert.match(miniMapSource, /const handleRecenter = \(\) =>/);
  assert.match(miniMapSource, /const handleFitWorld = \(\) =>/);
  assert.match(miniMapSource, /renderMapLayers\("compact"\)/);
  assert.match(miniMapSource, /renderMapLayers\("full"\)/);
  assert.match(miniMapSource, /aria-label="Close full map"/);
});

test("Wave 4A preserves DOM marker rendering and existing live overlays", () => {
  assert.match(miniMapSource, /backgroundImage: `url\(\$\{mapAssetUrl\}\)`/);
  assert.doesNotMatch(miniMapSource, /<canvas|getContext\(["']2d["']\)|drawImage/);
  assert.match(miniMapSource, /districts\.map\(\(district\) =>/);
  assert.match(miniMapSource, /met-citymap__count-badge/);
  assert.match(miniMapSource, /met-citymap__event-flag/);
  assert.match(miniMapSource, /met-citymap__opportunity-flag/);
  assert.match(miniMapSource, /civicActive/);
  assert.match(miniMapSource, /met-citymap__you-pulse/);
});

test("Wave 4A preserves current marker accessibility and semantic equivalents", () => {
  assert.match(miniMapSource, /<button[\s\S]{0,500}aria-label=\{`\$\{district\.fullLabel/);
  assert.match(miniMapSource, /role="tablist"/);
  assert.match(miniMapSource, /aria-selected=\{activeTab === tab\}/);
  assert.match(miniMapSource, /aria-pressed=\{layerToggles\./);
  assert.match(miniMapSource, /aria-label="Text equivalent district activity"/);
  assert.match(miniMapSource, /reducedMotion/);
});

test("Wave 4A preserves MetaverseCityPage as district navigation authority", () => {
  assert.match(miniMapSource, /onSelectDistrict\?\.\(district\)/);
  assert.match(cityPageSource, /onSelectDistrict=\{selectDistrict\}/);
  assert.match(cityPageSource, /const selectDistrict = async \(district\) =>/);
  assert.match(cityPageSource, /requestProtectedDecision\(resource, "enter"\)/);
  assert.match(cityPageSource, /canEnterMetaverseResource\(unlock\)/);
  assert.match(cityPageSource, /setLevel\("DISTRICT_VIEW"\)/);
});

test("Wave 4A preserves fast-travel checks and prevents provisional marker navigation", () => {
  assert.match(cityPageSource, /const navigateFastTravelDestination = async \(destination\) =>/);
  assert.match(cityPageSource, /result = await fastTravelApi\(destination\.destination_id\)/);
  assert.match(cityPageSource, /if \(!result\?\.can_enter\)/);
  assert.match(miniMapSource, /infrastructureLocations\.map\(\(location\) =>/);
  assert.doesNotMatch(miniMapSource.match(/infrastructureLocations\.map\(\(location\) => \([\s\S]{0,700}?\)\)\}?/)?.[0] || "", /onClick/);
  assert.equal(MINIMAP_LOCATION_REGISTRY.filter((entry) => entry.category === "INFRASTRUCTURE").every((entry) => entry.destinationRoute === null), true);
});

test("Wave 4A preserves the regional 15-stop presentation route without destination authority", () => {
  assert.equal(REGIONAL_ROUTE_SEQUENCE.length, 15);
  assert.deepEqual(REGIONAL_SCENE_DESTINATION_REFS.map((entry) => entry.destinationId), Array(15).fill(null));
  assert.match(regionalScenePageSource, /MetaverseMiniMap/);
  assert.match(miniMapSource, /aria-label="Regional route overview"/);
  assert.match(miniMapSource, /Route pending/);
  assert.match(navigationSource, /cameraGrantsAccess: false/);
});

test("Wave 4A fixture client accepts only visible Metaverse Quick Map client results", async () => {
  const { pipeline } = await createTestPipeline();
  const record = sourceRecord({ layerId: "wave3b.static" });
  const internal = pipeline.project(record, { viewer: VIEWERS.AUTHENTICATED });
  const client = pipeline.toClient(internal);
  const accepted = createQuickMapClientFixture([{ status: internal.status, feature: client?.feature }]);
  assert.equal(accepted.length, 1);
  assert.equal(accepted[0].feature.coordinateSpaceId, "metaverse.quick-map");
});

test("Wave 4A fixture client rejects master-city, REAL_WORLD, and unknown spaces", async () => {
  const { pipeline } = await createTestPipeline();
  for (const coordinateSpaceId of ["metaverse.master-city", "real-world.latlng", "metaverse.unknown"]) {
    const record = sourceRecord({ coordinateSpaceId });
    const internal = pipeline.project(record, { viewer: VIEWERS.AUTHENTICATED });
    const client = pipeline.toClient(internal);
    assert.equal(createQuickMapClientFixture([{ status: internal.status, feature: client?.feature }]).length, 0, coordinateSpaceId);
  }
});

test("Wave 4A fixture client rejects unpublished and restricted projections", async () => {
  const { pipeline } = await createTestPipeline();
  const unpublished = sourceRecord({ publicationState: PUBLICATION_ELIGIBILITY_LEVELS.NOT_PUBLISHED, publicEligibility: { level: PUBLICATION_ELIGIBILITY_LEVELS.NOT_PUBLISHED, publicationState: PUBLICATION_ELIGIBILITY_LEVELS.NOT_PUBLISHED } });
  const restricted = sourceRecord({ publicationState: PUBLICATION_ELIGIBILITY_LEVELS.RESTRICTED, publicEligibility: { level: PUBLICATION_ELIGIBILITY_LEVELS.RESTRICTED, publicationState: PUBLICATION_ELIGIBILITY_LEVELS.RESTRICTED } });
  const results = [unpublished, restricted].map((record) => {
    const internal = pipeline.project(record, { viewer: VIEWERS.AUTHENTICATED });
    const client = pipeline.toClient(internal);
    return { status: internal.status, feature: client?.feature };
  });
  assert.deepEqual(createQuickMapClientFixture(results), []);
});

test("Wave 4A selection fixture requires a visible client feature and stays presentation-only", async () => {
  const { pipeline } = await createTestPipeline();
  const record = sourceRecord();
  const internal = pipeline.project(record, { viewer: VIEWERS.AUTHENTICATED });
  const client = pipeline.toClient(internal);
  const selectable = createQuickMapClientFixture([{ status: internal.status, feature: client?.feature }]);
  assert.equal(selectable.length, 1);
  const selection = { featureId: selectable[0].feature.featureId, coordinateSpaceId: selectable[0].feature.coordinateSpaceId, presentationOnly: true };
  assert.equal(selection.presentationOnly, true);
  assert.equal(selection.coordinateSpaceId, "metaverse.quick-map");
  assert.equal(record.publicationState, PUBLICATION_ELIGIBILITY_LEVELS.PUBLIC);
  assert.equal(featureIdFor(record), selectable[0].feature.featureId);
});

test("Wave 4A defers unsupported Interaction Bus capabilities", () => {
  assert.doesNotMatch(miniMapSource, /REQUEST_ROUTE|FOLLOW_ROUTE|REQUEST_DOMAIN_ACTION/);
  assert.match(miniMapSource, /onClick=\{\(event\) =>/);
  assert.match(miniMapSource, /onSelectDistrict/);
});

test("Wave 4A confirms no production Quick Map adapter or mapping was created", () => {
  assert.equal(existsSync(new URL("../src/system/spatial/projection/quickMapAdapter.js", import.meta.url)), false);
  assert.equal(existsSync(new URL("../src/system/spatial/projection/quickMapClient.js", import.meta.url)), false);
  assert.match(readFileSync(new URL("../src/system/metaverse/metaverseMiniMapRegistry.js", import.meta.url), "utf8"), /CONFIRMED_DISTRICT_QUICK_MAP_MAPPINGS = Object\.freeze\(\[\]\)/);
});
