import type { MissionRuntimeEvent, MissionRuntimeSession } from "../../mission-runtime/model/mission-runtime.js";
import type { MissionDefinition } from "../../mission-content/model/mission-definition.js";

export const MISSION_DIRECTOR_POLICY_VERSION = "mission-director-policy.v1";
export const MISSION_DIRECTOR_ESCALATION_REASONS = ["SAFETY_CONCERN", "RUNTIME_AMBIGUITY", "OPERATOR_REVIEW", "OTHER"] as const;
export type MissionDirectorEscalationReason = (typeof MISSION_DIRECTOR_ESCALATION_REASONS)[number];
export type MissionDirectorScalar = string | number | boolean;

export type MissionDirectorAction =
  | { type: "NO_OP" }
  | { type: "EMIT_DECLARED_EVENT"; eventType: string; payload?: Record<string, unknown> }
  | { type: "SET_DECLARED_RUNTIME_STATE"; key: string; value: MissionDirectorScalar }
  | { type: "ESCALATE"; reasonCode: MissionDirectorEscalationReason; message?: string };

export type MissionDirectorDecisionStatus = "APPLIED" | "NO_OP" | "REJECTED" | "FAILED";
export type MissionDirectorExecutorKind = "DETERMINISTIC" | "FIXTURE";

export interface MissionDirectorContext {
  runtimeSessionId: string;
  organizationId: string;
  tenantId: string;
  missionId: string;
  missionVersion: number;
  runtimeRevision: number;
  runtimeStatus: MissionRuntimeSession["status"];
  definitionSnapshot: MissionDefinition;
  objectiveStates: MissionRuntimeSession["objectiveStates"];
  stageStates: MissionRuntimeSession["stageStates"];
  runtimeState: MissionRuntimeSession["runtimeState"];
  recentEvents: MissionRuntimeEvent[];
  aiCapabilities: MissionDefinition["aiCapabilities"];
}

export interface MissionDirectorProposal {
  action: unknown;
  providerExecutionRef?: string | null;
}

export interface MissionDirectorInvocation {
  status: MissionDirectorDecisionStatus;
  action: MissionDirectorAction | null;
  rejectionReason: string | null;
  contextDigest: string;
  decisionId: string;
  runtime: MissionRuntimeSession;
}
