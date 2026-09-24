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
  { id: "civic-district", label: "Civic District", category: "DISTRICT", icon: "\u{1F3DB}\u{FE0F}", x: null, y: null, calibrated: false, destinationRoute: "civic-district" },
  { id: "career-education-district", label: "Career & Education", category: "DISTRICT", icon: "\u{1F393}", x: null, y: null, calibrated: false, destinationRoute: "career-education-district" },
  { id: "public-realm", label: "Public Realm", category: "DISTRICT", icon: "\u{1F333}", x: null, y: null, calibrated: false, destinationRoute: "public-realm" },
  { id: "data-center-district", label: "Data Center", category: "DISTRICT", icon: "\u{1F5A5}\u{FE0F}", x: null, y: null, calibrated: false, destinationRoute: "data-center-district" },
  { id: "technology-innovation-district", label: "Technology & Innovation", category: "DISTRICT", icon: "\u{1F4A1}", x: null, y: null, calibrated: false, destinationRoute: "technology-innovation-district" },
  { id: "learning-arcade-district", label: "Learning Arcade", category: "DISTRICT", icon: "\u{1F4DA}", x: null, y: null, calibrated: false, destinationRoute: "learning-arcade-district" },
  { id: "treasury-commerce-district", label: "Treasury & Commerce", category: "DISTRICT", icon: "\u{1F4CA}", x: null, y: null, calibrated: false, destinationRoute: "treasury-commerce-district" },
  { id: "community-district", label: "Community", category: "DISTRICT", icon: "\u{1F465}", x: null, y: null, calibrated: false, destinationRoute: "community-district" },
  { id: "student-life-district", label: "Residential / Student Life", category: "DISTRICT", icon: "\u{1F3E0}", x: null, y: null, calibrated: false, destinationRoute: "student-life-district" },
  { id: "airport", label: "Airport", category: "INFRASTRUCTURE", icon: "✈️", x: 51.8, y: 72.7, calibrated: true, provisional: true, destinationRoute: null },
  { id: "hospital", label: "Hospital", category: "INFRASTRUCTURE", icon: "\u{1F3E5}", x: 10.4, y: 59.4, calibrated: true, provisional: true, destinationRoute: null },
  { id: "police", label: "Police", category: "INFRASTRUCTURE", icon: "\u{1F694}", x: 10.4, y: 74.1, calibrated: true, provisional: true, destinationRoute: null },
  { id: "fire", label: "Fire", category: "INFRASTRUCTURE", icon: "\u{1F692}", x: 22.8, y: 59.4, calibrated: true, provisional: true, destinationRoute: null },
  { id: "mall-retail", label: "Mall / Retail", category: "INFRASTRUCTURE", icon: "\u{1F6CD}️", x: 23.5, y: 74.6, calibrated: true, provisional: true, destinationRoute: null },
  { id: "marina-harbor", label: "Marina / Harbor", category: "INFRASTRUCTURE", icon: "⚓", x: 84.3, y: 32.2, calibrated: true, provisional: true, destinationRoute: null },
];

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
