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
  // Learner actions only: never runtime-owned events, never Director-emitted declared events, and in a team
  // Mission only server-attributed participant actions.
  const team = Boolean(session.definitionSnapshot.multiplayer);
  const learnerEvents = events.filter((event) => !event.eventType.startsWith(RUNTIME_OWNED_PREFIX)
    && event.payload?.emittedBy !== "MISSION_DIRECTOR"
    && (!team || (event.payload?.participant as any)?.attributedBy === "MISSION_TEAM"));
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
      learnerActionRefs: learnerEvents.map((event) => {
        const participant = event.payload?.participant as any;
        return {
          sequence: event.sequence, eventType: event.eventType, occurredAt: event.occurredAt,
          ...(participant?.attributedBy === "MISSION_TEAM" ? { participantId: participant.participantId, missionRole: participant.missionRole } : {}),
        };
      }),
      // Phase 5: a team result is TEAM PERFORMANCE. It never establishes that every participant
      // demonstrated every skill; individual demonstration is only each participant's own attributed actions.
      team: session.definitionSnapshot.multiplayer ? {
        scope: "TEAM_PERFORMANCE" as const,
        individualEvidenceInferred: false as const,
        individualDemonstration: Object.values(learnerEvents.reduce((acc: Record<string, { participantId: string; missionRole: string; actionCount: number }>, event) => {
          const participant = event.payload?.participant as any;
          if (participant?.attributedBy !== "MISSION_TEAM") return acc;
          const entry = acc[participant.participantId] ??= { participantId: participant.participantId, missionRole: participant.missionRole, actionCount: 0 };
          entry.actionCount += 1;
          return acc;
        }, {})),
      } : null,
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
