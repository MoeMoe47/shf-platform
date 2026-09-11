import { resolveDevUserId } from "@/lib/liveLearning/api.js";

const API_BASE = import.meta.env?.VITE_SHS_API_BASE || "http://127.0.0.1:8091";

function headers(role) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer dev-token:${resolveDevUserId(role)}`,
  };
}

async function parse(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.ok === false) {
    const error = new Error(body?.error?.message || `Curriculum activity request failed: ${res.status}`);
    error.code = body?.error?.code || "REQUEST_FAILED";
    error.status = res.status;
    throw error;
  }
  return body?.data ?? body;
}

async function request(path, role, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { ...headers(role), ...(options.headers || {}) } });
  return parse(res);
}

export function getLearnerActivityState(role, assignmentId, unitStableKey, lessonStableKey) {
  return request(`/activity-domains/assignments/${encodeURIComponent(assignmentId)}/lessons/${encodeURIComponent(unitStableKey)}/${encodeURIComponent(lessonStableKey)}`, role);
}

export function submitPractice(role, input) {
  return request("/activity-domains/practices/submissions", role, { method: "POST", body: JSON.stringify(input) });
}

export function submitAssessment(role, input) {
  return request("/activity-domains/assessments/submissions", role, { method: "POST", body: JSON.stringify(input) });
}

export function submitReflection(role, input) {
  return request("/activity-domains/reflections/submissions", role, { method: "POST", body: JSON.stringify(input) });
}

export function checkAssignmentCompletion(role, assignmentId, unitStableKey, lessonStableKey) {
  return request(`/assignments/${encodeURIComponent(assignmentId)}/check-completion`, role, {
    method: "POST",
    body: JSON.stringify({ unitStableKey, lessonStableKey }),
  });
}

export default { getLearnerActivityState, submitPractice, submitAssessment, submitReflection, checkAssignmentCompletion };
