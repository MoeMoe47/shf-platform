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

export async function listStudioTeams(role = "student") {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/studio/teams`, { credentials: "include", cache: "no-store", headers: authHeaders(role) }));
}

export async function getStudioTeam(role = "student", teamId) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/studio/teams/${encodeURIComponent(teamId)}`, { credentials: "include", cache: "no-store", headers: authHeaders(role) }));
}

export async function createStudioTeam(role = "instructor", name) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/studio/teams`, { method: "POST", credentials: "include", headers: authHeaders(role), body: JSON.stringify({ name }) }));
}

export async function addStudioTeamMember(role = "instructor", teamId, userId, memberRole = "MEMBER") {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/studio/teams/${encodeURIComponent(teamId)}/members`, { method: "POST", credentials: "include", headers: authHeaders(role), body: JSON.stringify({ userId, role: memberRole }) }));
}

export async function removeStudioTeamMember(role = "instructor", teamId, userId) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/studio/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}`, { method: "DELETE", credentials: "include", headers: authHeaders(role) }));
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

export async function getStudioLearningContext(role = "student", projectId) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/studio/projects/${encodeURIComponent(projectId)}/learning-context`, {
    credentials: "include", cache: "no-store", headers: authHeaders(role),
  }));
}

export async function getStudioWorkspace(role = "student", projectId) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/studio/projects/${encodeURIComponent(projectId)}/workspace`, {
    credentials: "include",
    cache: "no-store",
    headers: authHeaders(role),
  }));
}

export async function getStudioRevisions(role = "student", projectId) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/studio/projects/${encodeURIComponent(projectId)}/revisions`, {
    credentials: "include",
    cache: "no-store",
    headers: authHeaders(role),
  }));
}

export function openStudioCollaborationStream(role = "student", projectId, signal) {
  return fetch(`${STUDIO_API_BASE}/studio/projects/${encodeURIComponent(projectId)}/collaboration/stream`, {
    credentials: "include", cache: "no-store", signal, headers: authHeaders(role),
  });
}

export async function sendStudioCollaborationUpdate(role = "student", projectId, work) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/studio/projects/${encodeURIComponent(projectId)}/collaboration/updates`, {
    method: "POST", credentials: "include", headers: authHeaders(role), body: JSON.stringify({ work }),
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

export async function getStudioReviewerQueue(role = "instructor") {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/studio/reviews/queue`, {
    credentials: "include", cache: "no-store", headers: authHeaders(role),
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

export async function createWebsiteDeployment(role = "student", deliveryId) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/deployments/from-studio-delivery`, {
    method: "POST", credentials: "include", headers: authHeaders(role),
    body: JSON.stringify({ deliveryId }),
  }));
}

export async function getWebsiteDeployment(role = "student", deploymentId) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/deployments/${encodeURIComponent(deploymentId)}`, {
    credentials: "include", cache: "no-store", headers: authHeaders(role),
  }));
}

export async function listWebsiteDeployments(role = "student", projectId) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/studio/projects/${encodeURIComponent(projectId)}/deployments`, {
    credentials: "include", cache: "no-store", headers: authHeaders(role),
  }));
}

export async function retryWebsiteDeployment(role = "student", deploymentId) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/deployments/${encodeURIComponent(deploymentId)}/retry`, {
    method: "POST", credentials: "include", headers: authHeaders(role), body: JSON.stringify({}),
  }));
}

export async function createAgentPackage(role = "student", projectId) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/studio/projects/${encodeURIComponent(projectId)}/agent-packages`, { method: "POST", credentials: "include", headers: authHeaders(role), body: JSON.stringify({}) }));
}

export async function listAgentPackages(role = "student", projectId) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/studio/projects/${encodeURIComponent(projectId)}/agent-packages`, { credentials: "include", cache: "no-store", headers: authHeaders(role) }));
}

export async function createRegistrySubmission(role = "student", packageId) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/agent-packages/${encodeURIComponent(packageId)}/registry-submissions`, { method: "POST", credentials: "include", headers: authHeaders(role), body: JSON.stringify({}) }));
}

export async function listRegistrySubmissions(role = "student", packageId) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/agent-packages/${encodeURIComponent(packageId)}/registry-submissions`, { credentials: "include", cache: "no-store", headers: authHeaders(role) }));
}

export async function retryRegistrySubmission(role = "student", submissionId) {
  return parseResponse(await fetch(`${STUDIO_API_BASE}/registry-submissions/${encodeURIComponent(submissionId)}/retry`, {
    method: "POST", credentials: "include", headers: authHeaders(role), body: JSON.stringify({}),
  }));
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
  createWebsiteDeployment,
  getWebsiteDeployment,
  listWebsiteDeployments,
  retryWebsiteDeployment,
  createAgentPackage,
  listAgentPackages,
  createRegistrySubmission,
  listRegistrySubmissions,
  retryRegistrySubmission,
  projectStudioEvidence,
  createStudentIdeaProject,
  startAssignmentStudioProject,
};
