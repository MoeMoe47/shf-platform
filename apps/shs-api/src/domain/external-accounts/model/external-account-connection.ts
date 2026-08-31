// SHF Ecosystem Phase 12.1 — External Account Security foundation.
export const EXTERNAL_ACCOUNT_PROVIDERS = ["google", "microsoft"] as const;
export type ExternalAccountProvider = typeof EXTERNAL_ACCOUNT_PROVIDERS[number];

export const EXTERNAL_ACCOUNT_CONNECTION_STATUSES = ["ACTIVE", "REAUTH_REQUIRED", "REVOKED"] as const;
export type ExternalAccountConnectionStatus = typeof EXTERNAL_ACCOUNT_CONNECTION_STATUSES[number];

export function isExternalAccountProvider(value: unknown): value is ExternalAccountProvider {
  return typeof value === "string" && (EXTERNAL_ACCOUNT_PROVIDERS as readonly string[]).includes(value);
}

export interface ExternalAccountConnectionActor {
  organization_id: string;
  user_id: string;
}

// Full row shape, including encrypted-envelope columns. Never serialized
// to an HTTP response directly — see toSafeConnectionDto() in the service,
// which is the only allowed path from this type to a frontend-visible
// value.
export interface ExternalAccountConnectionRow {
  id: string;
  organizationId: string;
  userId: string;
  provider: ExternalAccountProvider;
  providerAccountId: string | null;
  status: ExternalAccountConnectionStatus;
  scopes: string[];
  accessTokenCiphertext: string | null;
  accessTokenIv: string | null;
  accessTokenAuthTag: string | null;
  refreshTokenCiphertext: string | null;
  refreshTokenIv: string | null;
  refreshTokenAuthTag: string | null;
  tokenKeyVersion: string | null;
  accessTokenExpiresAt: string | null;
  connectedAt: string;
  lastRefreshedAt: string | null;
  reauthRequiredAt: string | null;
  revokedAt: string | null;
}

// The only shape ever returned to a frontend caller — no ciphertext, IV,
// auth tag, key version, or raw provider account metadata (phase brief
// §19: "safe connection DTO").
export interface SafeExternalAccountConnectionDto {
  id: string;
  provider: ExternalAccountProvider;
  status: ExternalAccountConnectionStatus;
  connectedAt: string;
  reauthRequired: boolean;
}
