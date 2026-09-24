// DAY WATER / RAPIDS — status: DEFERRED — FINAL POLISH WATER MOTION.
//
// Pulled back out of the normal DAY scene (see
// MetaverseDayWaterLayer.jsx); nothing exported from here renders in
// normal /metaverse anymore. Review-gated, DAY-only, isolated — see
// resolveDayWaterReviewEnabled() below (dev build + explicit
// ?dayWaterReview=1, same pattern as resolveDayBirdsReviewEnabled in
// dayBirdRegistry.js / resolveTrafficCorridorReviewEnabled in
// metaverseTrafficCorridorRuntime.js). Source assets
// (public/assets/metaverse/water/day/) and all registry data below are
// left in place, untouched, for when this resumes.
//
// This is deliberately NOT a river-wide effect: only specific zones where
// the production DAY city plate (silicon-heartland-city-day.png) already
// visually suggests current — bright, choppy, higher-contrast water
// directly downstream of bridge piers where the channel narrows — get a
// small, low-opacity highlight/shimmer layer. Calm, uniform stretches of
// river/lake in the base art are left untouched; see the phase report for
// the candidate-zone survey this was built from.
//
// Motion reuses the exact "small alternating sway, no loop reset"
// technique already proven for the cloud/bird vertical bob (see
// dayCloudRegistry.js / dayBirdRegistry.js): a CSS-variable-parametrized
// keyframe animates between two offset states with
// animation-direction:alternate, so there is never a visible jump/reset
// — appropriate here since each element only needs to sway in place a
// few pixels, not travel across the screen like a cloud or bird.
export function resolveDayWaterReviewEnabled({ isDev, search }) {
  if (!isDev) return false;
  const params = new URLSearchParams(search || "");
  if (!params.has("dayWaterReview")) return false;
  const value = params.get("dayWaterReview");
  return value !== "0" && value !== "false";
}

export const DAY_WATER_CLASSIFICATIONS = {
  RAPIDS: "rapids",
  CALM: "calm",
};

// RAPIDS ASSET ORGANIZATION — real PNG assets (see the phase report),
// public/assets/metaverse/water/day/. Only rapids_foam_a is wired into
// rendering yet (the single overlay proof below); the rest are organized
// and copied, ready for the full rapids system in a later phase.
export const DAY_WATER_ASSET_BASE = "public/assets/metaverse/water/day";

function round1(value) {
  return Math.round(value * 10) / 10;
}

function buildElement({ id, kind, zoneLeft, zoneTop, dx, dy, widthPct, heightPct, rotationDeg, opacity, driftDx, driftDy, driftDurationSeconds, driftDelaySeconds, shimmerDurationSeconds, shimmerDelaySeconds }) {
  return {
    id,
    kind, // "streak" | "fleck"
    left: round1(zoneLeft + dx),
    top: round1(zoneTop + dy),
    widthPct,
    heightPct,
    rotationDeg,
    opacity,
    driftDx,
    driftDy,
    driftDurationSeconds,
    driftDelaySeconds,
    shimmerDurationSeconds,
    shimmerDelaySeconds,
  };
}

// ZONE 1 — cable-stayed bridge, lower-left river crossing. The strongest
// existing current cue in the DAY plate: visibly brighter, more textured
// water directly downstream of the bridge piers (classic real-world
// constricted-flow turbulence), clearly different from the flatter,
// calmer water elsewhere in the same river. Coordinates measured directly
// against silicon-heartland-city-day.png (1672x941): the turbulent patch
// spans roughly x 325-531, y 725-838 px -> left 19%, top 77%, width 12%,
// height 11% in the shared scene-percentage coordinate system every
// other living-city layer uses.
const CABLE_BRIDGE_ZONE = {
  id: "cable_bridge_rapids",
  classification: DAY_WATER_CLASSIFICATIONS.RAPIDS,
  left: 19,
  top: 77,
  width: 12,
  height: 11,
};

const CABLE_BRIDGE_ELEMENTS = [
  buildElement({
    id: "cable_bridge_rapids_streak_1", kind: "streak",
    zoneLeft: CABLE_BRIDGE_ZONE.left, zoneTop: CABLE_BRIDGE_ZONE.top,
    dx: 0.5, dy: 1, widthPct: 4.5, heightPct: 0.35, rotationDeg: 20,
    opacity: 0.16, driftDx: 3, driftDy: 1.5, driftDurationSeconds: 7, driftDelaySeconds: 0,
    shimmerDurationSeconds: 6, shimmerDelaySeconds: 0,
  }),
  buildElement({
    id: "cable_bridge_rapids_streak_2", kind: "streak",
    zoneLeft: CABLE_BRIDGE_ZONE.left, zoneTop: CABLE_BRIDGE_ZONE.top,
    dx: 3, dy: 2.8, widthPct: 3.5, heightPct: 0.3, rotationDeg: 18,
    opacity: 0.13, driftDx: 2.5, driftDy: 1.2, driftDurationSeconds: 8.5, driftDelaySeconds: 1.2,
    shimmerDurationSeconds: 7.5, shimmerDelaySeconds: 0.8,
  }),
  buildElement({
    id: "cable_bridge_rapids_streak_3", kind: "streak",
    zoneLeft: CABLE_BRIDGE_ZONE.left, zoneTop: CABLE_BRIDGE_ZONE.top,
    dx: 1.6, dy: 4.6, widthPct: 3, heightPct: 0.28, rotationDeg: 22,
    opacity: 0.11, driftDx: 2, driftDy: 1, driftDurationSeconds: 6.5, driftDelaySeconds: 2.4,
    shimmerDurationSeconds: 9, shimmerDelaySeconds: 1.6,
  }),
  buildElement({
    id: "cable_bridge_rapids_fleck_1", kind: "fleck",
    zoneLeft: CABLE_BRIDGE_ZONE.left, zoneTop: CABLE_BRIDGE_ZONE.top,
    dx: 4.6, dy: 2.4, widthPct: 0.6, heightPct: 0.6, rotationDeg: 0,
    opacity: 0.18, driftDx: 1.5, driftDy: 1.5, driftDurationSeconds: 9, driftDelaySeconds: 0.6,
    shimmerDurationSeconds: 6.5, shimmerDelaySeconds: 2.1,
  }),
  buildElement({
    id: "cable_bridge_rapids_fleck_2", kind: "fleck",
    zoneLeft: CABLE_BRIDGE_ZONE.left, zoneTop: CABLE_BRIDGE_ZONE.top,
    dx: 2, dy: 6, widthPct: 0.5, heightPct: 0.5, rotationDeg: 0,
    opacity: 0.14, driftDx: 1.2, driftDy: 1.2, driftDurationSeconds: 7.5, driftDelaySeconds: 3,
    shimmerDurationSeconds: 8, shimmerDelaySeconds: 0.3,
  }),
];

export const DAY_WATER_ZONES = [CABLE_BRIDGE_ZONE];

export const DAY_WATER_ELEMENTS = [...CABLE_BRIDGE_ELEMENTS];

export function isDayWaterElementOpacityRestrained(element) {
  return element.opacity >= 0.08 && element.opacity <= 0.2;
}

// RAPIDS SINGLE-ZONE FIT + BLEND — the debug 600px/opacity-1/magenta
// proof is now fit to the actual open-water channel in the DAY plate
// (measured directly against silicon-heartland-city-day.png, 1672x941):
// a clean, unobstructed stretch of the main central river just west of
// the pedestrian footbridge, roughly x 379-749px, y 419-479px -> left
// 22.7%, top 44.4%, width ~14% (scene-percentage, not fixed px, so it
// scales with the world box like every other living-city element).
// Rotation follows the channel's slight upward-right slope. No glow, no
// heavy blur, no blend-mode/color-filter tricks — just position/size/
// rotation/opacity, per this phase's constraints.
export const DAY_WATER_OVERLAY_PROOF = {
  id: "rapids_foam_a_proof",
  asset: `${DAY_WATER_ASSET_BASE}/rapids_foam_a_trim.png`,
  left: 23,
  top: 44,
  widthPct: 14,
  opacity: 0.3,
  rotationDeg: -3,
};
