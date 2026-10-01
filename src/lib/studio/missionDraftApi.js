import { API_BASE } from "@/lib/apiClient.js";

export class MissionDraftApiError extends Error {
  constructor(message, { status, code, correlationId, details } = {}) {
    super(message);
    this.name = "MissionDraftApiError";
    this.status = status || 0;
    this.code = code || "MISSION_DRAFT_REQUEST_FAILED";
    this.correlationId = correlationId || null;
    this.details = details || {};
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    cache: "no-store",
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const envelope = await response.json().catch(() => ({}));
  if (!response.ok || envelope.ok === false) {
    throw new MissionDraftApiError(envelope.error?.message || "Mission draft request failed.", {
      status: response.status,
      code: envelope.error?.code,
      correlationId: envelope.correlation_id,
      details: envelope.error || {},
    });
  }
  return envelope.data;
}

export function listMissionDrafts() {
  return request("/studio/missions/drafts").then((data) => data.items || []);
}

export function getMissionDraft(draftId) {
  return request(`/studio/missions/drafts/${encodeURIComponent(draftId)}`);
}

export function createMissionDraft(definition) {
  return request("/studio/missions/drafts", { method: "POST", body: JSON.stringify({ definition }) });
}

export function updateMissionDraft(draftId, expectedRevision, definition) {
  return request(`/studio/missions/drafts/${encodeURIComponent(draftId)}`, {
    method: "PUT",
    body: JSON.stringify({ expectedRevision, definition }),
  });
}
