// Phase 2A Secure Live Learning — ZoomLiveLearningProvider.
//
// Uses Zoom's Server-to-Server OAuth app type (account_credentials grant),
// NOT the deprecated JWT app authentication. Credentials
// (ZOOM_ACCOUNT_ID/ZOOM_CLIENT_ID/ZOOM_CLIENT_SECRET) are read from
// process.env only — this file runs on the backend and is never bundled
// into the frontend. If any credential is missing, every method throws
// ProviderNotConfiguredError instead of attempting a network call; there
// is no insecure fallback path.
//
// As of this implementation, real Zoom credentials are NOT configured in
// this environment (confirmed: no ZOOM_* vars set) — this adapter is
// real, complete code, but has not been exercised against the live Zoom
// API. See the Phase 2A report §G for the explicit, honest status.
import type {
  LiveLearningProvider,
  ProviderCreateInput,
  ProviderUpdateInput,
  ProviderSession,
  JoinAuthorization,
  ProviderHealth,
} from "./live-learning-provider";
import { ProviderNotConfiguredError } from "./live-learning-provider";

const ZOOM_OAUTH_URL = "https://zoom.us/oauth/token";
const ZOOM_API_BASE = "https://api.zoom.us/v2";

interface ZoomCredentials {
  accountId: string;
  clientId: string;
  clientSecret: string;
}

function readCredentials(): ZoomCredentials | null {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  if (!accountId || !clientId || !clientSecret) return null;
  return { accountId, clientId, clientSecret };
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(creds: ZoomCredentials): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }
  const basic = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString("base64");
  const res = await fetch(
    `${ZOOM_OAUTH_URL}?grant_type=account_credentials&account_id=${encodeURIComponent(creds.accountId)}`,
    {
      method: "POST",
      headers: { Authorization: `Basic ${basic}` },
    }
  );
  if (!res.ok) {
    throw new Error(`Zoom OAuth token request failed: ${res.status}`);
  }
  const data: any = await res.json();
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (Number(data.expires_in) || 3600) * 1000,
  };
  return cachedToken.value;
}

async function zoomFetch(creds: ZoomCredentials, path: string, init: RequestInit = {}) {
  const token = await getAccessToken(creds);
  const res = await fetch(`${ZOOM_API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Zoom API ${path} failed: ${res.status} ${body}`.trim());
  }
  if (res.status === 204) return null;
  return res.json();
}

export class ZoomLiveLearningProvider implements LiveLearningProvider {
  readonly name = "zoom";

  private requireCredentials(): ZoomCredentials {
    const creds = readCredentials();
    if (!creds) throw new ProviderNotConfiguredError(this.name);
    return creds;
  }

  async createSession(input: ProviderCreateInput): Promise<ProviderSession> {
    const creds = this.requireCredentials();
    const data: any = await zoomFetch(creds, "/users/me/meetings", {
      method: "POST",
      body: JSON.stringify({
        topic: input.title,
        type: 2, // scheduled meeting
        start_time: input.startsAt,
        duration: input.durationMinutes,
        settings: {
          join_before_host: false,
          waiting_room: true,
          approval_type: 1, // manually approve — SHF authorization is the source of truth, not Zoom's own gate
        },
      }),
    });
    return {
      providerSessionId: String(data.id),
      // Deliberately safe: no join_url, no start_url, no host_email
      // stored here. A launch link is only ever produced per-user, on
      // demand, by issueJoinAccess() below (§13).
      metadata: { zoomMeetingNumber: data.id, createdAt: data.created_at },
    };
  }

  async updateSession(providerSessionId: string, patch: ProviderUpdateInput): Promise<ProviderSession> {
    const creds = this.requireCredentials();
    const body: Record<string, unknown> = {};
    if (patch.title) body.topic = patch.title;
    if (patch.startsAt) body.start_time = patch.startsAt;
    if (patch.durationMinutes) body.duration = patch.durationMinutes;
    await zoomFetch(creds, `/meetings/${providerSessionId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return { providerSessionId, metadata: {} };
  }

  async cancelSession(providerSessionId: string): Promise<void> {
    const creds = this.requireCredentials();
    await zoomFetch(creds, `/meetings/${providerSessionId}`, { method: "DELETE" });
  }

  async getSession(providerSessionId: string): Promise<ProviderSession | null> {
    const creds = this.requireCredentials();
    try {
      const data: any = await zoomFetch(creds, `/meetings/${providerSessionId}`);
      return { providerSessionId, metadata: { zoomMeetingNumber: data.id, status: data.status } };
    } catch {
      return null;
    }
  }

  async issueJoinAccess(providerSessionId: string, _userId: string): Promise<JoinAuthorization> {
    const creds = this.requireCredentials();
    const data: any = await zoomFetch(creds, `/meetings/${providerSessionId}`);
    if (!data?.join_url) {
      return { allowed: false, reason: "Zoom did not return a join URL." };
    }
    // Real join_url is only surfaced here, per-authorization — never
    // stored on the LiveSession row, never sent in a list/index response.
    return {
      allowed: true,
      launchUrl: data.join_url,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };
  }

  async getRecordingMetadata(providerSessionId: string): Promise<Record<string, unknown> | null> {
    const creds = this.requireCredentials();
    try {
      const data: any = await zoomFetch(creds, `/meetings/${providerSessionId}/recordings`);
      return {
        recordingCount: Array.isArray(data?.recording_files) ? data.recording_files.length : 0,
        totalSize: data?.total_size ?? null,
      };
    } catch {
      return null;
    }
  }

  async healthCheck(): Promise<ProviderHealth> {
    const creds = readCredentials();
    if (!creds) return "not_configured";
    try {
      await getAccessToken(creds);
      return "available";
    } catch {
      return "degraded";
    }
  }
}
