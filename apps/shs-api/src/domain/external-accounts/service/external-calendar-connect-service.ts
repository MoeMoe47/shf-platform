// SHF Ecosystem Phase 12.2 — real OAuth connect orchestration, built
// entirely on the Phase 12.1 state/PKCE/cipher foundation. This file
// contains zero provider-specific HTTP logic itself — that lives in each
// adapter (google-calendar-provider.ts / microsoft-calendar-provider.ts);
// this is the provider-neutral start/callback sequencing the phase brief
// §6 asked to finally build now that two real providers exist.
import { createAuthorizationState, consumeAuthorizationState } from "./oauth-state-service.js";
import { createOrReplaceConnection } from "./external-account-connection-service.js";
import { getExternalCalendarProvider } from "../providers/provider-registry.js";
import { ProviderNotConfiguredError } from "../providers/external-calendar-provider.js";
import type { ExternalCalendarProvider } from "../providers/external-calendar-provider.js";
import type { ExternalAccountConnectionActor, ExternalAccountProvider } from "../model/external-account-connection.js";

function redirectUriFor(provider: ExternalAccountProvider): string {
  const base = String(process.env.SHF_EXTERNAL_CALENDAR_REDIRECT_BASE_URL || "http://localhost:8091").replace(/\/$/, "");
  return `${base}/external-accounts/${provider}/oauth/callback`;
}

export interface StartConnectResult {
  authorizationUrl: string;
}

// Checks provider configuration BEFORE creating a state row — never leave
// an orphaned, unusable state record behind for a provider that could
// never complete the flow.
export async function startExternalCalendarConnect(
  actor: ExternalAccountConnectionActor,
  provider: ExternalAccountProvider,
  returnPath: string,
  providerOverride?: ExternalCalendarProvider,
): Promise<StartConnectResult> {
  const adapter = providerOverride || getExternalCalendarProvider(provider);
  const health = await adapter.healthCheck();
  if (health === "not_configured") throw new ProviderNotConfiguredError(provider);

  const { state, codeChallenge } = await createAuthorizationState({ actor, provider, returnPath });
  const authorizationUrl = adapter.getAuthorizationUrl({ state, codeChallenge, redirectUri: redirectUriFor(provider) });
  return { authorizationUrl };
}

export class CallbackVerificationError extends Error {
  constructor() {
    super("external_calendar_callback_verification_failed");
    this.name = "CallbackVerificationError";
  }
}

export interface CompleteConnectResult {
  returnPath: string;
}

// Never trusts userId/organizationId/providerAccountId from the callback
// query string (phase brief §9) — the only caller-supplied values used
// here are `code` and `state`; the actor comes from the current
// authenticated request, and consumeAuthorizationState() independently
// verifies that actor matches who the state was originally issued to.
export async function completeExternalCalendarConnect(
  actor: ExternalAccountConnectionActor,
  provider: ExternalAccountProvider,
  input: { code: string; state: string },
  providerOverride?: ExternalCalendarProvider,
): Promise<CompleteConnectResult> {
  const consumed = await consumeAuthorizationState({ actor, provider, rawState: input.state });
  if (!consumed) throw new CallbackVerificationError();

  const adapter = providerOverride || getExternalCalendarProvider(provider);
  const exchanged = await adapter.exchangeAuthorizationCode({
    code: input.code,
    codeVerifier: consumed.codeVerifier,
    redirectUri: redirectUriFor(provider),
  });

  if (!exchanged.refreshToken) {
    // A first-time connect must always yield a refresh token (Google:
    // access_type=offline + prompt=consent; Microsoft: offline_access
    // scope) — if the provider omitted one, this is not a usable
    // connection; fail loudly rather than persist a token-less row.
    throw new Error("external_calendar_provider_did_not_return_refresh_token");
  }

  await createOrReplaceConnection(actor, provider, {
    providerAccountId: exchanged.providerAccountId,
    scopes: exchanged.scope,
    accessToken: exchanged.accessToken,
    accessTokenExpiresAt: exchanged.accessTokenExpiresAt,
    refreshToken: exchanged.refreshToken,
  });

  return { returnPath: consumed.returnPath };
}
