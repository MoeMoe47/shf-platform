import {
  REGIONAL_SCENE_COORDINATE_FAMILY,
  REGIONAL_SCENE_COORDINATE_SPACE,
  isRegionalSceneCoordinate,
} from "./regionalSceneCoordinate.js";

function samePoint(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a[0] === b[0] && a[1] === b[1];
}

const VERTEX_EPSILON = 1e-6;

function orientation(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function between(value, left, right) {
  return value >= Math.min(left, right) - VERTEX_EPSILON
    && value <= Math.max(left, right) + VERTEX_EPSILON;
}

function onSegment(a, b, point) {
  return Math.abs(orientation(a, b, point)) <= VERTEX_EPSILON
    && between(point[0], a[0], b[0])
    && between(point[1], a[1], b[1]);
}

function segmentsIntersect(a, b, c, d) {
  const abC = orientation(a, b, c);
  const abD = orientation(a, b, d);
  const cdA = orientation(c, d, a);
  const cdB = orientation(c, d, b);
  const abCrosses = (abC > VERTEX_EPSILON && abD < -VERTEX_EPSILON)
    || (abC < -VERTEX_EPSILON && abD > VERTEX_EPSILON);
  const cdCrosses = (cdA > VERTEX_EPSILON && cdB < -VERTEX_EPSILON)
    || (cdA < -VERTEX_EPSILON && cdB > VERTEX_EPSILON);
  return (abCrosses && cdCrosses)
    || (Math.abs(abC) <= VERTEX_EPSILON && onSegment(a, b, c))
    || (Math.abs(abD) <= VERTEX_EPSILON && onSegment(a, b, d))
    || (Math.abs(cdA) <= VERTEX_EPSILON && onSegment(c, d, a))
    || (Math.abs(cdB) <= VERTEX_EPSILON && onSegment(c, d, b));
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
  const vertices = ring?.slice(0, -1) || [];
  const unique = new Set(vertices.map((point) => JSON.stringify(point)));
  if (unique.size < 3) errors.push("outer ring requires at least three unique vertices");
  let coordinatesValid = true;
  for (const point of ring || []) {
    if (!Array.isArray(point) || point.length !== 2 || !isRegionalSceneCoordinate(point[0]) || !isRegionalSceneCoordinate(point[1])) {
      errors.push("all coordinates must be finite scene-normalized values in 0..100");
      coordinatesValid = false;
      break;
    }
  }
  for (let left = 0; left < vertices.length; left += 1) {
    for (let right = left + 1; right < vertices.length; right += 1) {
      const dx = vertices[left]?.[0] - vertices[right]?.[0];
      const dy = vertices[left]?.[1] - vertices[right]?.[1];
      if (Number.isFinite(dx) && Number.isFinite(dy) && Math.hypot(dx, dy) <= VERTEX_EPSILON) {
        errors.push("non-closing vertices must not be duplicate or near-duplicate");
        left = vertices.length;
        break;
      }
    }
  }
  if (coordinatesValid && ring && Math.abs(signedArea(ring)) <= VERTEX_EPSILON) errors.push("Polygon area must be non-zero");
  if (coordinatesValid && ring && hasSelfIntersection(ring)) errors.push("Polygon must not self-intersect");
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
