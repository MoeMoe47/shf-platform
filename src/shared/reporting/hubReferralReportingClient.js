const DEFAULT_API_BASE = "/api";
const REPORT_ID = "report.hub.referral.created_count.v1";
const METRIC_ID = "hub.referral.created_count.v1";

export async function fetchHubReferralCreatedCountReport({
  fetchImpl = globalThis.fetch,
  apiBase = DEFAULT_API_BASE,
} = {}) {
  if (typeof fetchImpl !== "function") throw new Error("Reporting Service unavailable");

  const response = await fetchImpl(`${apiBase}/shf/reports/hub.referral-created-count`, {
    credentials: "include",
    cache: "no-store",
  });
  const data = await parseResponse(response);
  if (!response.ok) throw new Error(safeErrorMessage(data, response.status));

  const report = data?.report;
  const metric = report?.metric_results?.[0];
  if (
    !report ||
    report.report_id !== REPORT_ID ||
    report.report_definition_id !== "hub.referral.created_count" ||
    report.report_definition_version !== 1 ||
    !metric ||
    metric.metric_id !== METRIC_ID ||
    !Number.isFinite(metric.value)
  ) {
    throw new Error("Canonical Hub referral report unavailable");
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
