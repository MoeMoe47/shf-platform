// Road-following vehicle-motion engine for the Silicon Heartland Metaverse.
// Pure geometry/scheduling math only — no DOM, no animation-loop, no React.
//
// MET-15K — DEBUG / REFERENCE ONLY. MetaverseVehicleLayer.jsx and
// MetaverseTrafficLayer.jsx (the components that used to consume this
// module to render moving cars/buses) were deleted: the runtime-traced
// vehicle system is RETIRED_FROM_PRODUCTION (vehicle alignment read as
// visibly inaccurate). Nothing in the production render path imports this
// file anymore. It is kept because the interpolation/perspective/stagger
// math is still useful reference for the future Cinematic Living City
// Layer (MET-16) — see docs/metaverse/MET-15K_CLEANUP_NOTES.md. Do not
// re-wire this into production without owner review.
// Presentation-only / DECORATIVE — grants no authority, implements no
// freeway-streak, cloud, bird, or turbine behavior.

import { METAVERSE_SCENE_IMAGE_ASPECT_RATIO } from "./metaverseCameraProjection.js";

function distance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

// The world box is locked to the source image's aspect ratio (1672:941,
// not square — see metaverseCameraProjection.js), but road-trace points
// are stored as 0-100 x/y percentages of that box. Equal x% and y% deltas
// therefore do NOT cover equal on-screen pixel distances, so a heading
// computed with a plain atan2(dy, dx) would point in a direction that
// looks visibly wrong once rendered (MET-15H traffic-realism audit).
// Scaling dx by the aspect ratio before the atan2 call corrects for this:
// pixel_dx = dx% * W, pixel_dy = dy% * H, and
// atan2(pixel_dy, pixel_dx) == atan2(dy%, dx% * (W/H)) for any positive H.
function headingDegBetween(a, b) {
  return (Math.atan2(b.y - a.y, (b.x - a.x) * METAVERSE_SCENE_IMAGE_ASPECT_RATIO) * 180) / Math.PI;
}

// Length of every segment in the polyline, in the same 0-100 scene units as
// the points themselves.
export function computePolylineSegmentLengths(points) {
  const lengths = [];
  for (let i = 1; i < points.length; i += 1) {
    lengths.push(distance(points[i - 1], points[i]));
  }
  return lengths;
}

export function computePolylineLength(points) {
  return computePolylineSegmentLengths(points).reduce((sum, length) => sum + length, 0);
}

// Given a polyline and a progress value in [0, 1], walks the cumulative
// segment lengths to find which segment progress*totalLength falls in, then
// linearly interpolates within that segment. Every intermediate point is a
// real waypoint the walk passes through — there is no first-point-to-
// last-point shortcut, and a polyline with 3+ points always produces a
// piecewise (curved-looking) path, not a straight line, unless the points
// themselves happen to be collinear.
export function resolvePolylinePosition(points, progress) {
  if (!Array.isArray(points) || points.length === 0) return null;
  if (points.length === 1) return { x: points[0].x, y: points[0].y, headingDeg: 0 };

  const clamped = Math.min(1, Math.max(0, progress));
  const segmentLengths = computePolylineSegmentLengths(points);
  const totalLength = segmentLengths.reduce((sum, length) => sum + length, 0);

  if (totalLength === 0) {
    return { x: points[0].x, y: points[0].y, headingDeg: 0 };
  }

  const targetLength = clamped * totalLength;
  let travelled = 0;
  for (let i = 0; i < segmentLengths.length; i += 1) {
    const segmentLength = segmentLengths[i];
    const segmentEnd = travelled + segmentLength;
    const isLastSegment = i === segmentLengths.length - 1;
    // Strictly-less (not <=) so that landing exactly on a corner resolves
    // via the OUTGOING segment's heading, consistent with
    // buildPolylineKeyframeStops assigning each point the heading of the
    // segment leaving it. isLastSegment is still required as a fallback so
    // progress === 1 terminates on the final point instead of falling
    // through the loop.
    if (targetLength < segmentEnd || isLastSegment) {
      const a = points[i];
      const b = points[i + 1];
      const segmentProgress = segmentLength === 0 ? 0 : Math.min(1, Math.max(0, (targetLength - travelled) / segmentLength));
      return {
        x: a.x + (b.x - a.x) * segmentProgress,
        y: a.y + (b.y - a.y) * segmentProgress,
        headingDeg: headingDegBetween(a, b),
      };
    }
    travelled = segmentEnd;
  }
  const last = points[points.length - 1];
  return { x: last.x, y: last.y, headingDeg: 0 };
}

// Unwraps a sequence of -180..180 headings into a continuous (no
// wraparound-jump) sequence, so that a rotation transform animated across
// these stops turns the short way each time instead of snapping (except at
// a genuine direction reversal — see buildRoundTripKeyframeStops).
export function unwrapHeadingsDeg(headings) {
  if (headings.length === 0) return [];
  const result = [headings[0]];
  for (let i = 1; i < headings.length; i += 1) {
    let delta = headings[i] - headings[i - 1];
    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;
    result.push(result[i - 1] + delta);
  }
  return result;
}

// Builds one keyframe "stop" per real polyline point, at the percentage of
// total path length that point falls at. This is what MetaverseVehicleLayer
// / MetaverseTrafficLayer turn into a CSS @keyframes rule: the browser then
// linearly interpolates left/top (and scale) between consecutive real
// points, which is exactly resolvePolylinePosition's own interpolation
// rule, just evaluated natively per-frame instead of in JS.
export function buildPolylineKeyframeStops(points) {
  if (!Array.isArray(points) || points.length === 0) return [];
  if (points.length === 1) return [{ percent: 0, x: points[0].x, y: points[0].y, headingDeg: 0 }, { percent: 100, x: points[0].x, y: points[0].y, headingDeg: 0 }];

  const segmentLengths = computePolylineSegmentLengths(points);
  const totalLength = segmentLengths.reduce((sum, length) => sum + length, 0);

  const headings = segmentLengths.map((_, i) => headingDegBetween(points[i], points[i + 1]));
  headings.push(headings[headings.length - 1]);
  const unwrapped = unwrapHeadingsDeg(headings);

  let travelled = 0;
  const stops = points.map((point, i) => {
    const percent = totalLength === 0 ? (i / (points.length - 1)) * 100 : (travelled / totalLength) * 100;
    if (i < segmentLengths.length) travelled += segmentLengths[i];
    return { percent, x: point.x, y: point.y, headingDeg: unwrapped[i] };
  });
  stops[stops.length - 1].percent = 100;
  return stops;
}

// MET-15H — every canonical road-trace/bus-route polyline is a one-way
// traced segment, not a closed loop, so a vehicle that only ever played it
// forward would either teleport back to the start (jarring) or need
// animation-direction: alternate (which mirrors the SAME forward-baked
// heading during the reverse half, leaving the vehicle facing forward
// while visually travelling backward — a real "pointed opposite the lane
// direction" failure). Baking the return leg explicitly into one 0-100%
// cycle (forward 0-50%, reverse 50-100% over the reversed point list) with
// animation-direction: normal fixes this: heading is correct for both
// directions of travel, at the cost of an intentional, brief heading snap
// at the two genuine turn-around points (the path's dead end at 50%, and
// the loop restart at 100%->0%) — exactly where a real vehicle would turn
// around, so this reads as correct rather than as a glitch.
export function buildRoundTripKeyframeStops(points) {
  if (!Array.isArray(points) || points.length < 2) return buildPolylineKeyframeStops(points);

  const forward = buildPolylineKeyframeStops(points);
  const backward = buildPolylineKeyframeStops([...points].reverse());

  // Unwrap heading across the FULL round trip (not each pass separately)
  // so the transition at the halfway point turns the short way whenever
  // the geometry allows it, and only snaps where a real reversal happens.
  const combinedHeadings = unwrapHeadingsDeg([
    ...forward.map((stop) => stop.headingDeg),
    ...backward.map((stop) => stop.headingDeg),
  ]);

  const forwardStops = forward.map((stop, i) => ({ ...stop, percent: stop.percent / 2, headingDeg: combinedHeadings[i] }));
  const backwardStops = backward.map((stop, i) => ({
    ...stop,
    percent: 50 + stop.percent / 2,
    headingDeg: combinedHeadings[forward.length + i],
  }));
  // backwardStops[0] is the same physical point as forwardStops' last
  // entry (both are the path's far end) — drop the duplicate.
  backwardStops.shift();

  const stops = [...forwardStops, ...backwardStops];
  stops[stops.length - 1].percent = 100;
  return stops;
}

// --- Perspective scaling -----------------------------------------------
// "Higher on screen = farther = smaller; lower on screen = closer = larger"
// implemented as one continuous linear function of y (0-100), rather than
// three discrete per-band scale values, per MET-15D Phase 5's preference
// for continuous interpolation over abrupt jumps. At the FAR/MID/NEAR band
// boundaries (y=42, y=72) this lands at ~1.29x / ~1.50x, matching the
// suggested mid (~1.2-1.5x) and near (~1.5-1.9x) ranges; VEHICLE_SCALE_MAX
// keeps the y=100 case safely under the 1.9x hard cap.
export const VEHICLE_SCALE_MIN = 1.0;
export const VEHICLE_SCALE_MAX = 1.7;
export const VEHICLE_SCALE_ABSOLUTE_CAP = 1.9;

export function computeVehiclePerspectiveScale(y) {
  const clampedY = Math.min(100, Math.max(0, y));
  const t = clampedY / 100;
  const scale = VEHICLE_SCALE_MIN + t * (VEHICLE_SCALE_MAX - VEHICLE_SCALE_MIN);
  return Math.min(VEHICLE_SCALE_ABSOLUTE_CAP, scale);
}

// --- Speed profiles -------------------------------------------------------
// Seconds to traverse one full polyline end-to-end, by road category.
// Deliberately slow across the board ("the animation must still feel
// calm"); FREEWAY is the fastest tier but still restrained relative to the
// others, not a "race through the city" speed.
export const VEHICLE_SPEED_PROFILE_SECONDS = {
  BUS: [42, 58],
  DISTRICT_CONNECTOR: [26, 34],
  MAJOR_ROAD: [20, 28],
  BRIDGE: [20, 28],
  FREEWAY: [15, 21],
};

// Deterministic (not Math.random) pick within a category's range, varied by
// index so multiple vehicles on the same path/category don't all share
// identical timing.
export function resolveSpeedSeconds(category, index = 0) {
  const [min, max] = VEHICLE_SPEED_PROFILE_SECONDS[category] || VEHICLE_SPEED_PROFILE_SECONDS.MAJOR_ROAD;
  const span = max - min;
  const steps = 5;
  const stepValue = span * ((index % steps) / (steps - 1));
  return Math.round((min + stepValue) * 10) / 10;
}

// Deterministic negative animation-delay so `count` vehicles sharing one
// path start already evenly spaced along it (no stacking, no nose-to-tail
// simultaneous spawn) instead of all beginning at the path's start point.
export function computeStaggerDelaySeconds(index, count, durationSeconds) {
  if (count <= 1 || index === 0) return 0;
  return -((index / count) * durationSeconds);
}

// --- Density -------------------------------------------------------------
// Sparse-by-design car counts per road category; "civic" (MAJOR_ROAD_04,
// the calm cross-axis in front of Civic Plaza) is treated as extremely
// sparse regardless of general MAJOR_ROAD tier.
const CAR_COUNT_BY_CATEGORY = {
  FREEWAY: 2,
  MAJOR_ROAD: 1,
  DISTRICT_CONNECTOR: 1,
  BRIDGE: 1,
};
const CIVIC_PATH_IDS = new Set(["MAJOR_ROAD_04"]);

export function getCarCountForPath(path, performanceMode = "STANDARD") {
  if (performanceMode === "LOW") {
    // LOW mode: freeways keep a single car (still "a few... staggered" is
    // satisfied loosely at the scene level across 3 freeways); everything
    // else drops to 0 so total on-screen vehicle count falls substantially.
    return path.pathTypes.includes("FREEWAY") ? 1 : 0;
  }
  if (CIVIC_PATH_IDS.has(path.id)) return 1;
  for (const type of path.pathTypes) {
    if (CAR_COUNT_BY_CATEGORY[type] != null) return CAR_COUNT_BY_CATEGORY[type];
  }
  return 1;
}

export function getBusCountForRoute(performanceMode = "STANDARD") {
  return performanceMode === "LOW" ? 0 : 1;
}

// Builds the full deterministic list of car vehicles for a set of road
// traces (the same shape MetaverseVehicleLayer renders) — extracted as a
// pure, registry-agnostic function so it can be unit-tested directly
// instead of only indirectly through component rendering.
export function buildCarManifest(roadTraces, performanceMode = "STANDARD") {
  const list = [];
  for (const path of roadTraces) {
    const count = getCarCountForPath(path, performanceMode);
    const category = categoryForPathTypes(path.pathTypes);
    for (let i = 0; i < count; i += 1) {
      const durationSeconds = resolveSpeedSeconds(category, i);
      list.push({
        id: `${path.id}-car-${i}`,
        pathId: path.id,
        points: path.points,
        durationSeconds,
        delaySeconds: computeStaggerDelaySeconds(i, count, durationSeconds),
      });
    }
  }
  return list;
}

// `resolvePointsFn` is injected (rather than importing
// metaverseRoadTraceRegistry.js here) so this module stays generic/
// registry-agnostic and trivially testable with mock routes.
export function buildBusManifest(busRoutes, resolvePointsFn, performanceMode = "STANDARD") {
  const list = [];
  for (const route of busRoutes) {
    const count = getBusCountForRoute(performanceMode);
    const points = resolvePointsFn(route.id);
    if (points.length < 2) continue;
    for (let i = 0; i < count; i += 1) {
      const durationSeconds = resolveSpeedSeconds("BUS", i);
      list.push({
        id: `${route.id}-bus-${i}`,
        routeId: route.id,
        points,
        durationSeconds,
        delaySeconds: computeStaggerDelaySeconds(i, count, durationSeconds),
      });
    }
  }
  return list;
}

// Resolves the single speed-profile category a path/route should use for
// resolveSpeedSeconds, given its pathTypes (roads) — buses always use the
// BUS category regardless of which roads they're built from.

// Renders one polyline as a full round-trip CSS @keyframes rule (left/top
// position + perspective scale + heading rotation baked into every real
// waypoint, forward leg then back — see buildRoundTripKeyframeStops for
// why heading needs the explicit round trip instead of animation-direction:
// alternate). Sprites are authored wide-and-short (see .met-vehicle--car/
// --bus), i.e. already "pointing" along +x, which is exactly what
// headingDeg=0 (atan2 with dx>0, dy=0) means — so rotate(headingDeg) needs
// no extra offset to line up with the sprite's own default orientation.
export function buildVehicleKeyframesCss(animationName, points) {
  const stops = buildRoundTripKeyframeStops(points);
  const rules = stops
    .map((stop) => {
      const scale = computeVehiclePerspectiveScale(stop.y);
      return `${stop.percent.toFixed(3)}% { left: ${stop.x}%; top: ${stop.y}%; transform: translate(-50%, -50%) rotate(${stop.headingDeg.toFixed(2)}deg) scale(${scale.toFixed(3)}); }`;
    })
    .join(" ");
  return `@keyframes ${animationName} { ${rules} }`;
}

// Position-only variant (no perspective scale, no transform) used by the
// legacy per-district MetaverseTrafficLayer: it fixes that layer's movement
// to follow every polyline point (MET-15D Phase 2) without touching its
// existing (pre-MET-15D, owner-authored) vehicle sizing/styling, which is
// out of this phase's scope for scenes other than the canonical
// city-overview one.
export function buildPositionOnlyKeyframesCss(animationName, points) {
  const stops = buildPolylineKeyframeStops(points);
  const rules = stops.map((stop) => `${stop.percent.toFixed(3)}% { left: ${stop.x}%; top: ${stop.y}%; }`).join(" ");
  return `@keyframes ${animationName} { ${rules} }`;
}

export function categoryForPathTypes(pathTypes) {
  if (pathTypes.includes("FREEWAY")) return "FREEWAY";
  if (pathTypes.includes("BRIDGE")) return "BRIDGE";
  if (pathTypes.includes("DISTRICT_CONNECTOR")) return "DISTRICT_CONNECTOR";
  return "MAJOR_ROAD";
}
