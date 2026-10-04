import { QUICK_MAP_COORDINATE_SPACE } from "../metaverseMiniMapRegistry.js";
import { getMoccIntegrationStatus } from "./moccIntegrationStatusRegistry.js";

export const MOCC_OVERLAY_CATEGORIES = Object.freeze([
  "MOBILITY",
  "PUBLIC_SAFETY",
  "INFRASTRUCTURE",
  "ENVIRONMENT",
  "LOGISTICS",
  "MISSIONS",
  "SIMULATION",
  "CIVIC",
  "AGENTS",
  "PARTICIPANTS",
  "MEDIA",
]);

function overlay(input) {
  const integration = getMoccIntegrationStatus(input.integration_domain);
  return Object.freeze({
    overlay_id: input.overlay_id,
    label: input.label,
    domain: input.domain,
    category: input.category,
    integration_domain: input.integration_domain,
    status: integration?.status ?? "NOT_CONNECTED",
    source_authority: integration?.owning_system ?? null,
    integration_status: integration,
    spatial_authority: input.spatial ? QUICK_MAP_COORDINATE_SPACE.id : null,
    data_source: integration?.expected_interface ?? null,
    supports_live: input.supports_live ?? false,
    supports_simulation: input.supports_simulation ?? false,
    supports_history: input.supports_history ?? false,
    default_visible: false,
    render_priority: input.render_priority,
    legend_key: input.legend_key,
    description: input.description,
  });
}

export const MOCC_OPERATIONAL_OVERLAYS = Object.freeze([
  overlay({ overlay_id: "traffic", label: "Traffic", domain: "TRAFFIC", category: "MOBILITY", integration_domain: "TRAFFIC", spatial: true, legend_key: "traffic", render_priority: 20, description: "Traffic state and source-backed mobility events." }),
  overlay({ overlay_id: "transit-mobility", label: "Transit / Mobility", domain: "TRANSIT_MOBILITY", category: "MOBILITY", integration_domain: "TRAFFIC", spatial: true, legend_key: "mobility", render_priority: 30, description: "Transit and mobility context when supplied by the traffic authority." }),
  overlay({ overlay_id: "weather", label: "Weather", domain: "WEATHER_OBSERVATIONS", category: "ENVIRONMENT", integration_domain: "WEATHER_OBSERVATIONS", spatial: true, legend_key: "weather", render_priority: 40, description: "Authoritative weather observations; local presets are not live observations." }),
  overlay({ overlay_id: "environmental-hazards", label: "Environmental Hazards", domain: "ENVIRONMENTAL_HAZARDS", category: "ENVIRONMENT", integration_domain: "WEATHER_OBSERVATIONS", spatial: true, legend_key: "hazard", render_priority: 45, description: "Source-backed environmental hazard locations and states." }),
  overlay({ overlay_id: "fire-ems-incidents", label: "Fire / EMS / Incidents", domain: "FIRE_EMS_INCIDENTS", category: "PUBLIC_SAFETY", integration_domain: "FIRE_EMS_INCIDENTS", spatial: true, legend_key: "incident", render_priority: 10, description: "Read-only incidents from the owning incident or dispatch authority." }),
  overlay({ overlay_id: "power", label: "Power", domain: "POWER", category: "INFRASTRUCTURE", integration_domain: "UTILITIES", spatial: true, legend_key: "power", render_priority: 50, description: "Source-backed power infrastructure state." }),
  overlay({ overlay_id: "water-wastewater-stormwater", label: "Water / Wastewater / Stormwater", domain: "WATER_SYSTEMS", category: "INFRASTRUCTURE", integration_domain: "UTILITIES", spatial: true, legend_key: "water", render_priority: 51, description: "Source-backed water system state." }),
  overlay({ overlay_id: "telecom-fiber", label: "Telecom / Fiber", domain: "TELECOM_FIBER", category: "INFRASTRUCTURE", integration_domain: "UTILITIES", spatial: true, legend_key: "telecom", render_priority: 52, description: "Source-backed telecom and fiber system state." }),
  overlay({ overlay_id: "port-logistics", label: "Port / Logistics", domain: "PORT_LOGISTICS", category: "LOGISTICS", integration_domain: "MARINE_AVIATION", spatial: true, legend_key: "logistics", render_priority: 60, description: "Provisional spatial context only until an operational source is connected." }),
  overlay({ overlay_id: "marine", label: "Marine", domain: "MARINE", category: "LOGISTICS", integration_domain: "MARINE_AVIATION", spatial: true, legend_key: "marine", render_priority: 61, description: "Provisional spatial context only; no live marine operations feed is connected." }),
  overlay({ overlay_id: "aviation", label: "Aviation", domain: "AVIATION", category: "LOGISTICS", integration_domain: "MARINE_AVIATION", spatial: true, legend_key: "aviation", render_priority: 62, description: "Provisional spatial context only; no live aviation operations feed is connected." }),
  overlay({ overlay_id: "missions", label: "Missions", domain: "MISSIONS", category: "MISSIONS", integration_domain: "MISSIONS", spatial: true, supports_live: true, supports_simulation: true, supports_history: true, legend_key: "mission", render_priority: 70, description: "Existing read-only mission and program projections." }),
  overlay({ overlay_id: "simulations", label: "Simulations", domain: "SIMULATIONS", category: "SIMULATION", integration_domain: "SIMULATIONS", spatial: true, supports_simulation: true, legend_key: "simulation", render_priority: 80, description: "Existing simulation layer status; runtime telemetry remains a separate pending integration." }),
  overlay({ overlay_id: "civic", label: "Civic", domain: "CIVIC", category: "CIVIC", integration_domain: "CIVIC", spatial: true, supports_live: true, supports_history: true, legend_key: "civic", render_priority: 90, description: "Existing source-backed civic projections." }),
  overlay({ overlay_id: "agents", label: "Agents", domain: "AGENT_ACTIONS", category: "AGENTS", integration_domain: "AGENT_ACTIONS", spatial: true, legend_key: "agent", render_priority: 100, description: "Agent action feed remains pending; no operational entities are available." }),
  overlay({ overlay_id: "students-multiplayer", label: "Students / Multiplayer", domain: "STUDENT_MISSION_ENTRY_EVENTS", category: "PARTICIPANTS", integration_domain: "STUDENT_MISSION_ENTRY_EVENTS", spatial: true, legend_key: "participant", render_priority: 110, description: "Mission-entry event read integration remains pending." }),
  overlay({ overlay_id: "shnn-media", label: "SHNN / Media", domain: "SHNN", category: "MEDIA", integration_domain: "SHNN", spatial: true, legend_key: "media", render_priority: 120, description: "No SHNN operational integration path is connected." }),
  overlay({ overlay_id: "data-centers-infrastructure", label: "Data Centers / Major Infrastructure", domain: "LIVING_CITY", category: "INFRASTRUCTURE", integration_domain: "LIVING_CITY", spatial: true, legend_key: "facility", render_priority: 130, description: "Canonical city/map context only; no facility telemetry is implied." }),
]);

export const MOCC_OPERATIONAL_OVERLAY_BY_ID = Object.freeze(
  Object.fromEntries(MOCC_OPERATIONAL_OVERLAYS.map((item) => [item.overlay_id, item])),
);

export function createDefaultMoccOverlayVisibility() {
  return Object.fromEntries(MOCC_OPERATIONAL_OVERLAYS.map(({ overlay_id, default_visible }) => [overlay_id, default_visible]));
}

export function setMoccOverlayVisibility(visibility, overlayId, visible) {
  if (!MOCC_OPERATIONAL_OVERLAY_BY_ID[overlayId]) return visibility;
  return { ...visibility, [overlayId]: Boolean(visible) };
}

export function getMoccRenderableOverlayEntities(overlayId, sourceEntities) {
  const item = MOCC_OPERATIONAL_OVERLAY_BY_ID[overlayId];
  if (!item || !["CONNECTED", "PARTIAL"].includes(item.status) || !Array.isArray(sourceEntities)) return [];
  return sourceEntities.filter((entity) => entity && typeof entity.source_authority === "string" && entity.source_authority.length > 0);
}
