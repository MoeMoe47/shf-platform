// Phase 6 — Arcade Integration Fabric contracts.
//
// Learning Arcade and Classic Arcade share platform infrastructure but remain separate product
// authorities. Arcade Integration Fabric coordinates integrations; it does not absorb the authority
// of connected systems (Curriculum, Mission Content/Runtime, Multiplayer, Career, Evidence, Truth,
// Identity, Accessibility/Accommodation, MOL, Treasury). The Fabric stores nothing of its own.

// Product type reuses the canonical Arcade family vocabulary (migration 149, experience descriptors).
export const ARCADE_PRODUCT_TYPES = Object.freeze(["learning", "classic"] as const);
export type ArcadeProductType = (typeof ARCADE_PRODUCT_TYPES)[number];

// Normalized capability vocabulary derived from each descriptor; consumers validate capabilities,
// never routes, file paths or product names.
export const ARCADE_INTEGRATION_CAPABILITIES = Object.freeze([
  "MISSION_LAUNCH", "MULTIPLAYER", "LEADERBOARD", "ACHIEVEMENTS", "CAREER_LINK", "CURRICULUM_LINK",
  "EVIDENCE_CANDIDATE", "METAVERSE_CONTEXT", "CREATOR_AUTHORED", "REPLAY",
] as const);
export type ArcadeIntegrationCapability = (typeof ARCADE_INTEGRATION_CAPABILITIES)[number];

export const ARCADE_RUNTIME_KINDS = Object.freeze(["ARCADE_RUNTIME", "MISSION_RUNTIME"] as const);
export type ArcadeRuntimeKind = (typeof ARCADE_RUNTIME_KINDS)[number];

// Stable failure categories (carried as MissionRuntimeError-style codes with HTTP statuses).
export const ARCADE_INTEGRATION_ERRORS = Object.freeze({
  ACTIVITY_NOT_FOUND: 404,
  ACTIVITY_NOT_LAUNCHABLE: 409,
  CAPABILITY_NOT_SUPPORTED: 409,
  DEPENDENCY_UNAVAILABLE: 503,
  MISSION_NOT_PUBLISHED: 404,
  MISSION_VERSION_MISMATCH: 409,
  TENANT_SCOPE_MISMATCH: 403,
  MULTIPLAYER_NOT_ALLOWED: 409,
  EVIDENCE_NOT_ADDRESSABLE: 409,
  RUNTIME_NOT_FOUND: 404,
  LAUNCH_INVALID: 400,
} as const);
export type ArcadeIntegrationErrorCode = keyof typeof ARCADE_INTEGRATION_ERRORS;

export class ArcadeIntegrationError extends Error {
  readonly statusCode: number;
  constructor(readonly code: ArcadeIntegrationErrorCode, message: string, readonly details?: unknown) {
    super(message);
    this.statusCode = ARCADE_INTEGRATION_ERRORS[code];
  }
}

// Telemetry is operational observation only, mapped onto existing runtime logs (Arcade runtime
// telemetry, Mission Runtime events, team history). The Fabric adds no event log of its own.
export const ARCADE_INTEGRATION_TELEMETRY_SOURCES = Object.freeze({
  SESSION_STARTED: "arcade_runtime_sessions / mission_runtime_sessions",
  SESSION_ENDED: "arcade_runtime_sessions.status / mission_runtime_sessions.status",
  ACTIVITY_COMPLETED: "arcade_results / mission_runtime_sessions.status=SUCCEEDED",
  SCORE_RECORDED: "arcade_results.score",
  MISSION_LINKED: "MissionDefinition.arcadeActivityId",
  TEAM_JOINED: "mission_team_events",
  ACHIEVEMENT_ELIGIBLE: "result projection (eligibility only)",
  LEADERBOARD_SUBMITTED: "arcade_results (activity leaderboard)",
  notEvidence: true, notTruth: true, notBilling: true,
} as const);

export interface ArcadeIntegrationRuntimeRef {
  runtimeKind: ArcadeRuntimeKind;
  runtimeId: string;
  experienceId: string | null;
  arcadeActivityId: string | null;
  productType: ArcadeProductType;
  status: string;
}
