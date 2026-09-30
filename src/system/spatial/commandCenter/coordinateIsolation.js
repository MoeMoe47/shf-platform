export const COMMAND_CENTER_SPATIAL_COORDINATE_SPACES_V1 = Object.freeze([
  "real-world.latlng",
  "real-world.county-geojson",
  "metaverse.quick-map",
  "metaverse.master-city",
  "metaverse.regional-scene",
  "metaverse.camera-world",
]);

export const COMMAND_CENTER_TRANSFORM_POLICY = Object.freeze({
  transformAvailability: "NONE",
  transformAuthority: null,
  commandCenterMayTransform: false,
});

export const COMMAND_CENTER_CROSS_SPACE_REJECTIONS = Object.freeze([
  "coordinate conversion",
  "cross-space geometry overlay",
  "CONTAINS",
  "WITHIN",
  "INTERSECTS",
  "OVERLAPS",
  "TOUCHES",
  "SAME_LOCATION",
  "distance",
  "cursor synchronization",
]);

export const COMMAND_CENTER_COORDINATE_FAMILIES = Object.freeze({
  "real-world.latlng": "REAL_WORLD",
  "real-world.county-geojson": "REAL_WORLD",
  "metaverse.quick-map": "METAVERSE",
  "metaverse.master-city": "METAVERSE",
  "metaverse.regional-scene": "METAVERSE",
  "metaverse.camera-world": "METAVERSE",
});

const KNOWN_SPACES = new Set(COMMAND_CENTER_SPATIAL_COORDINATE_SPACES_V1);
const CROSS_SPACE_OPERATIONS = new Set(COMMAND_CENTER_CROSS_SPACE_REJECTIONS);

export function isCommandCenterCoordinateSpace(coordinateSpace) {
  return KNOWN_SPACES.has(coordinateSpace);
}

export function getCommandCenterCoordinateFamily(coordinateSpace) {
  return COMMAND_CENTER_COORDINATE_FAMILIES[coordinateSpace] || null;
}

export function areCommandCenterCoordinateSpacesCompatible(leftSpace, rightSpace) {
  return KNOWN_SPACES.has(leftSpace) && leftSpace === rightSpace && rightSpace === leftSpace;
}

export function rejectCommandCenterCrossSpaceOperation({ leftSpace, rightSpace, operation } = {}) {
  if (!KNOWN_SPACES.has(leftSpace) || !KNOWN_SPACES.has(rightSpace)) {
    return Object.freeze({ ok: false, reason: "UNKNOWN_COORDINATE_SPACE" });
  }
  if (leftSpace !== rightSpace) {
    return Object.freeze({
      ok: false,
      reason: "INCOMPATIBLE_COORDINATE_SPACE",
      operation: CROSS_SPACE_OPERATIONS.has(operation) ? operation : "cross-space geometry overlay",
    });
  }
  return Object.freeze({ ok: true, reason: "SAME_COORDINATE_SPACE" });
}
