export const SPATIAL_COMMAND_CENTER_QUALIFIED_CLIENTS_V1 = Object.freeze([
  Object.freeze({
    id: "iep-ohio-county-map",
    label: "IEP Ohio County Map",
    coordinateFamily: "REAL_WORLD",
    coordinateSpace: "real-world.county-geojson",
    active: true,
    spatialQualified: true,
    intelligenceQualified: false,
  }),
  Object.freeze({
    id: "metaverse-quick-map",
    label: "Metaverse Quick Map",
    coordinateFamily: "METAVERSE",
    coordinateSpace: "metaverse.quick-map",
    active: true,
    spatialQualified: true,
    intelligenceQualified: false,
  }),
  Object.freeze({
    id: "metaverse-regional-scene-oil-rig",
    label: "Metaverse Regional Scene - Oil Rig",
    coordinateFamily: "METAVERSE",
    coordinateSpace: "metaverse.regional-scene",
    active: true,
    spatialQualified: true,
    intelligenceQualified: true,
  }),
]);

export const SPATIAL_COMMAND_CENTER_QUALIFIED_INTELLIGENCE_V1 = Object.freeze([
  Object.freeze({
    clientId: "metaverse-regional-scene-oil-rig",
    label: "Metaverse Regional Scene - Oil Rig",
    coordinateSpace: "metaverse.regional-scene",
    intelligenceQualified: true,
  }),
]);

const CLIENTS_BY_ID = new Map(SPATIAL_COMMAND_CENTER_QUALIFIED_CLIENTS_V1.map((client) => [client.id, client]));
const CLIENTS_BY_SPACE = new Map(SPATIAL_COMMAND_CENTER_QUALIFIED_CLIENTS_V1.map((client) => [client.coordinateSpace, client]));
const INTELLIGENCE_CLIENT_IDS = new Set(SPATIAL_COMMAND_CENTER_QUALIFIED_INTELLIGENCE_V1.map((entry) => entry.clientId));

export function listCommandCenterQualifiedClients() {
  return SPATIAL_COMMAND_CENTER_QUALIFIED_CLIENTS_V1;
}

export function getCommandCenterQualifiedClient(clientId) {
  return CLIENTS_BY_ID.get(clientId) || null;
}

export function getCommandCenterQualifiedClientByCoordinateSpace(coordinateSpace) {
  return CLIENTS_BY_SPACE.get(coordinateSpace) || null;
}

export function isCommandCenterSpatialQualified(clientId) {
  return CLIENTS_BY_ID.get(clientId)?.spatialQualified === true;
}

export function isCommandCenterIntelligenceQualified(clientId) {
  return INTELLIGENCE_CLIENT_IDS.has(clientId);
}
