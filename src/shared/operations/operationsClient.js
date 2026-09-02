const API_BASE = "/api";

function authHeaders(role) {
  const configuredUserId = import.meta.env?.VITE_DEV_USER_ID;
  const userId = configuredUserId || (role === "admin" || role === "instructor" ? "user_instructor_001" : "user_student_001");
  return role ? { Authorization: `Bearer dev-token:${userId}` } : {};
}

export async function fetchOperationalOverview({ fetchImpl = globalThis.fetch, cohortId, limit = 25, role } = {}) {
  if (typeof fetchImpl !== "function") throw new Error("Operational workspace unavailable");
  const params = new URLSearchParams({ limit: String(limit) });
  if (cohortId) params.set("cohortId", cohortId);
  const response = await fetchImpl(`${API_BASE}/operations/overview?${params}`, { credentials: "include", cache: "no-store", headers: authHeaders(role) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || payload?.error || `Operational workspace unavailable (${response.status})`);
  return payload?.data || payload;
}

async function fetchOperationalDetail(path, { fetchImpl = globalThis.fetch, role } = {}) {
  const response = await fetchImpl(`${API_BASE}${path}`, { credentials: "include", cache: "no-store", headers: authHeaders(role) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || payload?.error || `Operational detail unavailable (${response.status})`);
  return payload?.data || payload;
}

export const fetchLearnerOperationalDetail = (learnerId, options = {}) => fetchOperationalDetail(`/operations/learners/${encodeURIComponent(learnerId)}`, options);
export const fetchAssignmentOperationalDetail = (assignmentId, options = {}) => fetchOperationalDetail(`/operations/assignments/${encodeURIComponent(assignmentId)}`, options);
export const fetchCourseOperationalDetail = (courseId, options = {}) => fetchOperationalDetail(`/operations/courses/${encodeURIComponent(courseId)}`, options);
