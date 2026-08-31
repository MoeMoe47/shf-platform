// SHF Ecosystem Phase 12.2 — MicrosoftCalendarProvider.
//
// Raw HTTP against the Microsoft identity platform (v2.0) + Microsoft
// Graph REST endpoints — no @azure/msal-node or @microsoft/microsoft-
// graph-client dependency (neither exists in this repository; same
// smallest-maintainable-implementation choice as GoogleCalendarProvider).
//
// As of this implementation, real Microsoft app registration credentials
// are NOT configured in this environment (no MICROSOFT_CLIENT_ID/SECRET
// set) — this adapter is real, complete code, but has not been exercised
// against the live Microsoft Graph API. See the Phase 12.2 report's Live
// Microsoft Verification section for the explicit, honest status.
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

// "common" supports both personal Microsoft accounts and work/school
// accounts without requiring SHF to register a tenant-specific app — the
// standard default for a general-purpose SaaS integration.
const AUTHORIZATION_ENDPOINT = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
const TOKEN_ENDPOINT = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const GRAPH_API_BASE = "https://graph.microsoft.com/v1.0";

// Least privilege (phase brief §5): Calendars.ReadWrite is the narrowest
// Graph scope that covers both this phase's needs (free/busy read via
// calendarView, and one-way event mirroring) — Microsoft Graph has no
// narrower "freebusy-only" scope the way Google does. openid/email/
// offline_access are the minimum identity + refresh-token scopes.
// Deliberately NOT requested: Mail.*, Contacts.*, Files.*, Team.*, or any
// organization directory scope.
export const MICROSOFT_SCOPES = [
  "openid",
  "email",
  "offline_access",
  "Calendars.ReadWrite",
] as const;

interface MicrosoftCredentials {
  clientId: string;
  clientSecret: string;
}

function readCredentials(): MicrosoftCredentials | null {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

// Same trust reasoning as GoogleCalendarProvider's decodeIdTokenPayload —
// this id_token comes directly from Microsoft's token endpoint over a
// server-to-server HTTPS call this app makes itself, never via the
// browser, so decoding without a separate JWKS check is the standard,
// correct trust model for the authorization-code flow.
function decodeIdTokenPayload(idToken: string): { oid?: string; sub?: string; email?: string; preferred_username?: string } {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("microsoft_id_token_malformed");
  const payload = Buffer.from(parts[1], "base64url").toString("utf8");
  return JSON.parse(payload);
}

export class MicrosoftCalendarProvider implements ExternalCalendarProvider {
  readonly name = "microsoft" as const;

  private requireCredentials(): MicrosoftCredentials {
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
      response_mode: "query",
      scope: MICROSOFT_SCOPES.join(" "),
      state: input.state,
      code_challenge: input.codeChallenge,
      code_challenge_method: "S256",
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
        scope: MICROSOFT_SCOPES.join(" "),
      }),
    });
    if (!res.ok) throw new Error(`Microsoft token exchange failed: ${res.status}`);
    const data: any = await res.json();
    const identity = data.id_token ? decodeIdTokenPayload(data.id_token) : {};
    const providerAccountId = identity.oid || identity.sub;
    if (!providerAccountId) throw new Error("microsoft_account_identity_missing");
    return {
      accessToken: data.access_token ?? null,
      accessTokenExpiresAt: data.expires_in ? new Date(Date.now() + Number(data.expires_in) * 1000).toISOString() : null,
      refreshToken: data.refresh_token ?? null,
      scope: typeof data.scope === "string" ? data.scope.split(" ") : [],
      providerAccountId,
      email: identity.email || identity.preferred_username || null,
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
        scope: MICROSOFT_SCOPES.join(" "),
      }),
    });
    if (!res.ok) throw new Error(`Microsoft token refresh failed: ${res.status}`);
    const data: any = await res.json();
    return {
      accessToken: data.access_token ?? null,
      accessTokenExpiresAt: data.expires_in ? new Date(Date.now() + Number(data.expires_in) * 1000).toISOString() : null,
      // Microsoft typically DOES re-issue a refresh_token on every
      // refresh (unlike Google), but never assume it — null here is
      // still handled as "preserve the existing one" by the caller
      // (phase brief §11), the same safe default either provider needs.
      refreshToken: data.refresh_token ?? null,
      scope: typeof data.scope === "string" ? data.scope.split(" ") : [],
    };
  }

  // Uses /me/calendarView with an explicit, minimal $select rather than
  // Graph's getSchedule action — getSchedule requires knowing the user's
  // own SMTP address up front (an extra /me identity call this
  // provider-neutral interface has no slot for), while calendarView with
  // $select=start,end,showAs,isCancelled returns exactly the fields free/
  // busy needs and nothing else — Microsoft never even serializes the
  // event's subject/body/location into this response, a stronger privacy
  // property than fetching full events and discarding fields client-side
  // (phase brief §26/§28).
  async getFreeBusy(accessToken: string, range: { from: string; to: string }): Promise<FreeBusyInterval[]> {
    const params = new URLSearchParams({
      startDateTime: range.from,
      endDateTime: range.to,
      $select: "start,end,showAs,isCancelled",
      $top: "250",
    });
    const res = await fetchWithTimeout(`${GRAPH_API_BASE}/me/calendarView?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}`, Prefer: 'outlook.timezone="UTC"' },
    });
    if (!res.ok) throw new Error(`Microsoft calendarView failed: ${res.status}`);
    const data: any = await res.json();
    const items: any[] = Array.isArray(data.value) ? data.value : [];
    return items
      .filter((e) => !e.isCancelled && e.showAs !== "free")
      .map((e) => ({ startsAt: e.start?.dateTime ? `${e.start.dateTime}Z` : e.start, endsAt: e.end?.dateTime ? `${e.end.dateTime}Z` : e.end }));
  }

  async upsertMirroredEvent(accessToken: string, event: MirroredEventInput): Promise<MirroredEventResult> {
    const body = {
      subject: event.title,
      isAllDay: event.allDay,
      start: { dateTime: event.startsAt, timeZone: "UTC" },
      end: { dateTime: event.endsAt || event.startsAt, timeZone: "UTC" },
      // Safe-only identity marker (phase brief §19) — Graph's single-value
      // extended properties are the Microsoft analogue of Google's
      // extendedProperties.private.
      singleValueExtendedProperties: [
        { id: "String {66f5a359-4659-4830-9070-00047ec6ac6e} Name shfProjectionId", value: event.shfProjectionId },
      ],
    };
    const path = event.providerEventId
      ? `${GRAPH_API_BASE}/me/events/${event.providerEventId}`
      : `${GRAPH_API_BASE}/me/events`;
    const res = await fetchWithTimeout(path, {
      method: event.providerEventId ? "PATCH" : "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Microsoft event upsert failed: ${res.status}`);
    const data: any = await res.json();
    return { providerEventId: data.id };
  }

  async deleteMirroredEvent(accessToken: string, providerEventId: string): Promise<void> {
    const res = await fetchWithTimeout(`${GRAPH_API_BASE}/me/events/${providerEventId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok && res.status !== 404) {
      throw new Error(`Microsoft event delete failed: ${res.status}`);
    }
  }

  // Microsoft Graph has no direct "revoke this refresh token" endpoint
  // equivalent to Google's /revoke — the standards-compliant equivalent
  // is /me/revokeSignInSessions, which revokes ALL of the user's sessions
  // platform-wide, not just this app's grant, so it is deliberately NOT
  // called here (it would be a scope-inappropriate side effect on the
  // user's whole Microsoft account). Local secret destruction (this
  // service's own revokeConnection in external-account-connection-
  // service.ts) is therefore the actual revocation boundary for
  // Microsoft, documented rather than silently absent.
  async revokeConnection(_refreshToken: string): Promise<void> {
    return;
  }

  async healthCheck(): Promise<ExternalCalendarProviderHealth> {
    return readCredentials() ? "available" : "not_configured";
  }
}
