import {
  clampSceneCoordinate,
  sampleRouteAtProgress,
  sampleRouteSpline,
} from "@/system/metaverse/traffic/metaverseTrafficAuthoringModel.js";

export const RIVER_TRACE_SCHEMA_VERSION = 1;
export const RIVER_GEOMETRY_TYPES = ["CENTERLINE", "LEFT_BANK", "RIGHT_BANK"];
export const RIVER_FLOW_ZONE_TYPES = ["NONE", "CALM", "TRANSITION", "RAPIDS", "FAST_CURRENT"];
export const RIVER_FLOW_ZONE_MULTIPLIERS = {
  CALM: 0.45,
  TRANSITION: 0.75,
  RAPIDS: 1.8,
  FAST_CURRENT: 1.4,
};

export const RIVER_TRACE_DEFAULT_FLOW = {
  direction: "forward",
  baseSpeed: 1,
  preview: {
    enabled: true,
    particleCount: 24,
    particleOpacity: 0.4,
    particleSpacing: 1,
    particleLength: 1.8,
  },
};

export const RIVER_TRACE_DEFAULT_STATE = {
  version: RIVER_TRACE_SCHEMA_VERSION,
  id: "main-river",
  name: "Main River",
  centerline: [],
  banks: { left: [], right: [] },
  zones: [],
  flow: RIVER_TRACE_DEFAULT_FLOW,
};

function cloneDefaultFlow() {
  return {
    ...RIVER_TRACE_DEFAULT_FLOW,
    preview: { ...RIVER_TRACE_DEFAULT_FLOW.preview },
  };
}

export function normalizeRiverTraceState(value) {
  const source = Array.isArray(value) ? { centerline: value } : (value || {});
  const banks = source.banks || {};
  const flow = source.flow || {};
  const preview = flow.preview || {};
  const normalizePoints = (points) => (Array.isArray(points)
    ? points
      .filter((point) => Number.isFinite(point?.x) && Number.isFinite(point?.y))
      .map((point) => ({ x: clampSceneCoordinate(point.x), y: clampSceneCoordinate(point.y) }))
    : []);

  return {
    version: RIVER_TRACE_SCHEMA_VERSION,
    id: source.id || RIVER_TRACE_DEFAULT_STATE.id,
    name: source.name || RIVER_TRACE_DEFAULT_STATE.name,
    centerline: normalizePoints(source.centerline),
    banks: {
      left: normalizePoints(banks.left),
      right: normalizePoints(banks.right),
    },
    zones: Array.isArray(source.zones)
      ? source.zones
        .filter((zone) => RIVER_FLOW_ZONE_TYPES.includes(zone?.type) && zone.type !== "NONE")
        .map((zone) => ({
          id: zone.id || `zone-${Math.random().toString(36).slice(2, 8)}`,
          type: zone.type,
          startT: Math.max(0, Math.min(1, Number(zone.startT) || 0)),
          endT: Math.max(0, Math.min(1, Number(zone.endT) || 0)),
          name: zone.name || zone.type.replace(/_/g, " "),
        }))
        .filter((zone) => zone.endT > zone.startT)
      : [],
    flow: {
      ...cloneDefaultFlow(),
      ...flow,
      preview: {
        ...cloneDefaultFlow().preview,
        ...preview,
      },
    },
  };
}

export function updateRiverPoints(state, geometryType, updater) {
  const current = geometryType === "CENTERLINE"
    ? state.centerline
    : geometryType === "LEFT_BANK" ? state.banks.left : state.banks.right;
  const next = typeof updater === "function" ? updater(current) : updater;
  const points = (next || []).map((point) => ({
    x: clampSceneCoordinate(point.x),
    y: clampSceneCoordinate(point.y),
  }));
  if (geometryType === "CENTERLINE") return { ...state, centerline: points };
  return { ...state, banks: { ...state.banks, [geometryType === "LEFT_BANK" ? "left" : "right"]: points } };
}

export function addRiverPoint(state, geometryType, point) {
  return updateRiverPoints(state, geometryType, (points) => [...points, point]);
}

export function moveRiverPoint(state, geometryType, index, point) {
  return updateRiverPoints(state, geometryType, (points) => points.map((item, itemIndex) => (
    itemIndex === index ? point : item
  )));
}

export function deleteRiverPoint(state, geometryType, index) {
  return updateRiverPoints(state, geometryType, (points) => points.filter((_, itemIndex) => itemIndex !== index));
}

export function clearRiverGeometry(state, geometryType) {
  return updateRiverPoints(state, geometryType, []);
}

export function reverseRiverDirection(state) {
  return {
    ...state,
    centerline: [...state.centerline].reverse(),
    banks: {
      left: [...state.banks.left].reverse(),
      right: [...state.banks.right].reverse(),
    },
    zones: state.zones.map((zone) => ({
      ...zone,
      startT: 1 - zone.endT,
      endT: 1 - zone.startT,
    })).sort((a, b) => a.startT - b.startT),
    flow: { ...state.flow, direction: state.flow.direction === "forward" ? "reverse" : "forward" },
  };
}

export function sampleRiverAtProgress(points, progress) {
  return sampleRouteAtProgress(points, progress);
}

export function resolveRiverZoneAtProgress(zones, progress) {
  return (zones || []).find((zone) => progress >= zone.startT && progress <= zone.endT) || null;
}

export function resolveRiverSpeedMultiplier(zone) {
  return zone ? (RIVER_FLOW_ZONE_MULTIPLIERS[zone.type] || 1) : 1;
}

export function resolveRiverParticleCount(flow) {
  const count = Number(flow?.preview?.particleCount);
  return Number.isFinite(count) ? Math.max(4, Math.min(60, Math.round(count))) : 24;
}

export function resolveRiverParticlePositions(state, progresses, { reverse = false } = {}) {
  const points = state.centerline;
  if (points.length < 2) return [];
  return progresses.map((baseProgress, index) => {
    const progress = reverse ? 1 - baseProgress : baseProgress;
    const sample = sampleRiverAtProgress(points, progress);
    if (!sample) return null;
    const zone = resolveRiverZoneAtProgress(state.zones, progress);
    return {
      id: `river-particle-${index}`,
      ...sample,
      progress,
      zoneType: zone?.type || "NONE",
      speedMultiplier: resolveRiverSpeedMultiplier(zone),
    };
  }).filter(Boolean);
}

export function getRiverRenderSamples(points) {
  return sampleRouteSpline(points, 16);
}

export function createRiverZone(type, startT, endT) {
  return {
    id: `zone-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    startT: Math.min(startT, endT),
    endT: Math.max(startT, endT),
    name: type.replace(/_/g, " "),
  };
}
