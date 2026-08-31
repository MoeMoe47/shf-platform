// SHF Ecosystem Phase 12.2 — provider-neutral external calendar contract.
//
// Mirrors the exact shape of the existing, already-audited
// LiveLearningProvider contract (src/domain/live-learning/providers/
// live-learning-provider.ts): one interface, one adapter per real
// provider, a ProviderNotConfiguredError instead of any insecure
// fallback, and a healthCheck() that never attempts a real network call
// without real credentials present.
export type ExternalCalendarProviderHealth = "available" | "not_configured" | "degraded";

export class ProviderNotConfiguredError extends Error {
  constructor(public provider: string) {
    super(`External calendar provider "${provider}" is not configured.`);
    this.name = "ProviderNotConfiguredError";
  }
}

export interface AuthorizationUrlInput {
  state: string;
  codeChallenge: string;
  redirectUri: string;
}

export interface ExchangeCodeInput {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}

export interface ProviderTokenResult {
  accessToken: string | null;
  accessTokenExpiresAt: string | null;
  // Google/Microsoft do not always return a fresh refresh token on every
  // exchange/refresh call — see docs/SHF_EXTERNAL_CALENDAR_INTEGRATION.md
  // §"refresh-token rotation". null here means "provider did not issue a
  // new one," which the caller must never treat as "erase the existing
  // one" (phase brief §11).
  refreshToken: string | null;
  scope: string[];
}

export interface ProviderAccountIdentity {
  providerAccountId: string;
  email: string | null;
}

export interface FreeBusyInterval {
  startsAt: string;
  endsAt: string;
}

export interface MirroredEventInput {
  providerEventId: string | null; // null = create, non-null = update
  title: string;
  startsAt: string;
  endsAt: string | null;
  allDay: boolean;
  // Opaque, safe-only marker written back as provider extended
  // properties/metadata — never a description, location, or anything
  // beyond this app's own stable identity (phase brief §19).
  shfProjectionId: string;
}

export interface MirroredEventResult {
  providerEventId: string;
}

export interface ExternalCalendarProvider {
  readonly name: "google" | "microsoft";
  getAuthorizationUrl(input: AuthorizationUrlInput): string;
  exchangeAuthorizationCode(input: ExchangeCodeInput): Promise<ProviderTokenResult & ProviderAccountIdentity>;
  refreshAccessToken(refreshToken: string): Promise<ProviderTokenResult>;
  getFreeBusy(accessToken: string, range: { from: string; to: string }): Promise<FreeBusyInterval[]>;
  upsertMirroredEvent(accessToken: string, event: MirroredEventInput): Promise<MirroredEventResult>;
  deleteMirroredEvent(accessToken: string, providerEventId: string): Promise<void>;
  revokeConnection(refreshToken: string): Promise<void>;
  healthCheck(): Promise<ExternalCalendarProviderHealth>;
}
