// MET-16A — Manual Traffic Authoring Tool: pure data/geometry model.
//
// This file owns route schema, validation, spline/arc-length math, and
// import/export for the developer-only traffic route authoring tool. It is
// intentionally decoupled from React and from the DOM so every piece of it
// is unit-testable without mounting a component or a browser.
//
// LOCKED PRINCIPLE (see docs/metaverse/*MET-16A*): AI does not decide where
// the road is. Nothing in this file infers, traces, or snaps to image
// content — every point recorded here comes from an explicit owner click.
// This module only records points, smooths the route, calculates position/
// direction, interpolates scale, and supports save/export. It grants no
// runtime authority — routes authored here are DRAFT/CALIBRATED/APPROVED
// reference data only; nothing in this file (or the rest of MET-16A) wires
// them into production traffic.
//
// Scene coordinate convention: x/y are 0-100 on both axes, matching every
// other Metaverse geometry file (metaverseRoadTraceRegistry.js,
// metaverseRiverFlowRegistry.js, METAVERSE_DISTRICT_MARKERS) rather than a
// separate 0-1 convention, so authored routes stay directly compatible with
// the rest of the geometry system without a conversion step. Progress `t`
// along a route (used for perspective keys and occlusion segments) is 0-1,
// as requested, since progress is a route-relative fraction, not a scene
// position.

export const TRAFFIC_AUTHORING_SCHEMA_VERSION = 1;

export const TRAFFIC_AUTHORING_MODES = ["SELECT", "DRAW", "EDIT", "OCCLUSION", "PERSPECTIVE", "PREVIEW"];

export const TRAFFIC_AUTHORING_ROUTE_STATUSES = ["DRAFT", "CALIBRATED", "APPROVED"];

export const TRAFFIC_AUTHORING_DIRECTIONS = ["FORWARD", "REVERSE"];

// SHUTTLE_BUS is part of the schema (so an already-authored bus-capable
// route can round-trip through export/import) but stays disabled-by-default
// in the authoring UI per the MET-16A "do not add buses" boundary — see
// MetaverseTrafficAuthoringPanel.jsx.
export const TRAFFIC_AUTHORING_VEHICLE_CLASSES = ["CAR", "SUV", "VAN", "SMALL_TRUCK", "SHUTTLE_BUS"];
export const TRAFFIC_AUTHORING_VEHICLE_CLASSES_DISABLED_BY_DEFAULT = ["SHUTTLE_BUS"];

export const TRAFFIC_AUTHORING_SPEED_CLASSES = ["URBAN_SLOW", "BOULEVARD", "FREEWAY"];

// ---------------------------------------------------------------------------
// Ghost Preview playback speed (MET-16A patch — slower calibration)
// ---------------------------------------------------------------------------
//
// This is authoring-tool-only playback speed for the Ghost Preview marker —
// it is NOT `TRAFFIC_AUTHORING_SPEED_CLASSES` (a per-route field that is part
// of the exported route schema and will inform a future production traffic
// speed model). Ghost Preview speed is never exported, never saved to a
// route, and has no bearing on how any future production vehicle actually
// moves — it exists purely so the owner can slow playback down to inspect
// lane alignment. Expressed as a multiplier of a fixed "normal" rate
// (GHOST_PREVIEW_BASE_PROGRESS_PER_SECOND, itself just a constant for this
// dev tool) rather than a raw progress-per-second number, so the UI can
// present it as "0.10x" etc.
export const GHOST_PREVIEW_BASE_PROGRESS_PER_SECOND = 0.4;

export const GHOST_PREVIEW_SPEED_PRESETS = [
  { multiplier: 0.01, label: "Ultra Crawl" },
  { multiplier: 0.05, label: "Crawl" },
  { multiplier: 0.1, label: "Very Slow" },
  { multiplier: 0.25, label: "Slow" },
  { multiplier: 0.5, label: "Medium" },
  { multiplier: 1, label: "Normal" },
];

export const GHOST_PREVIEW_DEFAULT_SPEED_MULTIPLIER = 0.1;

export function resolveGhostPreviewSpeedLabel(multiplier) {
  const preset = GHOST_PREVIEW_SPEED_PRESETS.find((entry) => entry.multiplier === multiplier);
  return preset ? preset.label : "Custom";
}

// Converts a speed multiplier into the actual progress-per-second rate the
// Ghost Preview's requestAnimationFrame loop advances by. Pure and linear on
// purpose: doubling the multiplier exactly doubles the rate, with no
// stepping/rounding, so motion stays smooth and frame-rate independent (the
// caller still multiplies this by real elapsed `dt`, never by a fixed frame
// count) regardless of which preset is selected.
export function resolveGhostPreviewProgressPerSecond(multiplier) {
  const safeMultiplier = typeof multiplier === "number" && multiplier > 0 ? multiplier : GHOST_PREVIEW_DEFAULT_SPEED_MULTIPLIER;
  return safeMultiplier * GHOST_PREVIEW_BASE_PROGRESS_PER_SECOND;
}

export const SCENE_COORDINATE_MIN = 0;
export const SCENE_COORDINATE_MAX = 100;

export const PERSPECTIVE_SCALE_MIN = 0.05;
export const PERSPECTIVE_SCALE_MAX = 3;

export function clampSceneCoordinate(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return SCENE_COORDINATE_MIN;
  return Math.min(SCENE_COORDINATE_MAX, Math.max(SCENE_COORDINATE_MIN, value));
}

export function isSceneCoordinateInRange(value) {
  return typeof value === "number" && !Number.isNaN(value) && value >= SCENE_COORDINATE_MIN && value <= SCENE_COORDINATE_MAX;
}

export function clampProgress(t) {
  if (typeof t !== "number" || Number.isNaN(t)) return 0;
  return Math.min(1, Math.max(0, t));
}

let routeSequence = 0;

export function createRouteId(name) {
  routeSequence += 1;
  const slug = String(name || "route")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
  return `${slug || "route"}-${routeSequence}-${Date.now().toString(36)}`;
}

export function createEmptyRoute({ id, name = "Untitled Route" } = {}) {
  return {
    id: id || createRouteId(name),
    name,
    status: "DRAFT",
    direction: "FORWARD",
    vehicle_classes: ["CAR"],
    speed_class: "BOULEVARD",
    points: [],
    perspective: [],
    occlusion_segments: [],
    notes: "",
  };
}

// ---------------------------------------------------------------------------
// Point authoring (Section 4/5/16 — draw, edit, snap)
// ---------------------------------------------------------------------------

// Lightweight manual helper only (Section 16) — no image recognition, no
// road detection. Snaps a freshly-clicked point onto an existing point of
// the same route if it lands within `threshold` scene units, so a lane's
// start/end can be re-clicked precisely without hunting for the exact pixel.
export function snapToNearbyPoint(point, existingPoints, threshold = 1.2) {
  let nearest = null;
  let nearestDistance = Infinity;
  for (const candidate of existingPoints || []) {
    const distance = Math.hypot(candidate.x - point.x, candidate.y - point.y);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = candidate;
    }
  }
  if (nearest && nearestDistance <= threshold) return { x: nearest.x, y: nearest.y };
  return point;
}

export function addRoutePoint(route, point, { snap = true, snapThreshold = 1.2 } = {}) {
  const resolved = snap ? snapToNearbyPoint(point, route.points, snapThreshold) : point;
  const clamped = { x: clampSceneCoordinate(resolved.x), y: clampSceneCoordinate(resolved.y) };
  return { ...route, points: [...route.points, clamped] };
}

export function movePoint(route, index, point) {
  if (index < 0 || index >= route.points.length) return route;
  const points = route.points.slice();
  points[index] = { x: clampSceneCoordinate(point.x), y: clampSceneCoordinate(point.y) };
  return { ...route, points };
}

export function deletePoint(route, index) {
  if (index < 0 || index >= route.points.length) return route;
  const points = route.points.slice();
  points.splice(index, 1);
  return { ...route, points };
}

export function insertPointAfter(route, index, point) {
  const points = route.points.slice();
  const insertAt = Math.min(Math.max(index + 1, 0), points.length);
  points.splice(insertAt, 0, { x: clampSceneCoordinate(point.x), y: clampSceneCoordinate(point.y) });
  return { ...route, points };
}

// Reverses traversal direction without requiring the owner to redraw the
// route (Section 10): flips point order, remaps perspective `t` and
// occlusion `from`/`to` to the mirrored progress, and toggles the direction
// flag.
export function reverseRoute(route) {
  const points = [...route.points].reverse();
  const perspective = [...(route.perspective || [])]
    .map((key) => ({ ...key, t: clampProgress(1 - key.t) }))
    .sort((a, b) => a.t - b.t);
  const occlusion_segments = [...(route.occlusion_segments || [])]
    .map((segment) => ({ ...segment, from: clampProgress(1 - segment.to), to: clampProgress(1 - segment.from) }))
    .sort((a, b) => a.from - b.from);
  return {
    ...route,
    points,
    perspective,
    occlusion_segments,
    direction: route.direction === "FORWARD" ? "REVERSE" : "FORWARD",
  };
}

// ---------------------------------------------------------------------------
// Spline / arc-length (Section 4, 9 — smooth curve, uniform ghost movement)
// ---------------------------------------------------------------------------

function catmullRomPoint(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  const x =
    0.5 *
    (2 * p1.x +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
  const y =
    0.5 *
    (2 * p1.y +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
  return { x, y };
}

// Samples a smooth Catmull-Rom curve through `points` (falls back to a
// straight line for 0-2 points). Used both for the rendered spline preview
// and as the basis for arc-length-uniform progress sampling below.
export function sampleRouteSpline(points, samplesPerSegment = 12) {
  if (!Array.isArray(points) || points.length === 0) return [];
  if (points.length === 1) return [{ x: points[0].x, y: points[0].y }];
  if (points.length === 2) {
    const [a, b] = points;
    const samples = [];
    for (let i = 0; i <= samplesPerSegment; i += 1) {
      const t = i / samplesPerSegment;
      samples.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
    return samples;
  }
  const extended = [points[0], ...points, points[points.length - 1]];
  const samples = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = extended[i];
    const p1 = extended[i + 1];
    const p2 = extended[i + 2];
    const p3 = extended[i + 3];
    const isLastSegment = i === points.length - 2;
    const segmentSamples = isLastSegment ? samplesPerSegment + 1 : samplesPerSegment;
    for (let s = 0; s < segmentSamples; s += 1) {
      const t = s / samplesPerSegment;
      samples.push(catmullRomPoint(p0, p1, p2, p3, t));
    }
  }
  return samples;
}

export function buildArcLengthTable(samples) {
  const cumulative = [0];
  for (let i = 1; i < samples.length; i += 1) {
    const d = Math.hypot(samples[i].x - samples[i - 1].x, samples[i].y - samples[i - 1].y);
    cumulative.push(cumulative[i - 1] + d);
  }
  return cumulative;
}

export function computeRouteLength(points) {
  const samples = sampleRouteSpline(points);
  const cumulative = buildArcLengthTable(samples);
  return cumulative[cumulative.length - 1] || 0;
}

// Arc-length-parameterized sample: `t` is a fraction of total route length,
// not a fraction of control-point index, so the ghost marker moves at a
// visually uniform speed regardless of how unevenly the owner spaced their
// clicks — and always monotonically forward for increasing t (no ping-pong).
export function sampleRouteAtProgress(points, t) {
  const samples = sampleRouteSpline(points);
  if (samples.length === 0) return null;
  if (samples.length === 1) return { x: samples[0].x, y: samples[0].y, headingDeg: 0 };
  const clampedT = clampProgress(t);
  const cumulative = buildArcLengthTable(samples);
  const totalLength = cumulative[cumulative.length - 1];
  if (!totalLength) return { x: samples[0].x, y: samples[0].y, headingDeg: 0 };
  const targetLength = clampedT * totalLength;
  let index = 0;
  while (index < cumulative.length - 1 && cumulative[index + 1] < targetLength) index += 1;
  const nextIndex = Math.min(index + 1, samples.length - 1);
  const segStart = cumulative[index];
  const segEnd = cumulative[nextIndex];
  const segFraction = segEnd > segStart ? (targetLength - segStart) / (segEnd - segStart) : 0;
  const a = samples[index];
  const b = samples[nextIndex];
  const x = a.x + (b.x - a.x) * segFraction;
  const y = a.y + (b.y - a.y) * segFraction;
  const headingDeg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  return { x, y, headingDeg };
}

// Nearest route progress (0-1) to an arbitrary scene point — used by the
// Occlusion/Perspective click-to-capture helpers, never by any automatic
// road-following logic.
export function nearestProgressOnRoute(points, x, y) {
  const samples = sampleRouteSpline(points);
  if (samples.length === 0) return 0;
  const cumulative = buildArcLengthTable(samples);
  const totalLength = cumulative[cumulative.length - 1] || 0;
  let nearestIndex = 0;
  let nearestDistance = Infinity;
  samples.forEach((sample, index) => {
    const distance = Math.hypot(sample.x - x, sample.y - y);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });
  return totalLength === 0 ? 0 : cumulative[nearestIndex] / totalLength;
}

// ---------------------------------------------------------------------------
// Perspective (Section 11)
// ---------------------------------------------------------------------------

export function suggestPerspectiveScaleForY(y) {
  // Rough starting guess only, aligned with the existing DEPTH_FAR/MID/NEAR
  // bands in metaverseRoadTraceRegistry.js (far = smaller, near = larger) —
  // a convenience default for the click-to-capture helper, always editable
  // by the owner afterward. Not a substitute for their judgment.
  const clampedY = clampSceneCoordinate(y);
  return Number((0.3 + (clampedY / 100) * 0.7).toFixed(2));
}

export function interpolatePerspectiveScale(perspectiveKeys, t) {
  if (!Array.isArray(perspectiveKeys) || perspectiveKeys.length === 0) return 1;
  const sorted = [...perspectiveKeys].sort((a, b) => a.t - b.t);
  const clampedT = clampProgress(t);
  if (clampedT <= sorted[0].t) return sorted[0].scale;
  if (clampedT >= sorted[sorted.length - 1].t) return sorted[sorted.length - 1].scale;
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (clampedT >= a.t && clampedT <= b.t) {
      const fraction = b.t === a.t ? 0 : (clampedT - a.t) / (b.t - a.t);
      return a.scale + (b.scale - a.scale) * fraction;
    }
  }
  return sorted[sorted.length - 1].scale;
}

export function setPerspectiveKey(route, t, scale) {
  const clampedT = clampProgress(t);
  const clampedScale = Math.min(PERSPECTIVE_SCALE_MAX, Math.max(PERSPECTIVE_SCALE_MIN, scale));
  const perspective = [...(route.perspective || [])];
  const existingIndex = perspective.findIndex((key) => Math.abs(key.t - clampedT) < 0.001);
  if (existingIndex >= 0) perspective[existingIndex] = { t: clampedT, scale: clampedScale };
  else perspective.push({ t: clampedT, scale: clampedScale });
  perspective.sort((a, b) => a.t - b.t);
  return { ...route, perspective };
}

export function removePerspectiveKey(route, t) {
  return { ...route, perspective: (route.perspective || []).filter((key) => Math.abs(key.t - t) >= 0.001) };
}

// ---------------------------------------------------------------------------
// Occlusion (Section 12)
// ---------------------------------------------------------------------------

export function isProgressOccluded(occlusionSegments, t) {
  const clampedT = clampProgress(t);
  return (occlusionSegments || []).some((segment) => clampedT >= segment.from && clampedT <= segment.to);
}

let occlusionSequence = 0;
function createOcclusionId() {
  occlusionSequence += 1;
  return `occ-${occlusionSequence}-${Date.now().toString(36)}`;
}

export function addOcclusionSegment(route, from, to) {
  const a = clampProgress(Math.min(from, to));
  const b = clampProgress(Math.max(from, to));
  if (a === b) return route;
  const segment = { id: createOcclusionId(), from: a, to: b };
  return { ...route, occlusion_segments: [...(route.occlusion_segments || []), segment].sort((x, y) => x.from - y.from) };
}

export function removeOcclusionSegment(route, id) {
  return { ...route, occlusion_segments: (route.occlusion_segments || []).filter((segment) => segment.id !== id) };
}

// ---------------------------------------------------------------------------
// Validation (Section 22)
// ---------------------------------------------------------------------------

export function validateRoute(route) {
  const warnings = [];
  if (!route || typeof route !== "object") return ["Route is not a valid object"];
  if (!route.name || !String(route.name).trim()) warnings.push("Missing route name");
  if (!Array.isArray(route.points) || route.points.length < 2) {
    warnings.push("Route has fewer than 2 points");
  } else {
    route.points.forEach((point, index) => {
      if (!isSceneCoordinateInRange(point?.x) || !isSceneCoordinateInRange(point?.y)) {
        warnings.push(`Point ${index} is outside the 0-100 scene range: ${JSON.stringify(point)}`);
      }
    });
  }
  for (const key of route.perspective || []) {
    if (typeof key.t !== "number" || key.t < 0 || key.t > 1) {
      warnings.push(`Perspective key progress out of 0-1 range: ${key.t}`);
    }
    if (typeof key.scale !== "number" || key.scale < PERSPECTIVE_SCALE_MIN || key.scale > PERSPECTIVE_SCALE_MAX) {
      warnings.push(`Impossible perspective scale: ${key.scale}`);
    }
  }
  const segments = route.occlusion_segments || [];
  segments.forEach((segment) => {
    if (typeof segment.from !== "number" || typeof segment.to !== "number" || segment.from < 0 || segment.to > 1 || segment.from >= segment.to) {
      warnings.push(`Invalid occlusion range: ${segment.from}-${segment.to}`);
    }
  });
  const hasOverlap = segments.some((a, i) => segments.some((b, j) => i !== j && a.from < b.to && b.from < a.to));
  if (hasOverlap) warnings.push("Overlapping occlusion segments");
  return warnings;
}

export function validateRouteSet(routes) {
  const warnings = [];
  const seenIds = new Set();
  for (const route of routes || []) {
    if (seenIds.has(route.id)) warnings.push(`Duplicate route id: ${route.id}`);
    seenIds.add(route.id);
    for (const warning of validateRoute(route)) warnings.push(`${route.id || "(no id)"}: ${warning}`);
  }
  return warnings;
}

// ---------------------------------------------------------------------------
// Export / Import (Section 20/21)
// ---------------------------------------------------------------------------

export function exportRoute(route) {
  return {
    id: route.id,
    name: route.name,
    status: route.status,
    direction: route.direction,
    vehicle_classes: [...(route.vehicle_classes || [])],
    speed_class: route.speed_class,
    points: (route.points || []).map((point) => ({ x: point.x, y: point.y })),
    perspective: (route.perspective || []).map((key) => ({ t: key.t, scale: key.scale })),
    occlusion_segments: (route.occlusion_segments || []).map((segment) => ({ from: segment.from, to: segment.to })),
    notes: route.notes || "",
  };
}

export function exportRouteSet(routes) {
  return {
    schemaVersion: TRAFFIC_AUTHORING_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    routes: (routes || []).map(exportRoute),
  };
}

// Parses and validates an imported route file, never throwing — malformed
// input always resolves to { valid: false, errors, routes: [] } (or the
// subset of routes that DID parse, each individually validated) rather than
// crashing the authoring tool (Section 21: "Bad/malformed data must fail
// safely").
export function parseImportedRouteSet(jsonInput) {
  let parsed;
  try {
    parsed = typeof jsonInput === "string" ? JSON.parse(jsonInput) : jsonInput;
  } catch (error) {
    return { valid: false, errors: [`Invalid JSON: ${error.message}`], routes: [] };
  }
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.routes)) {
    return { valid: false, errors: ["Malformed route file: expected an object with a \"routes\" array"], routes: [] };
  }

  const routes = [];
  const errors = [];

  parsed.routes.forEach((raw, index) => {
    if (!raw || typeof raw !== "object" || !Array.isArray(raw.points)) {
      errors.push(`Route at index ${index} is malformed and was skipped`);
      return;
    }
    const route = {
      id: typeof raw.id === "string" && raw.id ? raw.id : createRouteId(raw.name),
      name: typeof raw.name === "string" && raw.name ? raw.name : "Untitled Route",
      status: TRAFFIC_AUTHORING_ROUTE_STATUSES.includes(raw.status) ? raw.status : "DRAFT",
      direction: TRAFFIC_AUTHORING_DIRECTIONS.includes(raw.direction) ? raw.direction : "FORWARD",
      vehicle_classes:
        Array.isArray(raw.vehicle_classes) && raw.vehicle_classes.length
          ? raw.vehicle_classes.filter((c) => TRAFFIC_AUTHORING_VEHICLE_CLASSES.includes(c))
          : ["CAR"],
      speed_class: TRAFFIC_AUTHORING_SPEED_CLASSES.includes(raw.speed_class) ? raw.speed_class : "BOULEVARD",
      points: raw.points
        .filter((point) => point && typeof point.x === "number" && typeof point.y === "number")
        .map((point) => ({ x: clampSceneCoordinate(point.x), y: clampSceneCoordinate(point.y) })),
      perspective: Array.isArray(raw.perspective)
        ? raw.perspective
            .filter((key) => key && typeof key.t === "number" && typeof key.scale === "number")
            .map((key) => ({ t: clampProgress(key.t), scale: key.scale }))
        : [],
      occlusion_segments: Array.isArray(raw.occlusion_segments)
        ? raw.occlusion_segments
            .filter((segment) => segment && typeof segment.from === "number" && typeof segment.to === "number")
            .map((segment) => ({ id: createOcclusionId(), from: clampProgress(segment.from), to: clampProgress(segment.to) }))
        : [],
      notes: typeof raw.notes === "string" ? raw.notes : "",
    };
    const routeWarnings = validateRoute(route);
    if (routeWarnings.length) errors.push(...routeWarnings.map((warning) => `${route.id}: ${warning}`));
    routes.push(route);
  });

  const seenIds = new Set();
  for (const route of routes) {
    if (seenIds.has(route.id)) errors.push(`Duplicate route id after import: ${route.id}`);
    seenIds.add(route.id);
  }

  return { valid: errors.length === 0, errors, routes };
}

// ---------------------------------------------------------------------------
// Developer-mode gating (Section 1)
// ---------------------------------------------------------------------------

// Pure so it can be unit-tested without mocking `window`/`import.meta`.
// Requires BOTH a dev build and an explicit `?trafficAuthor=1` (or bare
// `?trafficAuthor`) query param — mirrors the existing
// `?roadTraceDebug=1`/`?riverFlowDebug=1` convention in
// MetaverseLivingCityLayer.jsx so normal users and production builds never
// see this UI. `trafficAuthor=0`/`trafficAuthor=false` explicitly disable.
export function resolveTrafficAuthoringEnabled({ isDev, search }) {
  if (!isDev) return false;
  const params = new URLSearchParams(search || "");
  if (!params.has("trafficAuthor")) return false;
  const value = params.get("trafficAuthor");
  return value !== "0" && value !== "false";
}
