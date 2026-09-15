// MET-13 §31 — City Orchestration surfacing.
//
// This is an additive integration seam: it reuses SimulationSessionService
// (which itself reuses MET-3/MET-5) to build briefing/next-action/fast-
// travel shaped items, without modifying MET-11's own
// city-orchestration-service.ts pure functions or its already-tested
// CityOrchestrationProjection contract. See MET-13 doc §"City
// Orchestration integration" for why a deeper merge into MET-11's own
// arrays is left as a documented P1 rather than risking that domain's
// existing acceptance tests.

import { SimulationSessionService } from "./simulation-session-service.js";

const service = new SimulationSessionService();

export async function getSimulationOrchestrationSurface(user: any) {
  const items = await service.listCatalog(user);
  const available = items.filter((item) => item.can_enter);

  const briefingItems = available.map((item) => ({
    id: item.simulation.simulationId,
    title: item.simulation.title,
    summary: item.simulation.summary,
    source_type: "SIMULATION",
    source_ref: item.simulation.simulationId,
    district_id: item.simulation.districtId,
    facility_id: item.simulation.facilityId,
    status: item.simulation.isFlagship ? "FLAGSHIP" : "AVAILABLE",
  }));

  const flagship = available.find((item) => item.simulation.isFlagship);
  const nextAction = flagship
    ? {
      action_type: flagship.simulation.programId || flagship.simulation.careerPathwayId ? "JOIN_PROGRAM_MISSION" : "EXPLORE_SIDE_MISSION",
      title: `Try: ${flagship.simulation.title}`,
      summary: flagship.simulation.summary,
      reason: "Flagship metaverse simulation available in this district.",
      source_type: "SIMULATION",
      source_ref: flagship.simulation.simulationId,
      district_id: flagship.simulation.districtId,
      facility_id: flagship.simulation.facilityId,
      route_or_destination: null,
      priority: 50,
      priority_band: "SIDE_MISSION_ENRICHMENT",
      is_required: false,
      is_available: true,
      blocked_reason: null,
    }
    : null;

  const fastTravelDestinations = available.map((item) => ({
    destination_id: item.simulation.simulationId,
    label: item.simulation.title,
    district_id: item.simulation.districtId,
    facility_id: item.simulation.facilityId,
    activity_id: item.simulation.activityId,
    route_or_destination: null,
    protected_entry_required: true,
    available: true,
    blocked_reason: null,
  }));

  return {
    projection_version: "MET-13",
    briefing_items: briefingItems,
    next_action: nextAction,
    fast_travel_destinations: fastTravelDestinations,
    authority_reuse: {
      unlock: "MET-3 learner unlock projection (reused, not reimplemented)",
      protected_entry: "MET-5 protected entry service (reused, not reimplemented)",
      city_orchestration: "MET-11 city-orchestration-service.ts contract untouched; this is an additive surface",
    },
  };
}
