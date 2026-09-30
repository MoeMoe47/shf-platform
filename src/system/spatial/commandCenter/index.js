export const SPATIAL_COMMAND_CENTER_ARCHITECTURE_CONTRACT = Object.freeze({
  wave: "8B",
  runtimeRole: "COMPOSE_EXISTING_SANITIZED_SPATIAL_PROJECTIONS",
  sourceAuthority: false,
  domainAuthority: false,
  policyAuthority: false,
  navigationAuthority: false,
  publicationAuthority: false,
  authorizationAuthority: false,
  eligibilityAuthority: false,
  metricAuthority: false,
  transformAuthority: false,
});

export const COMMAND_CENTER_PROHIBITED_AUTHORITIES = Object.freeze([
  "source",
  "domain",
  "policy",
  "navigation",
  "publication",
  "authorization",
  "eligibility",
  "jurisdiction",
  "service-area",
  "dispatch",
  "traffic",
  "water",
  "transit",
  "metric",
  "transform",
]);

export const COMMAND_CENTER_PROHIBITED_EXPORTS = Object.freeze([
  "authorize",
  "approve",
  "determineEligibility",
  "assignJurisdiction",
  "assignServiceArea",
  "dispatch",
  "routeTraffic",
  "routeWater",
  "routeTransit",
  "publish",
  "transformCoordinates",
  "convertCoordinateSpace",
  "mutateDomainRecord",
  "establishMetricTruth",
]);

export {
  getCommandCenterQualifiedClient,
  getCommandCenterQualifiedClientByCoordinateSpace,
  isCommandCenterIntelligenceQualified,
  isCommandCenterSpatialQualified,
  listCommandCenterQualifiedClients,
  SPATIAL_COMMAND_CENTER_QUALIFIED_CLIENTS_V1,
  SPATIAL_COMMAND_CENTER_QUALIFIED_INTELLIGENCE_V1,
} from "./qualifiedClientRegistry.js";
export {
  areCommandCenterCoordinateSpacesCompatible,
  COMMAND_CENTER_COORDINATE_FAMILIES,
  COMMAND_CENTER_CROSS_SPACE_REJECTIONS,
  COMMAND_CENTER_SPATIAL_COORDINATE_SPACES_V1,
  COMMAND_CENTER_TRANSFORM_POLICY,
  getCommandCenterCoordinateFamily,
  isCommandCenterCoordinateSpace,
  rejectCommandCenterCrossSpaceOperation,
} from "./coordinateIsolation.js";
export {
  COMMAND_CENTER_SPATIAL_VIEW_ALLOWED_FIELDS,
  COMMAND_CENTER_SPATIAL_VIEW_STATE_RULES,
  createCommandCenterSpatialView,
} from "./viewModel.js";
export {
  COMMAND_CENTER_PRIVACY_EXCLUDED_FIELDS,
  COMMAND_CENTER_PRIVACY_POLICY,
  sanitizeCommandCenterSpatialView,
} from "./privacy.js";
