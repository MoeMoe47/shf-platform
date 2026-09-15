// MET-13 §34 — operational events only. These are operational facts, not
// evidence or mastery. Reuses the same canonical telemetry sink as
// unlock-authority-adapter.ts / metaverse-event-adapter.ts and missions/
// mission-event-adapter.ts, rather than inventing a second event bus.

import { emitOperationalTelemetry } from "../../../../observability/operational-telemetry.js";
import { METAVERSE_OPERATIONAL_EVENT_BOUNDARY } from "../../unlocks/unlock-authority-adapter.js";

export { METAVERSE_OPERATIONAL_EVENT_BOUNDARY };

export const SIMULATION_OPERATIONAL_EVENTS = [
  "simulation.started",
  "simulation.step_completed",
  "simulation.failed",
  "simulation.retried",
  "simulation.completed",
  "simulation.artifact_submitted",
] as const;
export type SimulationOperationalEventName = (typeof SIMULATION_OPERATIONAL_EVENTS)[number];

export const SIMULATION_OPERATIONAL_EVENT_BOUNDARY = {
  eventsAreOperationalFactsOnly: true,
  eventsCreateVerifiedSkill: false,
  eventsCreateMastery: false,
  eventsCreateCredential: false,
} as const;

export function emitSimulationOperationalEvent(
  eventName: SimulationOperationalEventName,
  input: { simulationId: string; sessionId: string; organizationId: string; userId: string; districtId: string; facilityId: string; extra?: Record<string, unknown> },
) {
  if (!SIMULATION_OPERATIONAL_EVENTS.includes(eventName)) return null;
  return emitOperationalTelemetry({
    event_name: eventName,
    severity: eventName === "simulation.failed" ? "WARNING" : "INFO",
    component: "metaverse_simulation_runtime",
    category: "SECURITY",
    outcome: eventName === "simulation.failed" ? "EXPECTED_DOMAIN_REJECTION" : "SUCCESS",
    metadata: {
      simulation_id: input.simulationId,
      session_id: input.sessionId,
      organization_id: input.organizationId,
      user_id: input.userId,
      district_id: input.districtId,
      facility_id: input.facilityId,
      ...input.extra,
    },
  });
}
