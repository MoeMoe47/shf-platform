import { defaultCoordinateSpaceRegistry } from "../../../shared/spatial/registries/defaultCoordinateSpaces.js";

export const RELATIONSHIP_TYPES = Object.freeze({
  CONTAINS: "CONTAINS",
  WITHIN: "WITHIN",
  INTERSECTS: "INTERSECTS",
  OVERLAPS: "OVERLAPS",
  TOUCHES: "TOUCHES",
  ADJACENT_TO: "ADJACENT_TO",
  DISJOINT: "DISJOINT",
  SAME_LOCATION: "SAME_LOCATION",
});

const SUPPORTED_RELATIONSHIPS = new Set([
  RELATIONSHIP_TYPES.CONTAINS,
  RELATIONSHIP_TYPES.WITHIN,
  RELATIONSHIP_TYPES.INTERSECTS,
  RELATIONSHIP_TYPES.OVERLAPS,
  RELATIONSHIP_TYPES.TOUCHES,
  RELATIONSHIP_TYPES.DISJOINT,
  RELATIONSHIP_TYPES.SAME_LOCATION,
]);

const EPSILON = 1e-9;
const DERIVATION_METHOD = "deterministic-planar-topology";
const DERIVATION_VERSION = "wave7c-v1";

function failure(relationship, reason) {
  return Object.freeze({ ok: false, relationship, reason });
}

function result({ left, right, relationship, value, limitations = [] }) {
  const leftReference = left.featureId ?? left.sceneId ?? null;
  const rightReference = right.featureId ?? right.sceneId ?? null;
  return Object.freeze({
    ok: value,
    resultType: "GEOMETRIC_FACT",
    reasoningClass: "GEOMETRIC_FACT",
    relationship,
    value,
    coordinateSpace: left.coordinateSpace ?? left.coordinateSpaceId,
    inputReferences: Object.freeze({ left: leftReference, right: rightReference }),
    derivationMethod: DERIVATION_METHOD,
    derivationVersion: DERIVATION_VERSION,
    limitations: Object.freeze([...limitations]),
  });
}

function coordinateSpaceOf(feature) {
  return feature?.coordinateSpace ?? feature?.coordinateSpaceId ?? null;
}

function publicationStateOf(feature) {
  return feature?.publicationState ?? feature?.publicEligibility?.publicationState ?? null;
}

function visibleAndEligible(feature) {
  if (!feature || feature.eligible === false || feature.geometryQualified === false) return false;
  if (["HIDDEN", "RESTRICTED"].includes(feature.visibility)) return false;
  if (publicationStateOf(feature) === "NOT_PUBLISHED") return false;
  if (!feature.provenance || typeof feature.provenance !== "object") return false;
  if (typeof feature.provenance.sourceRecordId !== "string" || feature.provenance.sourceRecordId.length === 0) return false;
  return true;
}

function sameSpace(left, right) {
  const leftSpace = coordinateSpaceOf(left);
  const rightSpace = coordinateSpaceOf(right);
  if (!leftSpace || !rightSpace || leftSpace !== rightSpace) return false;
  if (left.coordinateFamily !== right.coordinateFamily) return false;
  const registryResult = defaultCoordinateSpaceRegistry.get(leftSpace, { expectedFamily: left.coordinateFamily });
  return registryResult.ok && defaultCoordinateSpaceRegistry.get(rightSpace, { expectedFamily: right.coordinateFamily }).ok;
}

function finiteCoordinate(point) {
  return Array.isArray(point)
    && point.length === 2
    && Number.isFinite(point[0])
    && Number.isFinite(point[1]);
}

function samePoint(left, right) {
  return Math.abs(left[0] - right[0]) <= EPSILON && Math.abs(left[1] - right[1]) <= EPSILON;
}

function ringIsValid(ring) {
  if (!Array.isArray(ring) || ring.length < 4 || !ring.every(finiteCoordinate) || !samePoint(ring[0], ring[ring.length - 1])) return false;
  const area = ring.reduce((sum, point, index) => {
    const next = ring[(index + 1) % ring.length];
    return sum + point[0] * next[1] - next[0] * point[1];
  }, 0);
  if (Math.abs(area) <= EPSILON) return false;
  const edges = ring.slice(0, -1).map((point, index) => [point, ring[index + 1]]);
  for (let first = 0; first < edges.length; first += 1) {
    for (let second = first + 1; second < edges.length; second += 1) {
      if (second === first + 1 || (first === 0 && second === edges.length - 1)) continue;
      if (segmentsIntersect(...edges[first], ...edges[second]).intersects) return false;
    }
  }
  return true;
}

function normalizeGeometry(geometry) {
  if (!geometry || typeof geometry !== "object") return null;
  if (geometry.type === "Point" && finiteCoordinate(geometry.coordinates)) {
    return { type: "Point", coordinates: [...geometry.coordinates] };
  }
  if (geometry.type === "Polygon" && Array.isArray(geometry.coordinates) && geometry.coordinates.length === 1 && ringIsValid(geometry.coordinates[0])) {
    return { type: "Polygon", coordinates: [geometry.coordinates[0].map((point) => [...point])] };
  }
  return null;
}

function canonicalGeometry(geometry) {
  const normalized = normalizeGeometry(geometry);
  return normalized ? JSON.stringify(normalized) : null;
}

function cross(origin, left, right) {
  return (left[0] - origin[0]) * (right[1] - origin[1]) - (left[1] - origin[1]) * (right[0] - origin[0]);
}

function onSegment(point, start, end) {
  return Math.abs(cross(start, end, point)) <= EPSILON
    && point[0] >= Math.min(start[0], end[0]) - EPSILON
    && point[0] <= Math.max(start[0], end[0]) + EPSILON
    && point[1] >= Math.min(start[1], end[1]) - EPSILON
    && point[1] <= Math.max(start[1], end[1]) + EPSILON;
}

function segmentsIntersect(firstStart, firstEnd, secondStart, secondEnd) {
  const firstCross = cross(firstStart, firstEnd, secondStart);
  const secondCross = cross(firstStart, firstEnd, secondEnd);
  const thirdCross = cross(secondStart, secondEnd, firstStart);
  const fourthCross = cross(secondStart, secondEnd, firstEnd);
  const proper = ((firstCross > EPSILON && secondCross < -EPSILON) || (firstCross < -EPSILON && secondCross > EPSILON))
    && ((thirdCross > EPSILON && fourthCross < -EPSILON) || (thirdCross < -EPSILON && fourthCross > EPSILON));
  return {
    intersects: proper || onSegment(secondStart, firstStart, firstEnd) || onSegment(secondEnd, firstStart, firstEnd)
      || onSegment(firstStart, secondStart, secondEnd) || onSegment(firstEnd, secondStart, secondEnd),
    proper,
  };
}

function polygonEdges(polygon) {
  const ring = polygon.coordinates[0];
  return ring.slice(0, -1).map((point, index) => [point, ring[index + 1]]);
}

function pointLocation(point, polygon) {
  const edges = polygonEdges(polygon);
  let inside = false;
  for (const [start, end] of edges) {
    if (onSegment(point, start, end)) return "BOUNDARY";
    const crossesRay = (start[1] > point[1]) !== (end[1] > point[1]);
    if (crossesRay && point[0] < ((end[0] - start[0]) * (point[1] - start[1])) / (end[1] - start[1]) + start[0]) inside = !inside;
  }
  return inside ? "INTERIOR" : "EXTERIOR";
}

function boundaryIntersects(first, second) {
  let proper = false;
  let intersects = false;
  for (const [firstStart, firstEnd] of polygonEdges(first)) {
    for (const [secondStart, secondEnd] of polygonEdges(second)) {
      const intersection = segmentsIntersect(firstStart, firstEnd, secondStart, secondEnd);
      if (intersection.intersects) {
        intersects = true;
        if (intersection.proper) proper = true;
      }
    }
  }
  return { intersects, proper };
}

function polygonContainsPolygon(container, candidate) {
  if (canonicalGeometry(container) === canonicalGeometry(candidate)) return false;
  if (boundaryIntersects(container, candidate).intersects) return false;
  return candidate.coordinates[0].slice(0, -1).every((point) => pointLocation(point, container) === "INTERIOR");
}

function polygonTopology(first, second) {
  const same = canonicalGeometry(first) === canonicalGeometry(second);
  const boundary = boundaryIntersects(first, second);
  const firstContainsSecond = polygonContainsPolygon(first, second);
  const secondContainsFirst = polygonContainsPolygon(second, first);
  const firstHasInteriorPoint = first.coordinates[0].slice(0, -1).some((point) => pointLocation(point, second) === "INTERIOR");
  const secondHasInteriorPoint = second.coordinates[0].slice(0, -1).some((point) => pointLocation(point, first) === "INTERIOR");
  const interiorOverlap = boundary.proper || firstHasInteriorPoint || secondHasInteriorPoint;

  return { same, firstContainsSecond, secondContainsFirst, boundary, interiorOverlap };
}

function evaluatePointPolygon(first, second, relationship) {
  const polygon = first.type === "Polygon" ? first : second;
  const point = first.type === "Point" ? first : second;
  const location = pointLocation(point.coordinates, polygon);
  const polygonFirst = first.type === "Polygon";
  if (relationship === RELATIONSHIP_TYPES.CONTAINS) return polygonFirst && location === "INTERIOR";
  if (relationship === RELATIONSHIP_TYPES.WITHIN) return !polygonFirst && location === "INTERIOR";
  if (relationship === RELATIONSHIP_TYPES.TOUCHES) return location === "BOUNDARY";
  if (relationship === RELATIONSHIP_TYPES.DISJOINT) return location === "EXTERIOR";
  return null;
}

function evaluatePolygonPair(first, second, relationship) {
  const topology = polygonTopology(first, second);
  if (relationship === RELATIONSHIP_TYPES.SAME_LOCATION) return topology.same;
  if (relationship === RELATIONSHIP_TYPES.CONTAINS) return topology.firstContainsSecond;
  if (relationship === RELATIONSHIP_TYPES.WITHIN) return topology.secondContainsFirst;
  if (relationship === RELATIONSHIP_TYPES.INTERSECTS) return topology.same || topology.interiorOverlap || topology.boundary.intersects || topology.firstContainsSecond || topology.secondContainsFirst;
  if (relationship === RELATIONSHIP_TYPES.OVERLAPS) return !topology.same && topology.interiorOverlap && !topology.firstContainsSecond && !topology.secondContainsFirst;
  if (relationship === RELATIONSHIP_TYPES.TOUCHES) return !topology.same && topology.boundary.intersects && !topology.interiorOverlap && !topology.firstContainsSecond && !topology.secondContainsFirst;
  if (relationship === RELATIONSHIP_TYPES.DISJOINT) return !topology.same && !topology.boundary.intersects && !topology.firstContainsSecond && !topology.secondContainsFirst && !topology.interiorOverlap;
  return null;
}

export function evaluateRelationship(leftFeature, rightFeature, relationship) {
  if (!SUPPORTED_RELATIONSHIPS.has(relationship)) {
    return failure(relationship, relationship === RELATIONSHIP_TYPES.ADJACENT_TO ? "UNSUPPORTED_IN_V1" : "UNSUPPORTED_RELATIONSHIP");
  }
  if (!visibleAndEligible(leftFeature) || !visibleAndEligible(rightFeature)) return failure(relationship, "INELIGIBLE_OR_RESTRICTED_INPUT");
  if (!sameSpace(leftFeature, rightFeature)) return failure(relationship, "INCOMPATIBLE_COORDINATE_SPACE_OR_TRANSFORM_REQUIRED");

  const leftGeometry = normalizeGeometry(leftFeature.geometry);
  const rightGeometry = normalizeGeometry(rightFeature.geometry);
  if (!leftGeometry || !rightGeometry) return failure(relationship, "INVALID_OR_UNSUPPORTED_GEOMETRY");

  if (relationship === RELATIONSHIP_TYPES.SAME_LOCATION) {
    const value = canonicalGeometry(leftGeometry) === canonicalGeometry(rightGeometry);
    return result({ left: leftFeature, right: rightFeature, relationship, value });
  }

  const pointPolygonPair = (leftGeometry.type === "Point" && rightGeometry.type === "Polygon")
    || (leftGeometry.type === "Polygon" && rightGeometry.type === "Point");
  const polygonPair = leftGeometry.type === "Polygon" && rightGeometry.type === "Polygon";
  let value = null;
  if (pointPolygonPair) value = evaluatePointPolygon(leftGeometry, rightGeometry, relationship);
  if (polygonPair) value = evaluatePolygonPair(leftGeometry, rightGeometry, relationship);
  if (value === null) return failure(relationship, "UNSUPPORTED_GEOMETRY_RELATIONSHIP");

  return result({ left: leftFeature, right: rightFeature, relationship, value });
}
