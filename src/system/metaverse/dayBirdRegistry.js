// DAY BIRD PLACEMENT V1 — realistic, subtle, DAY-only bird layer.
//
// Review-gated, DAY-only, NOT live by default — see
// resolveDayBirdsReviewEnabled() below (dev build + explicit
// ?dayBirdsReview=1, same pattern as resolveTrafficCorridorReviewEnabled
// in metaverseTrafficCorridorRuntime.js). Also used by
// MetaverseCityPage.jsx to force time-of-day to DAY for this same review
// flag (see the DAY STATE + BIRD VISIBILITY FIX phase) — exported from
// here, not duplicated, so the two can never drift out of sync on what
// the flag actually is.
export function resolveDayBirdsReviewEnabled({ isDev, search }) {
  if (!isDev) return false;
  const params = new URLSearchParams(search || "");
  if (!params.has("dayBirdsReview")) return false;
  const value = params.get("dayBirdsReview");
  return value !== "0" && value !== "false";
}

// Real transparent PNG bird assets only (public/assets/metaverse/birds/day/,
// see the DAY BIRD ASSET ORGANIZATION report) — never CSS/SVG-generated
// shapes, per this phase's explicit requirement. Of the six owner-supplied
// source images, only four were day-appropriate flat silhouettes; the
// other two (glowing rim-lit birds on black) read as dusk/night art and
// were excluded then and are not used here either. There is no dedicated
// "pair" or "small flock" source PNG, so per this phase's own asset-
// handling guidance ("reuse a day-appropriate bird PNG... do not
// substitute a night-style bird"), Group B and Group C reuse the three
// single-bird PNGs across different scale tiers rather than fabricating
// new art — natural for a flock anyway (same few birds, seen at different
// distances), and every reuse is cross-checked in
// tests/metaverseDayBirdLayer.test.mjs to confirm it never touches a
// night-styled file.
export const DAY_BIRD_ASSET_BASE = "public/assets/metaverse/birds/day";
// DAY BIRD ASSET TRIM FIX — the original PNGs have large fully-transparent
// margins around the actual bird artwork (e.g. bird_glide_a.png: a
// 1254x1254 canvas around a 996x1030 alpha bounding box). Since CSS scales
// the ENTIRE canvas to a given width, that margin was silently eating a
// large share of every bird's rendered size, making an "18px" bird read
// as only a few visible pixels. *_trim.png files (same folder) are
// tightly cropped to each bird's alpha bounding box plus a ~6px safe
// margin (originals kept byte-for-byte untouched alongside them) — use
// the trimmed files for all rendering so a given widthPx now refers to
// the visible bird, not a mostly-empty canvas.
export const DAY_BIRD_ASSETS = {
  glideA: `${DAY_BIRD_ASSET_BASE}/bird_glide_a_trim.png`,
  flightA: `${DAY_BIRD_ASSET_BASE}/bird_flight_a_trim.png`,
  glideB: `${DAY_BIRD_ASSET_BASE}/bird_glide_b_trim.png`,
};

const REFERENCE_WIDTH_PX = 1400;
const OFFSCREEN_MARGIN_PX = 40;

// Landmark protection ("no bird or flock may obscure the Capitol dome or
// central skyline spire for excessive time"). Every bird keeps moving
// continuously (no bird ever stops — see driftStartPx/driftEndPx below),
// so no bird can ever DWELL over a landmark; this keepout check only
// guards against a bird's STATIC authored anchor sitting directly on top
// of one (transiting through briefly while drifting is expected and fine
// — only a parked bird would be a problem, and nothing here parks).
export const DAY_BIRD_LANDMARK_KEEPOUTS = [
  { id: "capitol_dome", leftMin: 40, leftMax: 52, topMin: 20, topMax: 32 },
  { id: "central_spire", leftMin: 47, leftMax: 51, topMin: 8, topMax: 16 },
];

export function isDayBirdAnchorOutsideLandmarkKeepouts(bird) {
  return DAY_BIRD_LANDMARK_KEEPOUTS.every((zone) => (
    bird.left < zone.leftMin || bird.left > zone.leftMax || bird.top < zone.topMin || bird.top > zone.topMax
  ));
}

// Depth tiers (brief: "Near: 20-24px, Mid: 14-18px, Far: 8-12px") — kept
// as named constants so the registry entries below and the tests both
// reference the same source of truth instead of restating the ranges.
// DAY BIRD ASSET TRIM FIX — updated for the trimmed assets, where widthPx
// now maps to the visible bird instead of a mostly-empty canvas: lone
// bird 28px, mid (pair) 18-22px, far (flock) 12-16px.
export const DAY_BIRD_DEPTH_TIERS = {
  NEAR: { minPx: 28, maxPx: 28 },
  MID: { minPx: 18, maxPx: 22 },
  FAR: { minPx: 12, maxPx: 16 },
};

function computeOffscreenDrift({ leftPct, widthPx, direction }) {
  const leftPx = (leftPct / 100) * REFERENCE_WIDTH_PX;
  if (direction === "ltr") {
    return {
      startPx: -(leftPx + widthPx + OFFSCREEN_MARGIN_PX),
      endPx: REFERENCE_WIDTH_PX - leftPx + OFFSCREEN_MARGIN_PX,
    };
  }
  return {
    startPx: REFERENCE_WIDTH_PX - leftPx + OFFSCREEN_MARGIN_PX,
    endPx: -(leftPx + widthPx + OFFSCREEN_MARGIN_PX),
  };
}

// A negative animation-delay equal to the bird's own time-to-anchor lands
// it exactly at its authored left/top at t=0 instead of requiring the
// drift animation to first travel in from its off-screen `from` keyframe
// — see the DAY CLOUD VISIBILITY DIAGNOSTIC phase report for why skipping
// this makes a freshly-loaded page look empty for a long time. Applying
// it here from the start avoids repeating that exact defect.
function computeDriftDelaySeconds({ startPx, endPx, durationSeconds, direction }) {
  const fraction = direction === "ltr"
    ? (0 - startPx) / (endPx - startPx)
    : (startPx - 0) / (startPx - endPx);
  return -(fraction * durationSeconds);
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function buildBird({ id, group, asset, left, top, widthPx, opacity, blurPx, direction, speedPxPerSecond, verticalAmplitudePx, verticalDurationSeconds }) {
  const { startPx, endPx } = computeOffscreenDrift({ leftPct: left, widthPx, direction });
  const travelPx = Math.abs(endPx - startPx);
  const durationSeconds = round1(travelPx / speedPxPerSecond);
  const driftDelaySeconds = round1(computeDriftDelaySeconds({ startPx, endPx, durationSeconds, direction }));
  return {
    id,
    group,
    asset,
    left,
    top,
    widthPx,
    opacity,
    blurPx,
    direction,
    speedPxPerSecond,
    driftStartPx: Math.round(startPx),
    driftEndPx: Math.round(endPx),
    durationSeconds,
    driftDelaySeconds,
    verticalDrift: { amplitudePx: verticalAmplitudePx, durationSeconds: verticalDurationSeconds },
  };
}

// Group A — Lone Glider (1 bird, near tier, upper-right).
// Group B — Pair (2 birds, mid tier, upper-right/upper-center), each a
// different single-bird PNG for natural variation, slightly different
// size/Y position/speed (which also gives each a different computed
// driftDelaySeconds, i.e. "slightly different animation delay").
// Group C — Small Flock (3 birds, far tier, upper-center to upper-right),
// reusing all three day-appropriate PNGs again at a smaller, more distant
// scale — normal for a flock (same few birds, seen further away).
//
// Every bird drifts "ltr" (brief: "all birds generally move in the same
// sky direction" — a deliberate change from the earlier mixed-direction
// composition).
const BIRD_DEFS = [
  {
    id: "lone_glider", group: "lone_glider", asset: DAY_BIRD_ASSETS.glideA,
    left: 83, top: 12, widthPx: 28, opacity: 0.9, blurPx: 0,
    direction: "ltr", speedPxPerSecond: 7.5,
    verticalAmplitudePx: 2.5, verticalDurationSeconds: 19,
  },
  {
    id: "pair_a", group: "pair", asset: DAY_BIRD_ASSETS.flightA,
    left: 74, top: 13, widthPx: 20, opacity: 0.82, blurPx: 0.3,
    direction: "ltr", speedPxPerSecond: 6.8,
    verticalAmplitudePx: 2, verticalDurationSeconds: 22,
  },
  {
    id: "pair_b", group: "pair", asset: DAY_BIRD_ASSETS.glideB,
    left: 71, top: 16, widthPx: 18, opacity: 0.8, blurPx: 0.3,
    direction: "ltr", speedPxPerSecond: 7.4,
    verticalAmplitudePx: 1.8, verticalDurationSeconds: 25,
  },
  {
    id: "flock_c_1", group: "small_flock", asset: DAY_BIRD_ASSETS.glideA,
    left: 78, top: 9, widthPx: 16, opacity: 0.76, blurPx: 0.5,
    direction: "ltr", speedPxPerSecond: 6.5,
    verticalAmplitudePx: 1.5, verticalDurationSeconds: 17,
  },
  {
    id: "flock_c_2", group: "small_flock", asset: DAY_BIRD_ASSETS.flightA,
    left: 82, top: 11, widthPx: 14, opacity: 0.74, blurPx: 0.5,
    direction: "ltr", speedPxPerSecond: 7,
    verticalAmplitudePx: 1.5, verticalDurationSeconds: 20,
  },
  {
    id: "flock_c_3", group: "small_flock", asset: DAY_BIRD_ASSETS.glideB,
    left: 87, top: 13, widthPx: 12, opacity: 0.72, blurPx: 0.5,
    direction: "ltr", speedPxPerSecond: 7.6,
    verticalAmplitudePx: 1.5, verticalDurationSeconds: 23,
  },
];

export const DAY_BIRD_GROUPS = {
  LONE_GLIDER: "lone_glider",
  PAIR: "pair",
  SMALL_FLOCK: "small_flock",
};

export const DAY_BIRDS = BIRD_DEFS.map((def) => buildBird(def));

export const DAY_BIRD_TOTAL_COUNT = DAY_BIRDS.length;
