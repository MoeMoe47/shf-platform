// Phase 4G — Mission → Evidence boundary (describe-only).
//
// Mirrors the MET-7/MET-8 evidence adapters: pure and read-only. It never writes
// prepare_prove_evidence or truth facts and never calls projectAuthoritativeFact or
// createEvidenceRule. Metaverse presence, received world events, animations or
// character dialogue are never evidence by themselves; only a SUCCEEDED runtime
// (canonical Mission conditions met through learner actions) can be a candidate,
// and the Evidence authority alone decides whether it becomes Evidence.
//
// The verified-evidence authority is frozen for this phase (governance guards in
// tests/arcadeCanonicalHistory and tests/arcadeLegacyHistoryTruthQuarantine), so it does not
// yet address Mission Runtime results. Registering that source type is a separate, governed
// Evidence-authority change; until then this describes the candidate and its provenance only.
import { MISSION_SYSTEM_EVENTS } from "../../mission-content/model/mission-scenario.js";
import type { MissionRuntimeEvent, MissionRuntimeSession } from "../model/mission-runtime.js";

export const MISSION_EVIDENCE_SOURCE_TYPE = "MISSION_RUNTIME_RESULT" as const;
export const MISSION_EVIDENCE_SOURCE_ADDRESSABLE = false as const;
const RUNTIME_OWNED_PREFIX = "MISSION_";

export function describeMissionEvidenceCandidate(session: MissionRuntimeSession, events: readonly MissionRuntimeEvent[]) {
  const learnerEvents = events.filter((event) => !event.eventType.startsWith(RUNTIME_OWNED_PREFIX));
  const worldContext = events.find((event) => event.eventType === MISSION_SYSTEM_EVENTS.worldContextCaptured)?.payload as any;
  const accommodation = events.find((event) => event.eventType === MISSION_SYSTEM_EVENTS.accommodationProjected)?.payload as any;
  const eligible = session.status === "SUCCEEDED" && learnerEvents.length > 0;
  return {
    possibleSourceType: MISSION_EVIDENCE_SOURCE_TYPE,
    sourceRecordId: session.id,
    canBecomeEvidenceCandidate: eligible,
    addressableByEvidenceAuthority: MISSION_EVIDENCE_SOURCE_ADDRESSABLE,
    isVerifiedEvidence: false as const,
    provenance: {
      missionRuntimeId: session.id,
      missionId: session.missionId,
      missionVersion: session.missionVersion,
      runtimeStatus: session.status,
      completedAt: session.completedAt,
      completedObjectiveIds: session.objectiveStates.filter((item) => item.status === "COMPLETED").map((item) => item.objectiveId),
      learnerActionRefs: learnerEvents.map((event) => ({ sequence: event.sequence, eventType: event.eventType, occurredAt: event.occurredAt })),
      worldContext: worldContext ? {
        contextKind: worldContext.contextKind, simulated: worldContext.simulated, scenarioId: worldContext.scenario?.scenarioId,
        correlationId: worldContext.scenario?.correlationId, molEventIds: (worldContext.eventRefs ?? []).map((ref: any) => ref.molEventId),
      } : null,
      // Assessment conditions as actually recorded vs applied. Requirements may be present; Phase 4G applies
      // no timing adjustment, so `timingAdjustmentApplied` is always false. No accommodation details leave the runtime.
      assessmentConditions: {
        timingAccommodationPresent: accommodation?.timingAdjustmentRequired === true || accommodation?.breakAccommodationRequired === true,
        timingAdjustmentApplied: false,
      },
    },
    notes: eligible
      ? "A SUCCEEDED Mission Runtime is an evidence candidate. It becomes Evidence only after the verified-evidence authority accepts MISSION_RUNTIME_RESULT as a source (a governed change outside 4G), the organization registers a rule, and that authority projects it."
      : "No evidence candidate: the runtime has not SUCCEEDED through learner actions. World context, presence and received events are never evidence.",
  };
}
