export const ARCADE_RUNTIME_FAMILIES = ["learning", "classic"] as const;
export type ArcadeRuntimeFamily = typeof ARCADE_RUNTIME_FAMILIES[number];

export const ARCADE_RUNTIME_SESSION_TYPES = ["game", "simulation", "mission", "challenge", "practice"] as const;
export type ArcadeRuntimeSessionType = typeof ARCADE_RUNTIME_SESSION_TYPES[number];

export const ARCADE_RUNTIME_SESSION_STATUSES = ["ACTIVE", "PAUSED", "COMPLETED", "ABANDONED", "EXPIRED"] as const;
export type ArcadeRuntimeSessionStatus = typeof ARCADE_RUNTIME_SESSION_STATUSES[number];

export interface ArcadeRuntimeSession {
  id: string;
  organizationId: string;
  tenantId: string;
  userId: string;
  experienceId: string;
  arcadeActivityId: string | null;
  family: ArcadeRuntimeFamily;
  sessionType: ArcadeRuntimeSessionType;
  status: ArcadeRuntimeSessionStatus;
  startedAt: string;
  lastActivityAt: string;
  completedAt: string | null;
  abandonedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export type ArcadeRuntimeSessionAction = "PAUSE" | "RESUME" | "COMPLETE" | "ABANDON";
