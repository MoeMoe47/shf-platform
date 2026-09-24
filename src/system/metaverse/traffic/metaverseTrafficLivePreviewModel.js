// MET-16B — Calibrated Route Live Traffic Preview: pure model.
//
// LOCKED PRINCIPLE: manual routes authored in MET-16A are authoritative for
// traffic geometry. Nothing in this file (or the rest of MET-16B) infers,
// extends, or corrects a route's points — it only reads the owner's
// existing `points`/`perspective`/`occlusion_segments` and animates a
// vehicle along them, reusing the exact same spline/arc-length/perspective/
// occlusion primitives MET-16A's Ghost Preview already uses
// (metaverseTrafficAuthoringModel.js) rather than a second movement engine,
// so the Ghost Preview and a real vehicle can never disagree spatially.
//
// This is a developer-only PREVIEW. Nothing exported from this file is
// wired into production traffic, and no route status (including APPROVED)
// causes any change here beyond which routes are eligible for the "All
// Calibrated/Approved Routes" bulk preview scope.
import {
  interpolatePerspectiveScale,
  isProgressOccluded,
  sampleRouteAtProgress,
} from "./metaverseTrafficAuthoringModel.js";

// Deliberately a separate constant from GHOST_PREVIEW_BASE_PROGRESS_PER_SECOND
// (see metaverseTrafficAuthoringModel.js) — traffic preview speed must stay
// independently tunable from Ghost Preview speed (MET-16B Section 11).
export const TRAFFIC_PREVIEW_BASE_PROGRESS_PER_SECOND = 0.4;

export const TRAFFIC_PREVIEW_SPEED_PRESETS = [
  { multiplier: 0.25, label: "Inspection" },
  { multiplier: 0.5, label: "Slow Traffic" },
  { multiplier: 0.75, label: "Moderate" },
  { multiplier: 1, label: "Nominal" },
];

export const TRAFFIC_PREVIEW_DEFAULT_SPEED_MULTIPLIER = 0.25;

export function resolveTrafficPreviewSpeedLabel(multiplier) {
  const preset = TRAFFIC_PREVIEW_SPEED_PRESETS.find((entry) => entry.multiplier === multiplier);
  return preset ? preset.label : "Custom";
}

export function resolveTrafficPreviewProgressPerSecond(multiplier) {
  const safeMultiplier = typeof multiplier === "number" && multiplier > 0 ? multiplier : TRAFFIC_PREVIEW_DEFAULT_SPEED_MULTIPLIER;
  return safeMultiplier * TRAFFIC_PREVIEW_BASE_PROGRESS_PER_SECOND;
}

export const TRAFFIC_PREVIEW_ROUTE_SCOPES = ["ACTIVE_ONLY", "ALL_CALIBRATED"];
export const TRAFFIC_PREVIEW_DEFAULT_ROUTE_SCOPE = "ACTIVE_ONLY";

// Section 3: maximum 3 vehicles per route for this phase.
export const TRAFFIC_PREVIEW_VEHICLE_COUNTS = [1, 2, 3];
export const TRAFFIC_PREVIEW_DEFAULT_VEHICLE_COUNT = 1;
export const TRAFFIC_PREVIEW_MAX_VEHICLES_PER_ROUTE = 3;

// Section 5 — a small, fixed, non-bus/non-truck set. Cycled deterministically
// by slot index (never random) so multiple vehicles on one route are
// visually distinguishable without any vehicle-choice "AI" — used only as
// the fallback when a route declares no recognized vehicle_classes at all
// (see resolveVehicleVisualForRoute below, which is the primary selector).
export const TRAFFIC_PREVIEW_VEHICLE_TYPES = ["SEDAN", "SUV", "VAN", "SMALL_TRUCK"];

export function resolveVehicleTypeForSlot(slotIndex) {
  return TRAFFIC_PREVIEW_VEHICLE_TYPES[slotIndex % TRAFFIC_PREVIEW_VEHICLE_TYPES.length];
}

// MET-16B patch (real vehicle assets) Section 1-3 — a small, fixed,
// non-bus/non-heavy-truck visual set, each a hand-authored transparent
// top-down SVG silhouette (no image-generation tool is available in this
// environment, and a photographed side/3-4 view asset would render
// incorrectly once rotated to an arbitrary heading in this top-down 2.5D
// camera — a top-down silhouette is the format that actually rotates
// correctly to any spline tangent, which is also why the mission listed
// "top" as an acceptable view alongside side/3-4).
//
// `length`/`width` are the vehicle's footprint in scene units at scale 1,
// matching the previous placeholder-rect dimensions so this patch changes
// only how a vehicle is drawn, never its size/collision footprint.
// `baseRotationOffsetDeg` exists so a future re-authored or swapped-in
// asset whose "forward" doesn't point along heading 0deg (right/east, this
// codebase's convention — see sampleRouteAtProgress) can be corrected
// without ever touching route direction; every asset shipped here is
// already drawn nose-right, so every offset is 0.
export const TRAFFIC_PREVIEW_VEHICLE_VISUALS = {
  SEDAN: { asset: "public/assets/metaverse/traffic/vehicles/sedan.svg", length: 2.3, width: 1.05, baseRotationOffsetDeg: 0 },
  SUV: { asset: "public/assets/metaverse/traffic/vehicles/suv.svg", length: 2.5, width: 1.3, baseRotationOffsetDeg: 0 },
  VAN: { asset: "public/assets/metaverse/traffic/vehicles/van.svg", length: 2.9, width: 1.2, baseRotationOffsetDeg: 0 },
  SMALL_TRUCK: { asset: "public/assets/metaverse/traffic/vehicles/small-truck.svg", length: 2.8, width: 1.25, baseRotationOffsetDeg: 0 },
};

// Section 3 — maps a route's declared vehicle_classes to a visual. CAR maps
// to the sedan visual (there is no separate "CAR" asset — a sedan IS the
// generic car). Unsupported/unrecognized classes never crash: they fall
// through to the next declared class, and if none of a route's declared
// classes are recognized at all, fall back to the deterministic per-slot
// cycle (still never a hardcoded "just always sedan", but never invents a
// class the route didn't declare either).
const VEHICLE_CLASS_TO_VISUAL = {
  CAR: "SEDAN",
  SUV: "SUV",
  VAN: "VAN",
  SMALL_TRUCK: "SMALL_TRUCK",
};

export function resolveVehicleVisualForClass(vehicleClass) {
  return VEHICLE_CLASS_TO_VISUAL[vehicleClass] || null;
}

export function resolveVehicleVisualForRoute(route, fallbackSlotIndex = 0) {
  const classes = Array.isArray(route?.vehicle_classes) ? route.vehicle_classes : [];
  for (const vehicleClass of classes) {
    const visual = resolveVehicleVisualForClass(vehicleClass);
    if (visual) return visual;
  }
  return resolveVehicleTypeForSlot(fallbackSlotIndex);
}

// Section 5 — normalizes a spline-tangent heading plus a per-asset base
// rotation correction into the final render angle, without ever touching
// the route's own authored direction.
export function applyBaseRotationOffset(headingDeg, baseRotationOffsetDeg = 0) {
  return normalizeHeadingDeg(headingDeg + (baseRotationOffsetDeg || 0));
}

// Section 6 — a dev-only GLOBAL scale multiplier for judging vehicle
// footprint against the roadway, independent of (and multiplied on top of)
// each route's own per-progress perspective scale. Never affects route
// geometry, never persisted with a route, never touches production.
export const TRAFFIC_PREVIEW_VEHICLE_SCALE_PRESETS = [0.5, 0.75, 1, 1.25];
export const TRAFFIC_PREVIEW_DEFAULT_VEHICLE_SCALE = 0.75;

export function resolvePreviewVehicleScale(multiplier) {
  return TRAFFIC_PREVIEW_VEHICLE_SCALE_PRESETS.includes(multiplier) ? multiplier : TRAFFIC_PREVIEW_DEFAULT_VEHICLE_SCALE;
}

// Section 14 — "do not visibly teleport back to start": a loop restart waits
// this long, hidden, before resuming from progress 0.
export const TRAFFIC_PREVIEW_RESPAWN_PAUSE_SECONDS = 0.4;

// Section 9 — used only when a route has no perspective keys at all, so a
// vehicle still renders at a reasonable, clearly-labeled size instead of
// silently inventing depth data. interpolatePerspectiveScale already
// returns 1 for an empty perspective array, so this is the same neutral
// value made explicit and named here.
export const TRAFFIC_PREVIEW_UNCALIBRATED_SCALE = 1;

// ---------------------------------------------------------------------------
// Deterministic multi-vehicle spacing (Section 12)
// ---------------------------------------------------------------------------

// Evenly-spaced starting progress offsets, e.g. count=3 -> [0, 1/3, 2/3].
// Deterministic and order-stable — never randomized — so re-opening preview
// with the same vehicle count always places vehicles the same way.
export function computeDeterministicVehicleOffsets(vehicleCount) {
  const count = Math.max(1, Math.min(TRAFFIC_PREVIEW_MAX_VEHICLES_PER_ROUTE, Math.round(vehicleCount) || 1));
  const offsets = [];
  for (let i = 0; i < count; i += 1) offsets.push(i / count);
  return offsets;
}

export function createVehicleState(offset) {
  return { progress: offset, ended: false, respawnRemaining: 0 };
}

// ---------------------------------------------------------------------------
// Monotonic progress / route-end behavior (Section 7, 14) — no ping-pong
// ---------------------------------------------------------------------------

// Pure per-vehicle state transition, called once per animation frame with
// real elapsed time (`dtSeconds`). Progress only ever increases; it is never
// decremented, wrapped backward, or snapped. At the end of the route:
//   - loop = false: progress clamps at 1 and `ended` latches true (the
//     caller renders nothing for an ended vehicle — a clean despawn, not a
//     reverse-and-drive-back).
//   - loop = true: the vehicle is held hidden for
//     TRAFFIC_PREVIEW_RESPAWN_PAUSE_SECONDS (`respawnRemaining` counts down)
//     before progress resets to exactly 0, so a restart is never a visible
//     mid-frame teleport of a visible vehicle.
export function advanceVehicleState(state, dtSeconds, progressPerSecond, { loop = false } = {}) {
  if (state.ended) return state;
  if (state.respawnRemaining > 0) {
    const remaining = state.respawnRemaining - dtSeconds;
    if (remaining > 0) return { ...state, respawnRemaining: remaining };
    return { progress: 0, ended: false, respawnRemaining: 0 };
  }
  const nextProgress = state.progress + Math.max(0, dtSeconds) * progressPerSecond;
  if (nextProgress >= 1) {
    if (loop) return { progress: 1, ended: false, respawnRemaining: TRAFFIC_PREVIEW_RESPAWN_PAUSE_SECONDS };
    return { progress: 1, ended: true, respawnRemaining: 0 };
  }
  return { progress: nextProgress, ended: false, respawnRemaining: 0 };
}

export function isVehicleVisible(state) {
  return !state.ended && state.respawnRemaining <= 0;
}

// ---------------------------------------------------------------------------
// Smooth tangent-based heading (Section 8) — handles the 359deg -> 0deg wrap
// ---------------------------------------------------------------------------

export function normalizeHeadingDeg(deg) {
  return ((deg % 360) + 360) % 360;
}

// Interpolates from `previousDeg` toward `targetDeg` by the SHORTEST angular
// path (so 359deg -> 2deg turns forward by 3deg, not backward by 357deg),
// smoothing rotation across spline-sample boundaries rather than snapping
// to each sample's raw tangent. `smoothingFactor` of 1 snaps immediately
// (used to seed the very first frame); anything less eases toward the
// target over subsequent frames.
export function smoothHeadingDeg(previousDeg, targetDeg, smoothingFactor = 0.35) {
  if (typeof previousDeg !== "number" || Number.isNaN(previousDeg)) return normalizeHeadingDeg(targetDeg);
  const clampedFactor = Math.min(1, Math.max(0, smoothingFactor));
  const delta = ((((targetDeg - previousDeg) % 360) + 540) % 360) - 180;
  return normalizeHeadingDeg(previousDeg + delta * clampedFactor);
}

// ---------------------------------------------------------------------------
// Composed per-frame vehicle appearance (Sections 6, 8, 9, 10)
// ---------------------------------------------------------------------------

// Reuses sampleRouteAtProgress (spline + arc-length), interpolatePerspectiveScale,
// and isProgressOccluded verbatim — this function only composes them and adds
// heading smoothing; it introduces no alternative geometry/interpolation of
// its own.
export function resolveVehicleAppearance({ route, vehicleState, previousHeadingDeg, headingSmoothingFactor = 0.35 }) {
  if (!route || !Array.isArray(route.points) || route.points.length < 2) return null;
  if (!isVehicleVisible(vehicleState)) return null;
  const sample = sampleRouteAtProgress(route.points, vehicleState.progress);
  if (!sample) return null;
  const perspectiveCalibrated = Array.isArray(route.perspective) && route.perspective.length > 0;
  const scale = perspectiveCalibrated
    ? interpolatePerspectiveScale(route.perspective, vehicleState.progress)
    : TRAFFIC_PREVIEW_UNCALIBRATED_SCALE;
  const occluded = isProgressOccluded(route.occlusion_segments, vehicleState.progress);
  const headingDeg = smoothHeadingDeg(previousHeadingDeg, sample.headingDeg, headingSmoothingFactor);
  return {
    x: sample.x,
    y: sample.y,
    headingDeg,
    scale,
    perspectiveCalibrated,
    occluded,
    progress: vehicleState.progress,
  };
}

// ---------------------------------------------------------------------------
// Route scope selection (Sections 3, 20, 21) — reads owner data only
// ---------------------------------------------------------------------------

export function isRouteReadyForPreview(route) {
  return Boolean(route && Array.isArray(route.points) && route.points.length >= 2);
}

// ACTIVE_ONLY: exactly the currently-selected route (Section 20's primary
// workflow). ALL_CALIBRATED: every route the owner has explicitly marked
// CALIBRATED or APPROVED (never DRAFT — Section 21 restricts the bulk view
// to routes the owner has already vetted individually; DRAFT routes remain
// testable one at a time via ACTIVE_ONLY, per Section 18).
export function selectRoutesForPreviewScope(routes, scope, activeRouteId) {
  const readyRoutes = (routes || []).filter(isRouteReadyForPreview);
  if (scope === "ALL_CALIBRATED") {
    return readyRoutes.filter((route) => route.status === "CALIBRATED" || route.status === "APPROVED");
  }
  const active = readyRoutes.find((route) => route.id === activeRouteId);
  return active ? [active] : [];
}
