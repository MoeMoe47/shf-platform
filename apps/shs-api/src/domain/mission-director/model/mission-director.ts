import type { MissionRuntimeEvent, MissionRuntimeSession } from "../../mission-runtime/model/mission-runtime.js";
import type { MissionDefinition } from "../../mission-content/model/mission-definition.js";
import type { MissionCharacter, MissionDifficultyTier } from "../../mission-content/model/mission-scenario.js";

export const MISSION_DIRECTOR_POLICY_VERSION = "mission-director-policy.v2";
export const MISSION_DIRECTOR_ESCALATION_REASONS = ["SAFETY_CONCERN", "RUNTIME_AMBIGUITY", "OPERATOR_REVIEW", "OTHER"] as const;
export type MissionDirectorEscalationReason = (typeof MISSION_DIRECTOR_ESCALATION_REASONS)[number];
export type MissionDirectorScalar = string | number | boolean;

export type MissionDirectorAction =
  | { type: "NO_OP" }
  | { type: "EMIT_DECLARED_EVENT"; eventType: string; payload?: Record<string, unknown> }
  | { type: "SET_DECLARED_RUNTIME_STATE"; key: string; value: MissionDirectorScalar }
  | { type: "ESCALATE"; reasonCode: MissionDirectorEscalationReason; message?: string }
  // Phase 4F bounded adaptive-scenario and simulated-character actions.
  | { type: "ADAPT_DIFFICULTY"; tier: MissionDifficultyTier }
  | { type: "SELECT_SCENARIO_BRANCH"; branchId: string }
  // Identifier-only: authored text is resolved server-side. Generated (free-text) dialogue is deferred.
  | { type: "CHARACTER_SPEAK"; characterId: string; lineId: string }
  | { type: "CHARACTER_OBSERVE"; characterId: string; factId: string }
  | { type: "CHARACTER_REQUEST_ACTION"; characterId: string; objectiveId: string };

export type MissionDirectorCharacterAction = Extract<MissionDirectorAction, { characterId: string }>;

export type MissionDirectorDecisionStatus = "APPLIED" | "NO_OP" | "REJECTED" | "FAILED";
export type MissionDirectorExecutorKind = "DETERMINISTIC" | "FIXTURE";

// INTERNAL server-side context. It carries the full frozen definitionSnapshot for deterministic
// policy and declaration checks and is never handed to an executor.
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

// EXECUTOR-facing context: a closed, least-privilege projection of the frozen snapshot. It never
// contains the raw definition, organization/tenant/learner identifiers, future-stage content, or
// any character's authored line/fact text or dialogue history: characters appear as a directory.
export interface MissionDirectorExecutorStage {
  stageId: string;
  title: string;
  description: string;
}

export interface MissionDirectorExecutorObjective {
  objectiveId: string;
  title: string;
  type: MissionDefinition["objectives"][number]["type"];
  required: boolean;
  status: MissionRuntimeSession["objectiveStates"][number]["status"];
}

export interface MissionDirectorExecutorCharacter {
  characterId: string;
  displayName: string;
  characterType: MissionCharacter["characterType"];
  simulatedRole: string;
  allowedBehaviors: MissionCharacter["allowedBehaviors"];
  knowledgeScope: MissionCharacter["knowledgeScope"];
  dialogueMode: MissionCharacter["dialogueMode"];
  // Opaque declared identifiers only; line/fact text and dialogue history stay server-side.
  scriptedLineIds: string[];
  scenarioFactIds: string[];
  interactionCount: number;
}

export interface MissionDirectorExecutorContext {
  runtimeSessionId: string;
  missionId: string;
  missionVersion: number;
  runtimeRevision: number;
  runtimeStatus: MissionRuntimeSession["status"];
  aiCapabilities: MissionDefinition["aiCapabilities"];
  activeStages: MissionDirectorExecutorStage[];
  objectives: MissionDirectorExecutorObjective[];
  runtimeState: MissionRuntimeSession["runtimeState"];
  recentEvents: Array<{ sequence: number; eventType: string; payload: Record<string, unknown> }>;
  difficulty: { currentTier: MissionDifficultyTier; allowedTiers: MissionDifficultyTier[] } | null;
  scenarioBranching: { currentBranchId: string; branches: Array<{ branchId: string; label: string; available: boolean }> } | null;
  characters: MissionDirectorExecutorCharacter[];
  // Phase 4G: minimal LIVE world summary via Mission Runtime; never raw MOL state, events or accommodations.
  worldContext: MissionDirectorExecutorWorldContext | null;
}

export interface MissionDirectorExecutorWorldContext {
  contextKind: "LIVE";
  simulated: boolean;
  conditions: Array<{ category: string; key: string; state: string; freshness: string }>;
  unavailableCapabilities: string[];
  degradedCapabilities: string[];
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
