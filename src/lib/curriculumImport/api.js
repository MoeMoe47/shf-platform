// Phase 4.5C: the admin import UI talks only to the canonical import-job API.
// Candidate identity, diff status, validation, and execution remain server-owned.
const API_BASE = String(import.meta.env.VITE_API_BASE || "http://127.0.0.1:8091").replace(/\/+$/, "");

function devUserId() {
  const user = typeof window !== "undefined" ? (window.__USER__ || window.__AUTH__?.user) : null;
  if (user?.id || user?.user_id) return user.id || user.user_id;
  const queryAdmin = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("admin");
  const role = String(user?.role || (typeof window !== "undefined" ? window.__user?.role : "") || (queryAdmin ? "admin" : "student")).toLowerCase();
  return role === "admin" || role === "org_admin" ? "user_admin_001" : "user_student_001";
}

function authHeaders() {
  const headers = { Accept: "application/json", "Content-Type": "application/json" };
  // Local development uses the repository's existing dev-token bridge. The
  // production session path remains cookie-backed and never receives a
  // browser-selected identity header.
  if (import.meta.env.DEV) headers.Authorization = `Bearer dev-token:${devUserId()}`;
  return headers;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.ok === false) {
    const error = new Error(body?.error?.message || `Import request failed (${response.status})`);
    error.status = response.status;
    error.code = body?.error?.code || "REQUEST_FAILED";
    throw error;
  }
  return body?.data ?? body;
}

export function listImportSources() {
  return request("/curriculum/import-jobs/sources");
}

export function listImportJobs() {
  return request("/curriculum/import-jobs");
}

export function createImportJob(sourceKey) {
  return request("/curriculum/import-jobs", {
    method: "POST",
    body: JSON.stringify({ importType: "STATIC_JSON", sourceKey }),
  });
}

export function getImportPreview(jobId) {
  return request(`/curriculum/import-jobs/${encodeURIComponent(jobId)}/preview`);
}

export function executeImportJob(jobId) {
  return request(`/curriculum/import-jobs/${encodeURIComponent(jobId)}/execute`, { method: "POST" });
}

export function updateImportCandidate(jobId, candidateId, fields) {
  return request(`/curriculum/import-jobs/${encodeURIComponent(jobId)}/candidates/${encodeURIComponent(candidateId)}`, {
    method: "PATCH",
    body: JSON.stringify(fields),
  });
}

// ---------------- Phase 4.6: raw document pipeline ----------------

export function listSourceAssets() {
  return request("/curriculum/source-assets");
}

export function listSourceVersions(sourceAssetId) {
  return request(`/curriculum/source-assets/${encodeURIComponent(sourceAssetId)}/versions`);
}

// Uses its own fetch, not the shared JSON request() helper — a
// multipart body must set its own Content-Type (with boundary), which a
// forced "application/json" header would break.
export async function uploadSourceDocument(file) {
  const form = new FormData();
  form.append("file", file, file.name);
  const headers = {};
  if (import.meta.env.DEV) headers.Authorization = `Bearer dev-token:${devUserId()}`;
  const response = await fetch(`${API_BASE}/curriculum/source-assets`, { method: "POST", credentials: "include", headers, body: form });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.ok === false) {
    const error = new Error(body?.error?.message || `Upload failed (${response.status})`);
    error.status = response.status;
    error.code = body?.error?.code || "REQUEST_FAILED";
    throw error;
  }
  return body?.data ?? body;
}

export function processSourceDocument(sourceDocumentVersionId) {
  return request(`/curriculum/source-documents/${encodeURIComponent(sourceDocumentVersionId)}/process`, { method: "POST" });
}

export function getExtractionPreview(sourceDocumentVersionId) {
  return request(`/curriculum/source-documents/${encodeURIComponent(sourceDocumentVersionId)}/extraction`);
}

export function createRawDocumentImportJob(sourceDocumentVersionId, documentKey) {
  return request("/curriculum/import-jobs", {
    method: "POST",
    body: JSON.stringify({ importType: "RAW_DOCUMENT", sourceDocumentVersionId, documentKey: documentKey || undefined }),
  });
}

export default {
  listImportSources, listImportJobs, createImportJob, getImportPreview, executeImportJob, updateImportCandidate,
  listSourceAssets, listSourceVersions, uploadSourceDocument, processSourceDocument, getExtractionPreview, createRawDocumentImportJob,
};
