// DAY RAPIDS MOTION V2 — subtle animated overlays for the baked-in DAY
// rapids/water, two review-gated zones.
//
// Review-gated, DAY-only, NOT live by default — see
// resolveDayRapidsMotionReviewEnabled() below (dev build + explicit
// ?dayRapidsMotionReview=1). Its OWN flag, OWN registry, OWN component
// (MetaverseDayRapidsMotionLayer.jsx) — fully isolated from the deferred
// DAY WATER / RAPIDS system in dayWaterRegistry.js /
// MetaverseDayWaterLayer.jsx, which this phase does not touch.
//
// MOTION MODEL (unchanged from the V1 correction — owner: "rapids look
// completely static" — `animation-direction: alternate` sway was the
// wrong model for flowing water): CONTINUOUS one-directional linear
// flow. Every foam/shimmer keyframe drifts one-way (never alternate),
// and to avoid a visible "snap" when a single copy's loop resets, each
// copy fades out right before its reset point while a second,
// phase-offset copy fades in at the same moment (see FOAM_A/FOAM_B in
// each zone) — the classic seamless-scroll technique, scaled down to a
// small zone instead of a full-width conveyor.
//
// V2 adds a SECOND zone (the far-right body of water) using the exact
// same proven architecture — it does not invent a different animation
// system. Zone 1 is preserved byte-for-byte from V1 (same bounds, same
// layer values) per the brief's explicit "keep the first working zone"
// instruction; Zone 2 reuses the same travel-distance/duration family
// but at slightly lower opacity ("secondary supporting" per the brief,
// not louder than Zone 1).
export function resolveDayRapidsMotionReviewEnabled({ isDev, search }) {
  if (!isDev) return false;
  const params = new URLSearchParams(search || "");
  if (!params.has("dayRapidsMotionReview")) return false;
  const value = params.get("dayRapidsMotionReview");
  return value !== "0" && value !== "false";
}

export const DAY_RAPIDS_MOTION_ASSET_BASE = "public/assets/metaverse/water/day";

// ---------------------------------------------------------------------
// ZONE 1 — primary rapids zone, REALIGNED for the new clean Page 1 DAY
// plate installed for the "PAGE 1 CLEAN BACKGROUND INSTALL" phase
// (same 1672x941 dimensions and nearly-identical composition/framing
// as the prior plate, but re-measured against the new file directly,
// not assumed from the old coordinates). Open, bridge-free/tree-free
// core of the baked-in central rapids spans roughly x 715-935px,
// y 635-690px -> left 42.8%, top 67.5%, width 13.2%, height 5.8% of
// the shared world-box scene-percentage coordinate system.
// ---------------------------------------------------------------------
const ZONE_1_BOUNDS = { left: 42.8, top: 67.5, width: 13.2, height: 5.8 };

// All left/top/width in each zone's layer list are PERCENTAGES OF THAT
// ZONE (0-100), not the world box. Direction is a pixel vector (dx, dy)
// matching the river-flow angle for that stretch; foam and shimmer each
// travel that direction continuously (linear, infinite, never
// alternate).
const ZONE_1_LAYERS = [
  // FOAM A / FOAM B: two copies of the identical foam texture, same
  // base position, same drift vector/duration, but FOAM_B's animation
  // starts half a cycle ahead (negative delay = -duration/2). Each
  // copy's own keyframe fades it in at 0%, holds full opacity through
  // the middle, and fades it OUT again before the loop point — so at
  // the instant one copy resets (invisible), the other is at peak
  // visibility. The viewer never sees a texture snap back to its start.
  {
    id: "rapids_motion_foam_a",
    kind: "foam",
    asset: `${DAY_RAPIDS_MOTION_ASSET_BASE}/rapids_foam_a_trim.png`,
    left: 12,
    top: 20,
    widthPct: 78,
    rotationDeg: -4,
    opacity: 0.45, // TEMPORARY REVIEW STRENGTH — top of the 0.35-0.45 range so motion is unmistakable; reduce once accepted
    blurPx: 0, // no blur while proving motion — softening pushed it too close to the baked-in texture's own softness
    driftDx: 22.5,
    driftDy: 8.3,
    driftDurationSeconds: 3.5,
    driftDelaySeconds: 0,
  },
  {
    id: "rapids_motion_foam_b",
    kind: "foam",
    asset: `${DAY_RAPIDS_MOTION_ASSET_BASE}/rapids_foam_a_trim.png`,
    left: 12,
    top: 20,
    widthPct: 78,
    rotationDeg: -4,
    opacity: 0.45,
    blurPx: 0,
    driftDx: 22.5,
    driftDy: 8.3,
    driftDurationSeconds: 3.5,
    driftDelaySeconds: -1.75, // half of driftDurationSeconds: phase-offset from FOAM A
  },
  {
    id: "rapids_motion_shimmer",
    kind: "shimmer",
    asset: `${DAY_RAPIDS_MOTION_ASSET_BASE}/current_shimmer_a.png`,
    left: 4,
    top: 10,
    widthPct: 92,
    rotationDeg: 3,
    opacity: 0.28, // TEMPORARY REVIEW STRENGTH — top of the 0.20-0.28 range
    blurPx: 0,
    driftDx: 14.8,
    driftDy: -6.2,
    driftDurationSeconds: 5,
    driftDelaySeconds: -1.5, // phase-offset from the foam pair, not synchronized
  },
  {
    id: "rapids_motion_pulse",
    kind: "pulse",
    asset: `${DAY_RAPIDS_MOTION_ASSET_BASE}/river_ripple.png`,
    left: 18,
    top: 30,
    widthPct: 60,
    rotationDeg: 0,
    opacity: 0.12,
    blurPx: 0.3,
    pulseDurationSeconds: 17,
    pulseDelaySeconds: 1.2,
  },
];

// ---------------------------------------------------------------------
// ZONE 2 — secondary/supporting water-motion zone, LOWER-RIGHT body of
// water. REALIGNED for the new clean Page 1 DAY plate (see ZONE 1
// comment above) — the distinct circular whitewater/current pocket
// downstream of the main rapids, next to the wind turbine, still
// exists as its own separate baked feature on the new plate, clear of
// the bridge above and the turbine/embankment to its left. Re-measured
// directly against the new plate: the open turbulent core spans
// roughly x 1145-1305px, y 735-825px (left 68.5%, top 78%, width
// 9.5%, height 9.5%); nudged/narrowed to left 67%, width 7% so the
// right edge clears the fixed bottom-right camera-controls/mini-map
// panel at the default camera view across viewport sizes, while
// staying inside the same open water patch. Same architecture as
// Zone 1 (two-copy foam crossfade + shimmer + pulse, continuous
// one-way flow), same travel-distance/
// duration family, but deliberately lower opacity than Zone 1 in its
// non-temporary/final form.
// ---------------------------------------------------------------------
const ZONE_2_BOUNDS = { left: 67, top: 78, width: 7, height: 9.5 };

const ZONE_2_LAYERS = [
  {
    id: "rapids_motion_2_foam_a",
    kind: "foam",
    asset: `${DAY_RAPIDS_MOTION_ASSET_BASE}/rapids_foam_a_trim.png`,
    left: 12,
    top: 22,
    widthPct: 75,
    rotationDeg: -2,
    opacity: 0.48, // TEMPORARY REVIEW STRENGTH (owner: Zone 2 read as static) — top of the 0.38-0.48 range
    blurPx: 0,
    driftDx: 29.8,
    driftDy: 3.9,
    driftDurationSeconds: 3.6,
    driftDelaySeconds: 0,
  },
  {
    id: "rapids_motion_2_foam_b",
    kind: "foam",
    asset: `${DAY_RAPIDS_MOTION_ASSET_BASE}/rapids_foam_a_trim.png`,
    left: 12,
    top: 22,
    widthPct: 75,
    rotationDeg: -2,
    opacity: 0.48,
    blurPx: 0,
    driftDx: 29.8,
    driftDy: 3.9,
    driftDurationSeconds: 3.6,
    driftDelaySeconds: -1.8, // half of driftDurationSeconds: phase-offset from FOAM A
  },
  {
    id: "rapids_motion_2_shimmer",
    kind: "shimmer",
    asset: `${DAY_RAPIDS_MOTION_ASSET_BASE}/current_shimmer_a.png`,
    left: 4,
    top: 12,
    widthPct: 90,
    rotationDeg: 1,
    opacity: 0.28, // TEMPORARY REVIEW STRENGTH — top of the 0.20-0.28 range
    blurPx: 0,
    driftDx: 17.9,
    driftDy: -2.4,
    driftDurationSeconds: 5.2,
    driftDelaySeconds: -1.6,
  },
  {
    id: "rapids_motion_2_pulse",
    kind: "pulse",
    asset: `${DAY_RAPIDS_MOTION_ASSET_BASE}/river_ripple.png`,
    left: 18,
    top: 32,
    widthPct: 58,
    rotationDeg: 0,
    opacity: 0.1,
    blurPx: 0.3,
    pulseDurationSeconds: 16,
    pulseDelaySeconds: 0.8,
  },
];

export const DAY_RAPIDS_MOTION_ZONES = [
  { id: "zone_1_primary", zone: ZONE_1_BOUNDS, layers: ZONE_1_LAYERS },
  { id: "zone_2_far_right", zone: ZONE_2_BOUNDS, layers: ZONE_2_LAYERS },
];

// Backward-compatible single-zone accessors (Zone 1 only) — kept so
// nothing that already reads "the rapids zone" as one thing breaks.
export const DAY_RAPIDS_MOTION_ZONE = ZONE_1_BOUNDS;
export const DAY_RAPIDS_MOTION_LAYERS = ZONE_1_LAYERS;

export function isDayRapidsMotionOpacityRestrained(layer) {
  return layer.opacity >= 0.08 && layer.opacity <= 0.48;
}

export function dayRapidsMotionTravelDistancePx(layer) {
  return Math.sqrt((layer.driftDx || 0) ** 2 + (layer.driftDy || 0) ** 2);
}
