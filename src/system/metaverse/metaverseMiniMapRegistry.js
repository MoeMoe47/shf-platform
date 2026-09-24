import { CANONICAL_DESTINATION_IDS } from "./metaverseCanonicalDestinationRegistry.js";
import { METAVERSE_DISTRICT_MARKERS } from "./metaverseNavigationModel.js";

// MINIMAP V2 — canonical top-view map asset + location/pin registry.
//
// MINIMAP_ASSET is the approved base map image ONLY (owner-supplied,
// installed byte-for-byte — see the phase report for source/installed
// SHA256). It must never have markers baked into it; every marker in
// MINIMAP_LOCATION_REGISTRY below is a separate DOM overlay positioned
// on top of it (see MetaverseMiniMap.jsx), never merged into the PNG.
export const MINIMAP_ASSET = "public/assets/metaverse/minimap/silicon-heartland-metaverse-top-map.png";

// The asset's native pixel dimensions, for anything that ever needs to
// convert a raw pixel measurement against this specific image into the
// 0-100 normalized x/y this registry uses (e.g. a future calibration
// tool). Every x/y below is already normalized against these.
export const MINIMAP_ASSET_DIMENSIONS = { width: 1448, height: 1086 };

export const QUICK_MAP_COORDINATE_SPACE = Object.freeze({
  id: "quick-map",
  units: "normalized-percent",
  minX: 0,
  maxX: 100,
  minY: 0,
  maxY: 100,
  sourceWidth: MINIMAP_ASSET_DIMENSIONS.width,
  sourceHeight: MINIMAP_ASSET_DIMENSIONS.height,
});

export const MINIMAP_COORDINATE_STATUSES = Object.freeze([
  "VERIFIED",
  "CALIBRATED",
  "PROVISIONAL",
  "UNMAPPED",
]);

export const DISTRICT_CALIBRATION_REVIEW_STATUSES = Object.freeze([
  "UNMAPPED",
  "CANDIDATE",
  "CONFIRMED",
  "REJECTED",
]);

// Location/pin registry for the approved top-view map. x/y are
// normalized 0-100 percentages of MINIMAP_ASSET_DIMENSIONS — a
// SEPARATE coordinate space from METAVERSE_DISTRICTS's x/y (which is
// calibrated against the main scene's cinematic city background, a
// completely different piece of art). Do not reuse one for the other.
//
// `calibrated: false` entries deliberately have x/y left null — per
// the brief's "do not guess final coordinates if they require owner
// review." The approved map is a generic top-down city template
// (regions baked into the art as "Downtown", "Residential & Park",
// "Civic & Commerce", "Airport & Industrial", "East Beach & Marina",
// "Harbor & Open Water"), and none of Silicon Heartland's nine
// canonical districts (Civic District, Career & Education, Public
// Realm, Data Center, Technology & Innovation, Learning Arcade,
// Treasury & Commerce, Community, Residential/Student Life) has a
// self-evident 1:1 match to one of those baked regions — that mapping
// is an owner decision, not something to infer from art style alone.
//
// The six INFRASTRUCTURE entries DO have a provisional x/y: they're
// depicted as unambiguous, literal icon-buildings on the map itself
// (a runway with parked planes, an "H"/red-cross building, a shield-
// badge building, a fire-truck bay, a shopping-cart-icon building, a
// boat marina + lighthouse) — `provisional: true` marks these as
// still pending explicit owner confirmation, not final calibration.
export const MINIMAP_LOCATION_REGISTRY = [
  { id: "civic-district", label: "Civic District", category: "DISTRICT", icon: "\u{1F3DB}\u{FE0F}", x: null, y: null, calibrated: false, coordinateSpaceId: "quick-map", status: "UNMAPPED", destinationRoute: "civic-district" },
  { id: "career-education-district", label: "Career & Education", category: "DISTRICT", icon: "\u{1F393}", x: null, y: null, calibrated: false, coordinateSpaceId: "quick-map", status: "UNMAPPED", destinationRoute: "career-education-district" },
  { id: "public-realm", label: "Public Realm", category: "DISTRICT", icon: "\u{1F333}", x: null, y: null, calibrated: false, coordinateSpaceId: "quick-map", status: "UNMAPPED", destinationRoute: "public-realm" },
  { id: "data-center-district", label: "Data Center", category: "DISTRICT", icon: "\u{1F5A5}\u{FE0F}", x: null, y: null, calibrated: false, coordinateSpaceId: "quick-map", status: "UNMAPPED", destinationRoute: "data-center-district" },
  { id: "technology-innovation-district", label: "Technology & Innovation", category: "DISTRICT", icon: "\u{1F4A1}", x: null, y: null, calibrated: false, coordinateSpaceId: "quick-map", status: "UNMAPPED", destinationRoute: "technology-innovation-district" },
  { id: "learning-arcade-district", label: "Learning Arcade", category: "DISTRICT", icon: "\u{1F4DA}", x: null, y: null, calibrated: false, coordinateSpaceId: "quick-map", status: "UNMAPPED", destinationRoute: "learning-arcade-district" },
  { id: "treasury-commerce-district", label: "Treasury & Commerce", category: "DISTRICT", icon: "\u{1F4CA}", x: null, y: null, calibrated: false, coordinateSpaceId: "quick-map", status: "UNMAPPED", destinationRoute: "treasury-commerce-district" },
  { id: "community-district", label: "Community", category: "DISTRICT", icon: "\u{1F465}", x: null, y: null, calibrated: false, coordinateSpaceId: "quick-map", status: "UNMAPPED", destinationRoute: "community-district" },
  { id: "student-life-district", label: "Residential / Student Life", category: "DISTRICT", icon: "\u{1F3E0}", x: null, y: null, calibrated: false, coordinateSpaceId: "quick-map", status: "UNMAPPED", destinationRoute: "student-life-district" },
  { id: "airport", label: "Airport", category: "INFRASTRUCTURE", markerClassification: "PROVISIONAL_INFRASTRUCTURE", icon: "✈️", x: 51.8, y: 72.7, calibrated: true, coordinateSpaceId: "quick-map", status: "PROVISIONAL", provisional: true, destinationId: null, destinationRoute: null },
  { id: "hospital", label: "Hospital", category: "INFRASTRUCTURE", markerClassification: "PROVISIONAL_INFRASTRUCTURE", icon: "\u{1F3E5}", x: 10.4, y: 59.4, calibrated: true, coordinateSpaceId: "quick-map", status: "PROVISIONAL", provisional: true, destinationId: null, destinationRoute: null },
  { id: "police", label: "Police", category: "INFRASTRUCTURE", markerClassification: "PROVISIONAL_INFRASTRUCTURE", icon: "\u{1F694}", x: 10.4, y: 74.1, calibrated: true, coordinateSpaceId: "quick-map", status: "PROVISIONAL", provisional: true, destinationId: null, destinationRoute: null },
  { id: "fire", label: "Fire", category: "INFRASTRUCTURE", markerClassification: "PROVISIONAL_INFRASTRUCTURE", icon: "\u{1F692}", x: 22.8, y: 59.4, calibrated: true, coordinateSpaceId: "quick-map", status: "PROVISIONAL", provisional: true, destinationId: null, destinationRoute: null },
  { id: "mall-retail", label: "Mall / Retail", category: "INFRASTRUCTURE", markerClassification: "PROVISIONAL_INFRASTRUCTURE", icon: "\u{1F6CD}️", x: 23.5, y: 74.6, calibrated: true, coordinateSpaceId: "quick-map", status: "PROVISIONAL", provisional: true, destinationId: null, destinationRoute: null },
  { id: "marina-harbor", label: "Marina / Harbor", category: "INFRASTRUCTURE", markerClassification: "PROVISIONAL_INFRASTRUCTURE", icon: "⚓", x: 84.3, y: 32.2, calibrated: true, coordinateSpaceId: "quick-map", status: "PROVISIONAL", provisional: true, destinationId: null, destinationRoute: null },
];

// Owner-reviewed source authority. This remains empty until a human confirms
// that a Quick Map point represents a canonical Silicon Heartland district.
// Candidate clicks never mutate this list or the production marker registry.
export const CONFIRMED_DISTRICT_QUICK_MAP_MAPPINGS = Object.freeze([]);

export const MINIMAP_CALIBRATION_TARGET_IDS = Object.freeze([
  ...MINIMAP_LOCATION_REGISTRY.map((location) => location.id),
  ...CANONICAL_DESTINATION_IDS,
]);

export function getMiniMapLocationById(id) {
  return MINIMAP_LOCATION_REGISTRY.find((location) => location.id === id) || null;
}

export function getCanonicalDistrictCalibrationRecords() {
  return METAVERSE_DISTRICT_MARKERS.map((district) => {
    const mapping = CONFIRMED_DISTRICT_QUICK_MAP_MAPPINGS.find((entry) => entry.districtId === district.id);
    return {
      districtId: district.id,
      displayName: district.fullLabel,
      quickMap: mapping?.quickMap || null,
      status: mapping ? "CONFIRMED" : "UNMAPPED",
    };
  });
}

export function getDistrictQuickMapLocation(districtId) {
  return CONFIRMED_DISTRICT_QUICK_MAP_MAPPINGS.find((entry) => entry.districtId === districtId)?.quickMap || null;
}

export function createDistrictCalibrationCandidate({ districtId, x, y }) {
  if (!METAVERSE_DISTRICT_MARKERS.some((district) => district.id === districtId)) return null;
  if (!isNormalizedQuickMapCoordinate(x, y)) return null;
  return {
    districtId,
    quickMap: {
      coordinateSpaceId: QUICK_MAP_COORDINATE_SPACE.id,
      position: { x, y },
      status: "CALIBRATED",
    },
    reviewStatus: "CANDIDATE",
  };
}

export function validateConfirmedDistrictQuickMapMappings(mappings = CONFIRMED_DISTRICT_QUICK_MAP_MAPPINGS) {
  const errors = [];
  const districtIds = new Set(METAVERSE_DISTRICT_MARKERS.map((district) => district.id));
  const seenDistricts = new Set();
  const seenCoordinates = new Map();
  for (const mapping of mappings) {
    if (!districtIds.has(mapping?.districtId)) errors.push(`unknown district ID: ${mapping?.districtId}`);
    if (seenDistricts.has(mapping?.districtId)) errors.push(`duplicate district mapping: ${mapping?.districtId}`);
    seenDistricts.add(mapping?.districtId);
    if (mapping?.destinationId) errors.push(`${mapping.districtId}: destination ID cannot replace district ID`);
    if (mapping?.quickMap?.coordinateSpaceId !== QUICK_MAP_COORDINATE_SPACE.id) errors.push(`${mapping?.districtId}: invalid Quick Map coordinate space`);
    if (mapping?.quickMap?.status !== "VERIFIED") errors.push(`${mapping?.districtId}: confirmed mapping must be VERIFIED`);
    if (!isNormalizedQuickMapCoordinate(mapping?.quickMap?.position?.x, mapping?.quickMap?.position?.y)) errors.push(`${mapping?.districtId}: invalid confirmed coordinates`);
    const coordinateKey = `${mapping?.quickMap?.position?.x}:${mapping?.quickMap?.position?.y}`;
    const owner = seenCoordinates.get(coordinateKey);
    if (owner && owner.sharedPhysicalLocationId !== mapping.sharedPhysicalLocationId) errors.push(`${mapping.districtId}: duplicate coordinate with ${owner.districtId}`);
    seenCoordinates.set(coordinateKey, mapping);
  }
  return errors;
}

export function isNormalizedQuickMapCoordinate(x, y) {
  return Number.isFinite(x) && Number.isFinite(y)
    && x >= QUICK_MAP_COORDINATE_SPACE.minX && x <= QUICK_MAP_COORDINATE_SPACE.maxX
    && y >= QUICK_MAP_COORDINATE_SPACE.minY && y <= QUICK_MAP_COORDINATE_SPACE.maxY;
}

export function formatMiniMapCalibrationMapping({ targetId, x, y }) {
  if (typeof targetId !== "string" || !isNormalizedQuickMapCoordinate(x, y)) return null;
  return `${targetId}: { coordinateSpaceId: "quick-map", x: ${x}, y: ${y}, status: "CALIBRATED" }`;
}

export function validateMiniMapCanonicalReferences() {
  const errors = [...validateConfirmedDistrictQuickMapMappings()];
  const coordinateOwners = new Map();
  for (const location of MINIMAP_LOCATION_REGISTRY) {
    if (location.coordinateSpaceId !== QUICK_MAP_COORDINATE_SPACE.id) errors.push(`${location.id}: invalid coordinate space`);
    if (!MINIMAP_COORDINATE_STATUSES.includes(location.status)) errors.push(`${location.id}: invalid coordinate status`);
    if (location.status === "UNMAPPED" && (location.x !== null || location.y !== null)) errors.push(`${location.id}: unmapped marker must not have coordinates`);
    if (location.status !== "UNMAPPED" && !isNormalizedQuickMapCoordinate(location.x, location.y)) errors.push(`${location.id}: mapped marker has invalid coordinates`);
    if (location.category === "INFRASTRUCTURE" && location.markerClassification !== "PROVISIONAL_INFRASTRUCTURE") errors.push(`${location.id}: infrastructure marker must remain provisional or canonical`);
    if (location.category === "INFRASTRUCTURE" && (location.status !== "PROVISIONAL" || location.destinationId !== null)) errors.push(`${location.id}: infrastructure marker must remain provisional and unclaimed`);
    if (location.destinationId !== null && location.destinationId !== undefined && !CANONICAL_DESTINATION_IDS.includes(location.destinationId)) errors.push(`${location.id}: unknown canonical destination ${location.destinationId}`);
    if (location.destinationId !== null && location.destinationId !== undefined && !["VERIFIED", "CALIBRATED"].includes(location.status)) errors.push(`${location.id}: canonical marker must be verified or calibrated`);
    if (location.destinationId !== null && location.destinationId !== undefined && location.destinationRoute === null) errors.push(`${location.id}: canonical marker needs a route reference or explicit null route`);
    if (location.status !== "UNMAPPED") {
      const coordinateKey = `${location.x}:${location.y}`;
      const owner = coordinateOwners.get(coordinateKey);
      if (owner && owner.sharedPhysicalLocationId !== location.sharedPhysicalLocationId) errors.push(`${location.id}: duplicate Quick Map coordinate with ${owner.id}`);
      coordinateOwners.set(coordinateKey, location);
    }
  }
  return errors;
}

export function getCalibratedMiniMapLocations() {
  return MINIMAP_LOCATION_REGISTRY.filter((location) => location.calibrated && location.x !== null && location.y !== null);
}

export function getUncalibratedMiniMapLocations() {
  return MINIMAP_LOCATION_REGISTRY.filter((location) => !location.calibrated);
}

// FINAL RECONCILIATION V3.1 — PART 3: the registry already carries an
// owner-legible icon per district (used once full pin calibration
// lands); the District Map's live marker chips reuse that SAME icon
// rather than inventing a second lookup table, so a future calibration
// update only ever has one place to edit.
export function getMiniMapLocationIcon(locationId) {
  return MINIMAP_LOCATION_REGISTRY.find((location) => location.id === locationId)?.icon || null;
}

// Dev-only placement/calibration mode: `?minimapCalibrate=1` (dev build
// only, same review-flag convention as every other Metaverse review
// gate in this codebase). When enabled, MetaverseMiniMap.jsx reports
// the normalized x/y of any click on the map canvas (console + a small
// on-screen readout) so an owner/developer can determine real
// coordinates for the still-uncalibrated districts above, without
// guessing. It never writes back into this file automatically — a
// human still copies the reported values in here deliberately.
export function resolveMiniMapCalibrationModeEnabled({ isDev, search }) {
  if (!isDev) return false;
  const params = new URLSearchParams(search || "");
  return params.has("minimapCalibrate");
}

// FINAL RECONCILIATION V3.1 — PART 6: a second, separate opt-in
// (`?minimapFaceFixture=1`, on top of the existing `?metaverseDev=1`
// gate) so the Students Nearby face-row layout can be visually QA'd
// with obviously-labeled fixture identities, without those fixture
// students silently appearing every time a developer just wants the
// Scene Time controls. Same dev-build-only convention as every other
// review/dev flag in this codebase; never reachable in production
// regardless of query string (see the `!isDev` short-circuit below).
export function resolveMiniMapFaceFixtureEnabled({ isDev, search }) {
  if (!isDev) return false;
  const params = new URLSearchParams(search || "");
  return params.has("minimapFaceFixture");
}
