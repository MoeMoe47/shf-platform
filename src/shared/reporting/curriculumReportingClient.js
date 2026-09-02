const DEFAULT_API_BASE = "/api";

function requestOptions(role) {
  const configuredUserId = import.meta.env?.VITE_DEV_USER_ID;
  const userId = configuredUserId || (role === "admin" || role === "instructor" ? "user_instructor_001" : "user_student_001");
  return { credentials: "include", cache: "no-store", ...(role ? { headers: { Authorization: `Bearer dev-token:${userId}` } } : {}) };
}

export async function fetchCurriculumLessonCompletionReport({
  fetchImpl = globalThis.fetch,
  apiBase = DEFAULT_API_BASE,
  role,
} = {}) {
  if (typeof fetchImpl !== "function") throw new Error("Reporting Service unavailable");

  const response = await fetchImpl(`${apiBase}/shf/reports/curriculum.lesson-completion-count`, requestOptions(role));
  const data = await parseResponse(response);
  if (!response.ok) {
    throw new Error(safeErrorMessage(data, response.status));
  }

  const report = data?.report;
  const metric = report?.metric_results?.[0];
  if (!report || !metric || metric.metric_id !== "curriculum.lesson.completion_count.v1" || !Number.isFinite(metric.value)) {
    throw new Error("Canonical lesson completion report unavailable");
  }
  return report;
}

export async function fetchCurriculumLearningProgressReport({
  fetchImpl = globalThis.fetch,
  apiBase = DEFAULT_API_BASE,
  role,
} = {}) {
  if (typeof fetchImpl !== "function") throw new Error("Reporting Service unavailable");
  const response = await fetchImpl(`${apiBase}/shf/reports/curriculum.learning-progress`, requestOptions(role));
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(safeErrorMessage(data, response.status));
  const report = data?.report;
  if (!report || !Array.isArray(report.metric_results)) throw new Error("Canonical learning progress report unavailable");
  return report;
}

async function parseResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

function safeErrorMessage(data, status) {
  const detail = typeof data?.detail === "string" ? data.detail : "";
  return detail || `Reporting Service unavailable (${status})`;
}
