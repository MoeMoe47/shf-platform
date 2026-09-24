// MET-16B — First Live Traffic Corridor: pure production-runtime model.
//
// LOCKED PRINCIPLE (same as MET-16A/16B authoring + preview): this file
// never infers, extends, or corrects a route's authored geometry. It reads
// exactly one owner-approved route from metaverseTrafficRoutes.json,
// unmodified, and reuses the EXACT same spline/arc-length/heading/
// perspective/occlusion primitives the authoring Ghost Preview and the
// developer Live Traffic Preview already use
// (metaverseTrafficAuthoringModel.js, metaverseTrafficLivePreviewModel.js)
// rather than a second movement engine. This module only adds the small
// amount of behavior specific to a believable *production* corridor that
// the dev preview intentionally does not need: bounded deterministic
// per-vehicle speed variance, a perspective fallback for a route with no
// authored perspective keys yet, and its own explicit review-only gate
// (separate from `?trafficAuthor=1`, which gates the authoring tool).
//
// NOT the retired MET-15K system: this never reads metaverseRoadTraceRegistry.js
// or metaverseVehicleMotion.js (that system was RETIRED_FROM_PRODUCTION —
// see docs/metaverse/MET-15K_CLEANUP_NOTES.md — because AI-traced road
// geometry produced visibly inaccurate vehicle alignment). Every position
// here comes from an owner-authored, owner-approved route only.
import {
  interpolatePerspectiveScale,
  isProgressOccluded,
  sampleRouteAtProgress,
  suggestPerspectiveScaleForY,
} from "./metaverseTrafficAuthoringModel.js";
import {
  advanceVehicleState,
  computeDeterministicVehicleOffsets,
  createVehicleState,
  isVehicleVisible,
  smoothHeadingDeg,
} from "./metaverseTrafficLivePreviewModel.js";

// ---------------------------------------------------------------------------
// Review-only gate (separate from resolveTrafficAuthoringEnabled)
// ---------------------------------------------------------------------------
//
// MET-16B owner decision: production wiring must stay OFF by default and
// behind its own explicit review flag until the owner has visually
// approved the corridor — it must NOT ship straight to normal city view.
// Requires a dev build (same safety rail as the authoring tool) plus an
// explicit `?trafficCorridorReview=1` (or bare `?trafficCorridorReview`)
// query param. This is intentionally a different flag from
// `?trafficAuthor=1` — turning the corridor on must never require, and
// must never visually mix with, opening the authoring tool.
export function resolveTrafficCorridorReviewEnabled({ isDev, search }) {
  if (!isDev) return false;
  const params = new URLSearchParams(search || "");
  if (!params.has("trafficCorridorReview")) return false;
  const value = params.get("trafficCorridorReview");
  return value !== "0" && value !== "false";
}

// ---------------------------------------------------------------------------
// Corridor selection (Section 2 — exactly one route)
// ---------------------------------------------------------------------------
//
// Hardcoded to the one approved, CAR-class route selected for this phase:
// "route-1-1-mu6436lq" ("Route 1") — the longer of the two CAR-eligible
// APPROVED routes (~39.9 scene units vs. ~33.65) with monotonic, smooth
// (non-reversing) geometry, so it gives the longest, cleanest read on
// motion. See docs/metaverse/MET-16B_FIRST_LIVE_TRAFFIC_CORRIDOR.md.
// Picking by id rather than "first APPROVED CAR route found" is
// deliberate: activating a second or third route later must be an
// explicit, reviewed code change, never an automatic consequence of the
// owner authoring/approving more routes in the tool.
export const TRAFFIC_CORRIDOR_ROUTE_ID = "route-1-1-mu6436lq";

export function selectTrafficCorridorRoute(routes) {
  const route = (routes || []).find((candidate) => candidate.id === TRAFFIC_CORRIDOR_ROUTE_ID);
  if (!route) return null;
  if (route.status !== "APPROVED") return null;
  if (!Array.isArray(route.vehicle_classes) || !route.vehicle_classes.includes("CAR")) return null;
  if (!Array.isArray(route.points) || route.points.length < 2) return null;
  return route;
}

// ---------------------------------------------------------------------------
// Vehicle count / spacing (Section 3, 9)
// ---------------------------------------------------------------------------

export const TRAFFIC_CORRIDOR_VEHICLE_COUNT = 3; // within the 2-4 bound
export const TRAFFIC_CORRIDOR_MIN_VEHICLE_COUNT = 2;
export const TRAFFIC_CORRIDOR_MAX_VEHICLE_COUNT = 4;

export function resolveTrafficCorridorVehicleCount(requested = TRAFFIC_CORRIDOR_VEHICLE_COUNT) {
  const value = Math.round(requested) || TRAFFIC_CORRIDOR_VEHICLE_COUNT;
  return Math.max(TRAFFIC_CORRIDOR_MIN_VEHICLE_COUNT, Math.min(TRAFFIC_CORRIDOR_MAX_VEHICLE_COUNT, value));
}

// ---------------------------------------------------------------------------
// Speed (Section 8) — bounded, deterministic per-vehicle variance
// ---------------------------------------------------------------------------
//
// The route's speed_class (BOULEVARD/URBAN_SLOW/FREEWAY) maps to a base
// progress-per-second rate; each vehicle then gets a small, FIXED (never
// random) variance by slot index so multiple cars are distinguishable
// without any car ever accelerating/decelerating on its own — matching
// the codebase-wide "deterministic, never randomized" convention already
// used for vehicle spacing/type cycling in metaverseTrafficLivePreviewModel.js.
export const TRAFFIC_CORRIDOR_SPEED_CLASS_BASE_RATE = {
  URBAN_SLOW: 0.05,
  BOULEVARD: 0.09,
  FREEWAY: 0.16,
};

// Alternating +/-, magnitude grows slightly per slot, capped at 10%.
const SPEED_VARIANCE_BY_SLOT = [0, -0.05, 0.06, -0.08, 0.09];

export function resolveDeterministicSpeedVariance(slotIndex) {
  const variance = SPEED_VARIANCE_BY_SLOT[slotIndex % SPEED_VARIANCE_BY_SLOT.length];
  return Math.max(-0.1, Math.min(0.1, variance));
}

export function resolveTrafficCorridorProgressPerSecond(speedClass, slotIndex) {
  const baseRate = TRAFFIC_CORRIDOR_SPEED_CLASS_BASE_RATE[speedClass] || TRAFFIC_CORRIDOR_SPEED_CLASS_BASE_RATE.BOULEVARD;
  const variance = resolveDeterministicSpeedVariance(slotIndex);
  return baseRate * (1 + variance);
}

// ---------------------------------------------------------------------------
// Perspective fallback (Section 6) — only when the route has no authored
// perspective keys yet, falling back through three tiers: (1) the owner's
// own real perspective keys the moment any exist on the route itself —
// always wins; (2) a MET-16C review-scoped calibration for a route this
// file explicitly ships hand-tuned FAR/MID/NEAR keys for (currently just
// the reference corridor route, see TRAFFIC_CORRIDOR_REVIEW_PERSPECTIVE
// below); (3) the original MET-16B y-position heuristic for any other
// uncalibrated route. Tier 2 is intentionally NOT written into
// metaverseTrafficRoutes.json — that file is the owner's approved export
// and this repository's convention (and an explicit request from the
// session that authored it) is to never regenerate/overwrite it; storing
// the calibration here instead is functionally identical (real graduated
// scale keys, not a flat heuristic) without touching that file. The
// instant the owner adds real perspective keys to the route in the
// authoring tool and re-exports, tier 1 takes over automatically — no
// code change required here.
// ---------------------------------------------------------------------------

// MET-16C.1 Section 2 — re-measured against the actual production plate
// (public/assets/metaverse/city/silicon-heartland-city-day.png) rather
// than the route's y-range alone: at the route's near point (scene
// 39.6,96.0 -> pixel 662,903), one traffic lane there measures ~22-23px
// (~1.35 scene units), and a small reference vehicle already painted into
// that same background art measures ~21x9px (~1.26x0.54 scene units) — a
// realistic car-to-lane ratio. This repo's existing CAR footprint
// constant (TRAFFIC_PREVIEW_VEHICLE_VISUALS.SEDAN, length 2.3 / width
// 1.05) is therefore already roughly 2x that painted reference car's
// size even at scale 1.0, before any of this phase's increase — a
// deliberate legibility tradeoff (foreground/animated vehicles read
// larger than a static background decal in most 2.5D city UIs), not an
// oversight, but worth stating plainly rather than silently compounding.
// NEAR is raised +20% (1.0 -> 1.2, inside the requested 15-25% band) —
// at that scale a CAR's width (1.05*1.2=1.26 scene units) is ~93% of the
// measured lane width (~1.35), i.e. deliberately close to the lane's
// edge but not exceeding it. Two extra keys (t=0.25, t=0.75) were added
// beyond the original FAR/MID/NEAR so the falloff between them reads as
// gradual, not a 2-key linear ramp.
const TRAFFIC_CORRIDOR_REVIEW_PERSPECTIVE = {
  [TRAFFIC_CORRIDOR_ROUTE_ID]: [
    { t: 0, scale: 1.2 }, // NEAR
    { t: 0.25, scale: 1.0 },
    { t: 0.5, scale: 0.85 }, // MID
    { t: 0.75, scale: 0.68 },
    { t: 1, scale: 0.55 }, // FAR
  ],
};

export function resolveTrafficCorridorScale(route, sample) {
  const hasOwnerCalibration = Array.isArray(route?.perspective) && route.perspective.length > 0;
  if (hasOwnerCalibration) return { scale: interpolatePerspectiveScale(route.perspective, sample.progress), calibrated: true };
  const reviewKeys = TRAFFIC_CORRIDOR_REVIEW_PERSPECTIVE[route?.id];
  if (reviewKeys) return { scale: interpolatePerspectiveScale(reviewKeys, sample.progress), calibrated: true };
  return { scale: suggestPerspectiveScaleForY(sample.y), calibrated: false };
}

// ---------------------------------------------------------------------------
// Occlusion (Section 17) — same tiering rule as perspective above: the
// owner's own route.occlusion_segments always wins/merges in; this
// review-scoped segment is additive only for the reference corridor,
// visually grounded against the actual production plate.
//
// MET-16C.3 — owner review found a vehicle rendering in front of a
// bridge cable, i.e. NOT occluded when it visually should have been.
// Re-measured with the route's real arc-length-sampled spline plotted
// directly onto the plate (200-sample overlay, not eyeballed): the
// MET-16C `t=0.30-0.42` window was the root cause — it was too
// narrow/early. The bridge in this corridor has TWO cable-stayed towers
// close together; the first tower's own pylon base sits on the deck at
// t~=0.46-0.48 (AFTER the old window already ended), and its cable fan
// visually crosses the roadway from about t~=0.28 through t~=0.62. The
// second tower's fan begins overlapping before the first one's has
// cleared (its own pylon base sits at t~=0.75-0.78, fan crossing from
// about t~=0.62 through t~=0.84) — the two fans connect with no clean
// gap between them on this plate. A single continuous segment covering
// the full measured cable-dense span is used rather than several
// narrow per-cable segments: the raster background has no separate
// vector cable geometry to test per-frame vehicle position against, so
// simulating "briefly visible between individual thin cables" would be
// guesswork, and — per this phase's own requirement that occlusion
// "must be geometrically believable and STABLE while vehicles move" —
// a vehicle flickering visible/invisible every few cable-strands would
// look far worse than one deliberate, wide, genuinely cable-covered
// crossing.
const TRAFFIC_CORRIDOR_REVIEW_OCCLUSION = {
  [TRAFFIC_CORRIDOR_ROUTE_ID]: [{ from: 0.28, to: 0.84 }],
};

export function isTrafficCorridorReviewOccluded(routeId, progress) {
  const segments = TRAFFIC_CORRIDOR_REVIEW_OCCLUSION[routeId];
  return segments ? isProgressOccluded(segments, progress) : false;
}

// ---------------------------------------------------------------------------
// Spawn/despawn endpoint fade (Section 18) — a short opacity ramp only in
// the first/last few percent of route progress, never mid-route, so a
// vehicle eases in/out at the route's own start/end rather than a hard
// on/off cut. Deliberately narrow (3% of the route) so it reads as a
// quiet edge fade, not a visible dissolve.
// ---------------------------------------------------------------------------

export const TRAFFIC_CORRIDOR_ENDPOINT_FADE_WINDOW = 0.03;

export function resolveEndpointFadeOpacity(progress, fadeWindow = TRAFFIC_CORRIDOR_ENDPOINT_FADE_WINDOW) {
  const clamped = Math.min(1, Math.max(0, progress));
  if (clamped < fadeWindow) return clamped / fadeWindow;
  if (clamped > 1 - fadeWindow) return (1 - clamped) / fadeWindow;
  return 1;
}

// ---------------------------------------------------------------------------
// Composed per-frame vehicle appearance
// ---------------------------------------------------------------------------
//
// Deliberately mirrors metaverseTrafficLivePreviewModel.js#resolveVehicleAppearance
// (same spline sample, same occlusion check, same heading smoothing) but
// layers in the corridor's own perspective fallback above instead of the
// dev preview's "flat scale 1 until calibrated" behavior, since a
// production corridor should look right immediately, not just once the
// owner opens the authoring tool and adds perspective keys. Also merges
// in the review-scoped occlusion segment and the endpoint fade — both are
// route-fidelity improvements (not new routes/vehicles/composition), so
// they apply everywhere this shared function is used, including inside
// the all-routes review's advanceRouteFleetVehicles below (that mode's
// vehicle count/route set/gating are otherwise completely untouched).
export function resolveTrafficCorridorVehicleAppearance({ route, vehicleState, previousHeadingDeg, headingSmoothingFactor = 0.35 }) {
  if (!route || !Array.isArray(route.points) || route.points.length < 2) return null;
  if (!isVehicleVisible(vehicleState)) return null;
  const sample = sampleRouteAtProgress(route.points, vehicleState.progress);
  if (!sample) return null;
  const { scale, calibrated } = resolveTrafficCorridorScale(route, { ...sample, progress: vehicleState.progress });
  const occluded = isProgressOccluded(route.occlusion_segments, vehicleState.progress) || isTrafficCorridorReviewOccluded(route.id, vehicleState.progress);
  const headingDeg = smoothHeadingDeg(previousHeadingDeg, sample.headingDeg, headingSmoothingFactor);
  const opacity = resolveEndpointFadeOpacity(vehicleState.progress);
  return {
    x: sample.x,
    y: sample.y,
    headingDeg,
    scale,
    perspectiveCalibrated: calibrated,
    occluded,
    opacity,
    progress: vehicleState.progress,
  };
}

// ---------------------------------------------------------------------------
// Time-of-day glow (Section 12) — presentation constants only
// ---------------------------------------------------------------------------

// MET-16C.1 Section 6 — shadow opacity tuned into the brief's suggested
// 0.25-0.35 DAY/DUSK target range (was 0.20-0.22), still a small/close
// footprint (see TrafficVehicleMarker's rx/ry — unchanged, ~half the
// vehicle body), not a long directional cast shadow. NIGHT stays
// markedly reduced rather than fully omitted, so a vehicle doesn't read
// as floating against the lit night plate.
export const TRAFFIC_CORRIDOR_LIGHT_TREATMENT = {
  DAY: { headlightGlow: false, taillightGlow: false, bodyDarken: 0, shadowOpacity: 0.3 },
  DUSK: { headlightGlow: true, taillightGlow: true, bodyDarken: 0, shadowOpacity: 0.26 },
  NIGHT: { headlightGlow: true, taillightGlow: true, bodyDarken: 0.25, shadowOpacity: 0.14 },
};

export function resolveTrafficCorridorLightTreatment(timeOfDay) {
  return TRAFFIC_CORRIDOR_LIGHT_TREATMENT[timeOfDay] || TRAFFIC_CORRIDOR_LIGHT_TREATMENT.DAY;
}

// ---------------------------------------------------------------------------
// MET-16C Section 3/4/6 — reference-corridor-only vehicle composition
// (class mix + color palette + class-specific scale). Deliberately kept
// OUT of the shared engine functions above and out of
// advanceRouteFleetVehicles below: this is a hand-picked visual review
// fleet for THIS corridor, not a change to what vehicle_classes any route
// declares, and it must never affect the all-routes review (which
// continues to resolve vehicle type strictly from each route's own
// authored vehicle_classes, unchanged — see resolveVehicleVisualForRoute
// in metaverseTrafficLivePreviewModel.js).
// ---------------------------------------------------------------------------

// MET-16C.1 Section 10/Step 2 — SMALL_TRUCK was in this mix through
// MET-16C, but re-measuring lane width for the Section 2 NEAR-scale
// increase (see the perspective calibration comment above) showed a
// SMALL_TRUCK's NEAR-scale width (1.05 * 1.2 * 1.12 = 1.4112 scene
// units) would exceed the measured lane width (~1.35) by ~4.5% — a real
// lane overflow, not a rounding difference. Per this phase's own
// explicit instruction ("if it looks oversized on this corridor: disable
// SMALL TRUCK for this route"), the mix reverts to the brief's primary
// recommended composition: 2 CAR + 1 SUV (SUV's own NEAR width, 1.3608,
// is within measurement tolerance of the lane width and was kept).
// TRAFFIC_VEHICLE_CLASS_SCALE.SMALL_TRUCK and SmallTruckSilhouette both
// remain defined/exported for a future, wider-laned corridor — this is a
// composition choice for THIS route, not a removal of truck support.
export const TRAFFIC_CORRIDOR_REVIEW_VEHICLE_CLASS_MIX = ["CAR", "SUV", "CAR"];

export function resolveTrafficCorridorReviewVehicleClass(slotIndex) {
  return TRAFFIC_CORRIDOR_REVIEW_VEHICLE_CLASS_MIX[slotIndex % TRAFFIC_CORRIDOR_REVIEW_VEHICLE_CLASS_MIX.length];
}

// Section 6 — subtle, class-specific size multiplier layered on top of
// (multiplied with) the route's own perspective scale; never a
// replacement for it.
// MET-16C.2 Section 1 — owner visual review found the near-field SUV
// visually overfilling its lane at the prior 1.08 multiplier
// (1.05*1.2*1.08 = 1.3608 scene units, ~101% of the measured 1.35-unit
// lane from MET-16C.1). Retuned to 0.94, landing at 1.05*1.2*0.94 =
// 1.1844 (~87.7% lane occupancy — the middle of the requested 85-90%
// band). CAR is left at 1.0 (1.05*1.2 = 1.26, ~93.3% of the lane)
// unchanged, per this phase's explicit instruction not to reduce every
// class globally — only SUV measured as oversized. Net effect: SUV is
// now narrower than CAR in absolute scene units on THIS corridor, which
// inverts typical real-world car/SUV proportions; STEP 3's shape-only
// cues (taller roof profile, more rectangular body, longer cabin — see
// VehicleSilhouettes.jsx's SuvSilhouette local-box proportions, which are
// unchanged) are what keep it reading as an SUV rather than a small car,
// independent of this absolute-size cap.
export const TRAFFIC_VEHICLE_CLASS_SCALE = {
  CAR: 1.0,
  SUV: 0.94,
  SMALL_TRUCK: 1.12,
};

export function resolveTrafficVehicleClassScale(vehicleClass) {
  return TRAFFIC_VEHICLE_CLASS_SCALE[vehicleClass] ?? TRAFFIC_VEHICLE_CLASS_SCALE.CAR;
}

// Section 4 — realistic, restrained body-color palette. `accent` is a
// deliberately darker/lighter panel shade of the same paint (used for the
// hood/trunk/bed accent panel in VehicleSilhouettes.jsx), not a second
// independent color choice, matching how a single-color paint job still
// shows tonal variation across panels/shadow.
export const TRAFFIC_VEHICLE_COLOR_PALETTE = [
  { id: "white", body: "#e8eaed", accent: "#cbd2d9" },
  { id: "silver", body: "#9aa5b1", accent: "#78828d" },
  { id: "charcoal", body: "#3f4753", accent: "#2c323b" },
  { id: "dark-blue", body: "#243b55", accent: "#182740" },
  { id: "muted-red", body: "#7a3535", accent: "#5c2727" },
  { id: "black", body: "#191d24", accent: "#0d1015" },
];

// Deterministic (never Math.random): a plain modulo cycle by slot index is
// enough here since there are only ever 2-3 reference-corridor vehicles,
// and it guarantees no two of them repeat the same color before slot 6.
export function resolveTrafficVehicleColorForSlot(slotIndex) {
  return TRAFFIC_VEHICLE_COLOR_PALETTE[slotIndex % TRAFFIC_VEHICLE_COLOR_PALETTE.length];
}

// Section 15 — irregular (not evenly/symmetrically spaced) starting
// offsets for the 3 reference vehicles, still fully deterministic. Plain
// thirds (0, 0.33, 0.67) read as too regular/mechanical; these keep
// natural, unequal gaps while still covering the route.
export const TRAFFIC_CORRIDOR_REVIEW_START_OFFSETS = [0, 0.24, 0.58];

// ---------------------------------------------------------------------------
// MET-16C — Dev-Only All-Routes Live Preview
// ---------------------------------------------------------------------------
//
// Same LOCKED PRINCIPLE as the section above: reads every owner-approved
// route unmodified and reuses the identical spline/heading/perspective/
// occlusion/speed primitives this file already exposes for the single
// corridor — this section adds only route *selection* (many routes, not
// one hardcoded id), a per-route start stagger, and a multi-route frame
// engine. It shares resolveTrafficCorridorProgressPerSecond,
// resolveTrafficCorridorScale, and resolveTrafficCorridorVehicleAppearance
// verbatim with the single-corridor path above — there is one engine, not
// two.

// Separate from resolveTrafficCorridorReviewEnabled: an owner reviewing
// the one reference corridor and an owner reviewing all approved routes
// simultaneously are two different sessions and must never require or
// imply each other.
export function resolveTrafficAllRoutesReviewEnabled({ isDev, search }) {
  if (!isDev) return false;
  const params = new URLSearchParams(search || "");
  if (!params.has("trafficAllRoutesReview")) return false;
  const value = params.get("trafficAllRoutesReview");
  return value !== "0" && value !== "false";
}

// "start with CAR only... maximum 2-3 vehicles per route initially" — 2 is
// the conservative choice given multiple routes now animate concurrently
// (unlike the single-corridor case, total on-screen vehicle count here
// scales with route count too).
export const ALL_ROUTES_REVIEW_VEHICLE_COUNT_PER_ROUTE = 2;

export const ALL_ROUTES_REVIEW_SKIP_REASONS = {
  NOT_APPROVED: "NOT_APPROVED",
  NO_CAR_CLASS: "NO_CAR_CLASS",
  INSUFFICIENT_POINTS: "INSUFFICIENT_POINTS",
};

// Reports exactly which real routes were selected vs. skipped, and why —
// never silently drops a route the owner would expect to see explained.
export function resolveAllRoutesReviewEligibility(routes) {
  const selected = [];
  const skipped = [];
  for (const route of routes || []) {
    if (route.status !== "APPROVED") {
      skipped.push({ id: route.id, name: route.name, reason: ALL_ROUTES_REVIEW_SKIP_REASONS.NOT_APPROVED });
      continue;
    }
    if (!Array.isArray(route.vehicle_classes) || !route.vehicle_classes.includes("CAR")) {
      skipped.push({ id: route.id, name: route.name, reason: ALL_ROUTES_REVIEW_SKIP_REASONS.NO_CAR_CLASS });
      continue;
    }
    if (!Array.isArray(route.points) || route.points.length < 2) {
      skipped.push({ id: route.id, name: route.name, reason: ALL_ROUTES_REVIEW_SKIP_REASONS.INSUFFICIENT_POINTS });
      continue;
    }
    selected.push(route);
  }
  return { selected, skipped };
}

// "stagger vehicles so every route does not spawn at the same moment" —
// deterministic (never random) per-route delay before that route's
// vehicles begin advancing at all, keyed by the route's position in the
// already-deterministic `selected` array (itself derived from the fixed
// order routes appear in metaverseTrafficRoutes.json), so the stagger
// pattern is identical on every reload.
export const ALL_ROUTES_REVIEW_START_DELAY_STEP_SECONDS = 1.4;
export const ALL_ROUTES_REVIEW_MAX_START_DELAY_SECONDS = 4.2;

export function resolveRouteStartDelaySeconds(routeIndex) {
  return Math.min(ALL_ROUTES_REVIEW_MAX_START_DELAY_SECONDS, Math.max(0, routeIndex) * ALL_ROUTES_REVIEW_START_DELAY_STEP_SECONDS);
}

// The shared multi-route per-frame engine. Called once per animation
// frame by useMetaverseTrafficAllRoutesReview's single rAF loop — never
// one loop per route. `vehicleStates`/`previousHeadings`/`routeElapsed`
// are plain Maps owned by the caller (a React ref's `.current`, in
// practice) and are mutated in place; the function returns the flat list
// of vehicles to render this frame. Vehicle keys are `${route.id}:${slot}`
// — always unique across routes because route ids are already validated
// unique by validateRouteSet (metaverseTrafficAuthoringModel.js), so no
// two routes can ever collide on a rendered vehicle id.
export function advanceRouteFleetVehicles({
  routes,
  vehicleCountPerRoute = ALL_ROUTES_REVIEW_VEHICLE_COUNT_PER_ROUTE,
  dtSeconds,
  vehicleStates,
  previousHeadings,
  routeElapsed,
}) {
  const nextRendered = [];
  (routes || []).forEach((route, routeIndex) => {
    const startDelay = resolveRouteStartDelaySeconds(routeIndex);
    const elapsedBefore = routeElapsed.get(route.id) || 0;
    const elapsedAfter = elapsedBefore + Math.max(0, dtSeconds || 0);
    routeElapsed.set(route.id, elapsedAfter);
    // This route has not "entered" yet this review session — render
    // nothing for it rather than popping every route's vehicles in at
    // once at t=0.
    if (elapsedAfter < startDelay) return;

    const offsets = computeDeterministicVehicleOffsets(vehicleCountPerRoute);
    offsets.forEach((offset, slot) => {
      const key = `${route.id}:${slot}`;
      const rate = resolveTrafficCorridorProgressPerSecond(route.speed_class, slot);
      const current = vehicleStates.get(key) || createVehicleState(offset);
      const advanced = advanceVehicleState(current, dtSeconds, rate, { loop: true });
      vehicleStates.set(key, advanced);
      const previousHeadingDeg = previousHeadings.get(key);
      const appearance = resolveTrafficCorridorVehicleAppearance({ route, vehicleState: advanced, previousHeadingDeg });
      if (appearance) {
        previousHeadings.set(key, appearance.headingDeg);
        nextRendered.push({ key, routeId: route.id, ...appearance });
      }
    });
  });
  return nextRendered;
}
