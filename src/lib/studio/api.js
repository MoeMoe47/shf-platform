// Canonical client for the Phase 2 Studio Project API.
// Components use this boundary so authentication and response-envelope
// handling remain consistent with the other curriculum clients.
import { resolveDevUserId } from "@/lib/liveLearning/api.js";

const STUDIO_API_BASE = import.meta.env?.VITE_SHS_API_BASE || import.meta.env?.VITE_LIVE_LEARNING_API_BASE || "http://127.0.0.1:8091";

function authHeaders(role) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer dev-token:${resolveDevUserId(role)}`,
  };
}

async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok === false) {
    const error = new Error(payload?.error?.message || "Studio is unavailable right now.");
    error.code = payload?.error?.code || "STUDIO_REQUEST_FAILED";
    error.status = response.status;
    throw error;
  }
  return payload?.data ?? payload;
}

export async function listStudioProjects(role = "student") {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/studio/projects`, {
    credentials: "include",
    cache: "no-store",
    headers: authHeaders(role),
  }));
}

export async function getStudioProject(role = "student", projectId) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/studio/projects/${encodeURIComponent(projectId)}`, {
    credentials: "include",
    cache: "no-store",
    headers: authHeaders(role),
  }));
}

export async function getStudioProjectResources(role = "student", projectId) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/studio/projects/${encodeURIComponent(projectId)}/resources`, {
    credentials: "include",
    cache: "no-store",
    headers: authHeaders(role),
  }));
}

export async function getStudioBuildPacket(role = "student", projectId) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/studio/projects/${encodeURIComponent(projectId)}/build-packet`, {
    credentials: "include",
    cache: "no-store",
    headers: authHeaders(role),
  }));
}

export async function getStudioWorkspace(role = "student", projectId) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/studio/projects/${encodeURIComponent(projectId)}/workspace`, {
    credentials: "include",
    cache: "no-store",
    headers: authHeaders(role),
  }));
}

export async function updateStudioWorkspace(role = "student", projectId, { revision, work }) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/studio/projects/${encodeURIComponent(projectId)}/workspace`, {
    method: "PATCH",
    credentials: "include",
    headers: authHeaders(role),
    body: JSON.stringify({ revision, work }),
  }));
}

export async function getCurrentStudioQa(role = "student", projectId) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/studio/projects/${encodeURIComponent(projectId)}/qa/current`, {
    credentials: "include", cache: "no-store", headers: authHeaders(role),
  }));
}

export async function runStudioQa(role = "student", projectId) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/studio/projects/${encodeURIComponent(projectId)}/qa`, {
    method: "POST", credentials: "include", headers: authHeaders(role), body: JSON.stringify({}),
  }));
}

export async function getCurrentStudioReview(role = "student", projectId) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/studio/projects/${encodeURIComponent(projectId)}/review/current`, {
    credentials: "include", cache: "no-store", headers: authHeaders(role),
  }));
}

export async function submitStudioReview(role = "student", projectId) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/studio/projects/${encodeURIComponent(projectId)}/review-submissions`, {
    method: "POST", credentials: "include", headers: authHeaders(role), body: JSON.stringify({}),
  }));
}

export async function getStudioReviewSubmission(role = "instructor", projectId, submissionId) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/studio/projects/${encodeURIComponent(projectId)}/review-submissions/${encodeURIComponent(submissionId)}`, {
    credentials: "include", cache: "no-store", headers: authHeaders(role),
  }));
}

export async function decideStudioReview(role = "instructor", projectId, submissionId, { decision, feedback }) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/studio/projects/${encodeURIComponent(projectId)}/review-submissions/${encodeURIComponent(submissionId)}/decision`, {
    method: "POST", credentials: "include", headers: authHeaders(role), body: JSON.stringify({ decision, feedback }),
  }));
}

export async function getCurrentStudioDelivery(role = "student", projectId) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/studio/projects/${encodeURIComponent(projectId)}/delivery/current`, { credentials: "include", cache: "no-store", headers: authHeaders(role) }));
}

export async function finalizeStudioProject(role = "student", projectId) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/studio/projects/${encodeURIComponent(projectId)}/finalize`, { method: "POST", credentials: "include", headers: authHeaders(role), body: JSON.stringify({}) }));
}

export async function getStudioInstitutionalStatus(role = "student", projectId) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/studio/projects/${encodeURIComponent(projectId)}/institutional-status`, { credentials: "include", cache: "no-store", headers: authHeaders(role) }));
}

export async function getStudioAssignmentProgress(role = "instructor", assignmentId) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/studio/assignments/${encodeURIComponent(assignmentId)}/progress`, { credentials: "include", cache: "no-store", headers: authHeaders(role) }));
}

export async function projectStudioEvidence(role = "student", projectId) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/studio/projects/${encodeURIComponent(projectId)}/evidence`, { method: "POST", credentials: "include", headers: authHeaders(role), body: JSON.stringify({}) }));
}

export async function createStudentIdeaProject(role = "student", { projectType, title }) {
  // Organization, tenant, destination, origin, and lifecycle values are
  // intentionally absent. The authenticated API derives those values.
  return parseResponse(await fetch(`${STUDIO_API_BASE}/studio/projects`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders(role),
    body: JSON.stringify({ projectType, title }),
  }));
}

export async function startAssignmentStudioProject(role = "student", { assignmentId, projectType, title }) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/studio/handoffs/assignment`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders(role),
    body: JSON.stringify({ assignmentId, projectType, ...(title ? { title } : {}) }),
  }));
}

export default {
  listStudioProjects,
  getStudioProject,
  getStudioProjectResources,
  getStudioBuildPacket,
  getStudioWorkspace,
  updateStudioWorkspace,
  getCurrentStudioQa,
  runStudioQa,
  getCurrentStudioReview,
  submitStudioReview,
  getStudioReviewSubmission,
  decideStudioReview,
  getCurrentStudioDelivery,
  finalizeStudioProject,
  getStudioInstitutionalStatus,
  getStudioAssignmentProgress,
  projectStudioEvidence,
  createStudentIdeaProject,
  startAssignmentStudioProject,
};
