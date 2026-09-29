import {
  REGIONAL_SCENE_COORDINATE_FAMILY,
  REGIONAL_SCENE_COORDINATE_SPACE,
  isRegionalSceneCoordinate,
} from "./regionalSceneCoordinate.js";

function samePoint(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a[0] === b[0] && a[1] === b[1];
}

function orientation(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function segmentsIntersect(a, b, c, d) {
  const abC = orientation(a, b, c);
  const abD = orientation(a, b, d);
  const cdA = orientation(c, d, a);
  const cdB = orientation(c, d, b);
  return (abC > 0 && abD < 0 || abC < 0 && abD > 0)
    && (cdA > 0 && cdB < 0 || cdA < 0 && cdB > 0);
}

function hasSelfIntersection(ring) {
  const edges = ring.slice(0, -1).map((point, index) => [point, ring[index + 1]]);
  for (let left = 0; left < edges.length; left += 1) {
    for (let right = left + 1; right < edges.length; right += 1) {
      if (right === left + 1 || (left === 0 && right === edges.length - 1)) continue;
      if (segmentsIntersect(...edges[left], ...edges[right])) return true;
    }
  }
  return false;
}

function signedArea(ring) {
  return ring.slice(0, -1).reduce((area, point, index) => {
    const next = ring[index + 1];
    return area + point[0] * next[1] - next[0] * point[1];
  }, 0) / 2;
}

export function validateRegionalScenePolygon({ sceneId, geometry, implemented = true, publishable = true } = {}) {
  const errors = [];
  if (sceneId !== "oil-rig") errors.push("sceneId must be oil-rig for this tracer");
  if (!implemented) errors.push("scene is not implemented");
  if (!publishable) errors.push("scene is not publishable");
  if (geometry?.type !== "Polygon") errors.push("geometry must be a Polygon");
  const rings = geometry?.coordinates;
  if (!Array.isArray(rings) || rings.length !== 1) errors.push("exactly one outer ring is required");
  const ring = rings?.[0];
  if (!Array.isArray(ring) || ring.length < 4) errors.push("outer ring requires at least four coordinates including closure");
  if (ring && !samePoint(ring[0], ring[ring.length - 1])) errors.push("outer ring must be closed");
  const unique = ring ? new Set(ring.slice(0, -1).map((point) => JSON.stringify(point))) : new Set();
  if (unique.size < 3) errors.push("outer ring requires at least three unique vertices");
  for (const point of ring || []) {
    if (!Array.isArray(point) || point.length !== 2 || !isRegionalSceneCoordinate(point[0]) || !isRegionalSceneCoordinate(point[1])) {
      errors.push("all coordinates must be finite scene-normalized values in 0..100");
      break;
    }
  }
  if (ring && Math.abs(signedArea(ring)) === 0) errors.push("Polygon area must be non-zero");
  if (ring && hasSelfIntersection(ring)) errors.push("Polygon must not self-intersect");
  return { valid: errors.length === 0, errors };
}

export function validateRegionalSceneContractMetadata(record = {}) {
  const errors = [];
  if (record.coordinateFamily !== REGIONAL_SCENE_COORDINATE_FAMILY) errors.push("coordinateFamily must be METAVERSE");
  if (record.coordinateSpace !== REGIONAL_SCENE_COORDINATE_SPACE) errors.push("coordinateSpace must be metaverse.regional-scene");
  if (record.geometryType !== "Polygon") errors.push("geometryType must be Polygon");
  if (!record.provenance && !record.authoringMetadata) errors.push("provenance is required");
  return { valid: errors.length === 0, errors };
}
