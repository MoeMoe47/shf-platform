// SHF Ecosystem Phase 12.2 — GoogleCalendarProvider.
//
// Raw HTTP against Google's OAuth 2.0 + Calendar v3 REST endpoints — no
// googleapis/google-auth-library dependency (none exists in this
// repository; phase brief §3 prefers the smallest maintainable
// implementation over a heavyweight SDK, matching zoom-provider.ts's own
// precedent exactly).
//
// As of this implementation, real Google OAuth client credentials are NOT
// configured in this environment (no GOOGLE_CLIENT_ID/SECRET set) — this
// adapter is real, complete code, but has not been exercised against the
// live Google API. See the Phase 12.2 report's Live Google Verification
// section for the explicit, honest status (mirrors zoom-provider.ts's own
// header comment and the Phase 2A precedent for this exact situation).
import type {
  ExternalCalendarProvider,
  ExternalCalendarProviderHealth,
  AuthorizationUrlInput,
  ExchangeCodeInput,
  ProviderTokenResult,
  ProviderAccountIdentity,
  FreeBusyInterval,
  MirroredEventInput,
  MirroredEventResult,
} from "./external-calendar-provider.js";
import { ProviderNotConfiguredError } from "./external-calendar-provider.js";
import { fetchWithTimeout } from "./provider-http.js";

const AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";

// Least privilege (phase brief §5): calendar.events (create/update/delete
// only the events this app itself creates, not full calendar management)
// + calendar.freebusy (Google's own narrow free/busy-only scope, added
// specifically so an app need not request full calendar read access just
// to check availability) + openid/email for minimal, stable account
// binding. Deliberately NOT requested: any Gmail, Drive, Contacts, or
// broad profile scope.
export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.freebusy",
] as const;

interface GoogleCredentials {
  clientId: string;
  clientSecret: string;
}

function readCredentials(): GoogleCredentials | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

// The id_token returned by Google's token endpoint arrives over a direct,
// authenticated server-to-server HTTPS call this app itself makes (the
// authorization-code flow, not the implicit flow) — it never passed
// through the browser, so it carries the same trust level as the access/
// refresh token issued alongside it. Decoding its payload without a
// separate JWKS signature check is the standard, correct trust model for
// this flow (verifying against Google's public keys would only matter if
// this token had been relayed through an untrusted channel, e.g. the
// browser redirect itself).
function decodeIdTokenPayload(idToken: string): { sub?: string; email?: string } {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("google_id_token_malformed");
  const payload = Buffer.from(parts[1], "base64url").toString("utf8");
  return JSON.parse(payload);
}

export class GoogleCalendarProvider implements ExternalCalendarProvider {
  readonly name = "google" as const;

  private requireCredentials(): GoogleCredentials {
    const creds = readCredentials();
    if (!creds) throw new ProviderNotConfiguredError(this.name);
    return creds;
  }

  getAuthorizationUrl(input: AuthorizationUrlInput): string {
    const creds = this.requireCredentials();
    const params = new URLSearchParams({
      client_id: creds.clientId,
      redirect_uri: input.redirectUri,
      response_type: "code",
      scope: GOOGLE_SCOPES.join(" "),
      state: input.state,
      code_challenge: input.codeChallenge,
      code_challenge_method: "S256",
      access_type: "offline", // required to receive a refresh_token
      prompt: "consent", // ensures a refresh_token is issued even on a repeat consent
      include_granted_scopes: "false", // never silently accumulate scopes from an unrelated prior grant
    });
    return `${AUTHORIZATION_ENDPOINT}?${params.toString()}`;
  }

  async exchangeAuthorizationCode(input: ExchangeCodeInput): Promise<ProviderTokenResult & ProviderAccountIdentity> {
    const creds = this.requireCredentials();
    const res = await fetchWithTimeout(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        code: input.code,
        code_verifier: input.codeVerifier,
        redirect_uri: input.redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!res.ok) throw new Error(`Google token exchange failed: ${res.status}`);
    const data: any = await res.json();
    const identity = data.id_token ? decodeIdTokenPayload(data.id_token) : {};
    if (!identity.sub) throw new Error("google_account_identity_missing");
    return {
      accessToken: data.access_token ?? null,
      accessTokenExpiresAt: data.expires_in ? new Date(Date.now() + Number(data.expires_in) * 1000).toISOString() : null,
      refreshToken: data.refresh_token ?? null,
      scope: typeof data.scope === "string" ? data.scope.split(" ") : [],
      providerAccountId: identity.sub,
      email: identity.email ?? null,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<ProviderTokenResult> {
    const creds = this.requireCredentials();
    const res = await fetchWithTimeout(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok) throw new Error(`Google token refresh failed: ${res.status}`);
    const data: any = await res.json();
    return {
      accessToken: data.access_token ?? null,
      accessTokenExpiresAt: data.expires_in ? new Date(Date.now() + Number(data.expires_in) * 1000).toISOString() : null,
      // Google does not reliably re-issue a refresh_token on a refresh
      // call — null here, never a fabricated/reused value; the caller
      // (external-account-connection-service) must preserve the existing
      // one when this is null (phase brief §11).
      refreshToken: data.refresh_token ?? null,
      scope: typeof data.scope === "string" ? data.scope.split(" ") : [],
    };
  }

  async getFreeBusy(accessToken: string, range: { from: string; to: string }): Promise<FreeBusyInterval[]> {
    const res = await fetchWithTimeout(`${CALENDAR_API_BASE}/freeBusy`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ timeMin: range.from, timeMax: range.to, items: [{ id: "primary" }] }),
    });
    if (!res.ok) throw new Error(`Google freeBusy failed: ${res.status}`);
    const data: any = await res.json();
    const busy: Array<{ start: string; end: string }> = data?.calendars?.primary?.busy || [];
    return busy.map((b) => ({ startsAt: b.start, endsAt: b.end }));
  }

  async upsertMirroredEvent(accessToken: string, event: MirroredEventInput): Promise<MirroredEventResult> {
    const body = {
      summary: event.title,
      start: event.allDay ? { date: event.startsAt.slice(0, 10) } : { dateTime: event.startsAt },
      end: event.allDay
        ? { date: (event.endsAt || event.startsAt).slice(0, 10) }
        : { dateTime: event.endsAt || event.startsAt },
      // Safe-only identity marker (phase brief §19) — no title/description
      // beyond the event's own real title, no internal tenant data.
      extendedProperties: { private: { shfProjectionId: event.shfProjectionId } },
    };
    const path = event.providerEventId
      ? `${CALENDAR_API_BASE}/calendars/primary/events/${event.providerEventId}`
      : `${CALENDAR_API_BASE}/calendars/primary/events`;
    const res = await fetchWithTimeout(path, {
      method: event.providerEventId ? "PUT" : "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Google event upsert failed: ${res.status}`);
    const data: any = await res.json();
    return { providerEventId: data.id };
  }

  async deleteMirroredEvent(accessToken: string, providerEventId: string): Promise<void> {
    const res = await fetchWithTimeout(`${CALENDAR_API_BASE}/calendars/primary/events/${providerEventId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    // 410 Gone means the event is already deleted on Google's side — a
    // successful outcome for a delete, not an error.
    if (!res.ok && res.status !== 410 && res.status !== 404) {
      throw new Error(`Google event delete failed: ${res.status}`);
    }
  }

  async revokeConnection(refreshToken: string): Promise<void> {
    // Checked first like every other method here — without this, a
    // connection created by a test or fixture (never through a real
    // Google OAuth flow) would cause this app to make a genuine network
    // call to Google's live revoke endpoint with a bogus token. Google's
    // revoke endpoint returns 200 for an already-invalid/unknown token
    // (RFC 7009 anti-scanning behavior), which silently masked this bug
    // in this phase's own test suite until caught.
    this.requireCredentials();
    const res = await fetchWithTimeout(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refreshToken)}`, { method: "POST" });
    if (!res.ok && res.status !== 400) {
      // Google returns 400 for an already-invalid token — treated as
      // success (nothing left to revoke). Any other failure is reported,
      // but per phase brief §39, local secret destruction still proceeds
      // regardless of this outcome — the caller does not depend on this
      // succeeding.
      throw new Error(`Google token revocation failed: ${res.status}`);
    }
  }

  async healthCheck(): Promise<ExternalCalendarProviderHealth> {
    return readCredentials() ? "available" : "not_configured";
  }
}
