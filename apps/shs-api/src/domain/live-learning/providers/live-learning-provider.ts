// Phase 2A Secure Live Learning — provider contract.
//
// Dependency direction is Curriculum -> Live Learning Service -> Provider
// Adapter -> Zoom (or another provider). No curriculum/frontend code may
// call a provider (Zoom or otherwise) directly — everything goes through
// this interface via the service layer (../service/live-learning-service).

export type ProviderHealth =
  | "configured"
  | "not_configured"
  | "available"
  | "degraded"
  | "unavailable";

export interface ProviderCreateInput {
  title: string;
  startsAt: string; // ISO 8601 UTC
  durationMinutes: number;
  hostId: string;
}

export interface ProviderUpdateInput {
  title?: string;
  startsAt?: string;
  durationMinutes?: number;
}

export interface ProviderSession {
  providerSessionId: string;
  /** Safe-to-store metadata only — never a raw long-lived join URL or a
   * secret. See §13/§28: join URLs are issued per-authorization, not
   * stored as static curriculum/session data. */
  metadata: Record<string, unknown>;
}

export interface JoinAuthorization {
  allowed: boolean;
  /** Only present when allowed === true, and only ever returned from
   * issueJoinAccess() — never persisted as a reusable static field. */
  launchUrl?: string;
  expiresAt?: string;
  reason?: string;
}

export class ProviderNotConfiguredError extends Error {
  constructor(provider: string) {
    super(`Live learning provider "${provider}" is not configured.`);
    this.name = "ProviderNotConfiguredError";
  }
}

export interface LiveLearningProvider {
  readonly name: string;
  createSession(input: ProviderCreateInput): Promise<ProviderSession>;
  updateSession(providerSessionId: string, patch: ProviderUpdateInput): Promise<ProviderSession>;
  cancelSession(providerSessionId: string): Promise<void>;
  getSession(providerSessionId: string): Promise<ProviderSession | null>;
  /** Returns a short-lived, per-user launch authorization. Never a static
   * meeting URL usable by anyone who obtains it later. */
  issueJoinAccess(providerSessionId: string, userId: string): Promise<JoinAuthorization>;
  /** Metadata only (duration, size, availability) — never the recording
   * file/stream itself. Full recording pipeline is out of Phase 2A scope
   * (see the Phase 2A report, "Remaining Phase 2 Work"). */
  getRecordingMetadata(providerSessionId: string): Promise<Record<string, unknown> | null>;
  healthCheck(): Promise<ProviderHealth>;
}
