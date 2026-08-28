const DEFAULT_API_BASE = "/api";
const REPORT_ID = "report.exchange.funding.commitment_count.v1";
const REPORT_DEFINITION_ID = "exchange.funding.commitment_count";
const METRIC_ID = "exchange.funding.commitment_count.v1";

export async function fetchExchangeFundingCommitmentCountReport({
  fetchImpl = globalThis.fetch,
  apiBase = DEFAULT_API_BASE,
} = {}) {
  if (typeof fetchImpl !== "function") throw new Error("Reporting Service unavailable");

  const response = await fetchImpl(`${apiBase}/shf/reports/exchange.funding-commitment-count`, {
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
    report.report_definition_id !== REPORT_DEFINITION_ID ||
    report.report_definition_version !== 1 ||
    !metric ||
    metric.metric_id !== METRIC_ID ||
    !Number.isFinite(metric.value)
  ) {
    throw new Error("Canonical Exchange funding commitment report unavailable");
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
