const PUBLIC_CURRICULUM_PATH = "/public/impact/curriculum-lesson-completions";

function apiBase() {
  return String(
    window.__SHS_API_BASE__ ||
    import.meta.env.VITE_SHS_API_BASE ||
    "http://127.0.0.1:8091",
  ).replace(/\/+$/, "");
}

function safeProjection(item) {
  if (!item || item.report_id !== "report.curriculum.lesson_completion_count.v1" || Number(item.report_version) !== 1) return null;
  if (item.metric_label !== "Verified Lesson Completions") return null;
  if (item.public_representation_type === "SUPPRESSED_LT_10" && item.public_display_value !== "<10") return null;
  if (item.public_representation_type === "EXACT_COUNT" && !/^\d+$/.test(String(item.public_display_value))) return null;
  if (!["EXACT_COUNT", "SUPPRESSED_LT_10"].includes(item.public_representation_type)) return null;
  if (!item.reporting_period_label || !item.data_as_of) return null;
  return {
    label: item.metric_label,
    displayValue: String(item.public_display_value),
    reportingPeriodLabel: item.reporting_period_label,
    dataAsOf: item.data_as_of,
    representationType: item.public_representation_type,
  };
}

export async function fetchPublicCurriculumLessonCompletions(fetchImpl = fetch) {
  const response = await fetchImpl(`${apiBase()}${PUBLIC_CURRICULUM_PATH}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "omit",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Public curriculum reporting is unavailable");
  const payload = await response.json();
  const items = Array.isArray(payload?.data?.items) ? payload.data.items : [];
  return safeProjection(items[0]);
}

export { PUBLIC_CURRICULUM_PATH };
