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

export function listMissionDraftSubmissions(draftId) {
  return request(`/studio/missions/drafts/${encodeURIComponent(draftId)}/submissions`).then((data) => data.items || []);
}

export function submitMissionDraft(draftId, expectedRevision, submissionNote = "") {
  return request(`/studio/missions/drafts/${encodeURIComponent(draftId)}/submit`, {
    method: "POST",
    body: JSON.stringify({ expectedRevision, submissionNote }),
  });
}

export function listMissionReviewSubmissions(status = "SUBMITTED") {
  return request(`/studio/missions/review/submissions?status=${encodeURIComponent(status)}`).then((data) => data.items || []);
}

export function getMissionReviewSubmission(submissionId) {
  return request(`/studio/missions/review/submissions/${encodeURIComponent(submissionId)}`);
}

export function decideMissionReviewSubmission(submissionId, decision, decisionNote = "") {
  return request(`/studio/missions/review/submissions/${encodeURIComponent(submissionId)}/${decision.toLowerCase()}`, {
    method: "POST", body: JSON.stringify({ decisionNote }),
  });
}

export function publishMissionSubmission(submissionId) {
  return request(`/studio/missions/review/submissions/${encodeURIComponent(submissionId)}/publish`, {
    method: "POST", body: JSON.stringify({}),
  });
}

export function listMissionReleases() {
  return request("/studio/missions/releases").then((data) => data.items || []);
}

export function listApprovedMissionsForPublication() {
  return request("/studio/missions/publication/approved").then((data) => data.items || []);
}

export function retireMissionRelease(releaseId, retirementNote) {
  return request(`/studio/missions/releases/${encodeURIComponent(releaseId)}/retire`, {
    method: "POST", body: JSON.stringify({ retirementNote }),
  });
}
