import type { MissionDefinition } from "../../mission-content/model/mission-definition.js";

export const MISSION_RUNTIME_STATUSES = ["ACTIVE", "PAUSED", "SUCCEEDED", "FAILED", "ABANDONED", "EXPIRED"] as const;
export type MissionRuntimeStatus = (typeof MISSION_RUNTIME_STATUSES)[number];
export const MISSION_RUNTIME_OBJECTIVE_STATUSES = ["PENDING", "ACTIVE", "COMPLETED"] as const;
export type MissionRuntimeObjectiveStatus = (typeof MISSION_RUNTIME_OBJECTIVE_STATUSES)[number];
export const MISSION_RUNTIME_STAGE_STATUSES = ["LOCKED", "ACTIVE", "COMPLETED"] as const;
export type MissionRuntimeStageStatus = (typeof MISSION_RUNTIME_STAGE_STATUSES)[number];

export interface MissionObjectiveState {
  objectiveId: string;
  status: MissionRuntimeObjectiveStatus;
  completedAt: string | null;
}

export interface MissionStageState {
  stageId: string;
  status: MissionRuntimeStageStatus;
  startedAt: string | null;
  completedAt: string | null;
  optional: boolean;
}

export interface MissionRuntimeEvent {
  id: string;
  sequence: number;
  eventType: string;
  payload: Record<string, unknown>;
  occurredAt: string;
  serverReceivedAt: string;
}

export interface MissionRuntimeSession {
  id: string;
  organizationId: string;
  tenantId: string;
  userId: string;
  missionId: string;
  missionVersion: number;
  definitionSnapshot: MissionDefinition;
  status: MissionRuntimeStatus;
  revision: number;
  objectiveStates: MissionObjectiveState[];
  stageStates: MissionStageState[];
  runtimeState: Record<string, string | number | boolean>;
  arcadeRuntimeSessionId: string | null;
  startedAt: string;
  pausedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  abandonedAt: string | null;
  expiredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const MISSION_RUNTIME_STATE_MAX_BYTES = 16 * 1024;
export const MISSION_RUNTIME_EVENT_MAX_BYTES = 4 * 1024;
export const MISSION_RUNTIME_MAX_EVENTS = 500;
export const MISSION_RUNTIME_MAX_STATE_DEPTH = 4;
