// MET-7 — mission operational events (build brief §11).
//
// Same operational-telemetry sink MET-5/MET-6 already use
// (apps/shs-api/src/observability/operational-telemetry.ts) — no new
// event bus, no new persistence. These are operational facts only:
// METAVERSE_OPERATIONAL_EVENT_BOUNDARY (reused, not redefined) asserts
// none of them creates verified mastery, an outcome, a credential, or
// employment eligibility.
import { emitOperationalTelemetry } from "../../../observability/operational-telemetry.js";
import { METAVERSE_OPERATIONAL_EVENT_BOUNDARY } from "../unlocks/unlock-authority-adapter.js";

export const MISSION_OPERATIONAL_EVENTS = [
  "metaverse.mission.viewed",
  "metaverse.mission.started",
  "metaverse.mission.exited",
  "metaverse.mission.submitted",
  "metaverse.mission.activity_completed",
] as const;
export type MissionOperationalEventName = (typeof MISSION_OPERATIONAL_EVENTS)[number];

export function emitMetaverseMissionEvent(eventName: MissionOperationalEventName, input: { missionProjectionId: string; assignmentId: string; missionStatus: string }) {
  if (!MISSION_OPERATIONAL_EVENTS.includes(eventName)) return null;
  return emitOperationalTelemetry({
    event_name: eventName,
    severity: "INFO",
    component: "metaverse_mission_runtime",
    category: "SECURITY",
    outcome: "SUCCESS",
    metadata: {
      correlation_id: input.missionProjectionId,
      reason: input.assignmentId,
      status_code: input.missionStatus,
      component: "metaverse_mission_runtime",
    },
  });
}

export { METAVERSE_OPERATIONAL_EVENT_BOUNDARY };
