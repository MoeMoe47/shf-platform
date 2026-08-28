const DEFAULT_API_BASE = "/api";

export async function fetchCurriculumLessonCompletionReport({
  fetchImpl = globalThis.fetch,
  apiBase = DEFAULT_API_BASE,
} = {}) {
  if (typeof fetchImpl !== "function") throw new Error("Reporting Service unavailable");

  const response = await fetchImpl(`${apiBase}/shf/reports/curriculum.lesson-completion-count`, {
    credentials: "include",
    cache: "no-store",
  });
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
