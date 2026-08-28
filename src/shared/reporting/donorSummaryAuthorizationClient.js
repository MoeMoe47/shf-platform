const DEFAULT_API_BASE = "/api";

async function readJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

function errorMessage(data, fallback) {
  return data?.error?.message || data?.detail || fallback;
}

async function request(path, options = {}, apiBase = DEFAULT_API_BASE, fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== "function") throw new Error("Donor Summary authority unavailable");
  const response = await fetchImpl(`${apiBase}${path}`, {
    credentials: "include",
    cache: "no-store",
    ...options,
  });
  const data = await readJson(response);
  if (!response.ok) throw new Error(errorMessage(data, "Donor Summary authority unavailable"));
  return data?.data;
}

export function createDonorSummaryArtifact(idempotencyKey, { apiBase = DEFAULT_API_BASE, fetchImpl = globalThis.fetch } = {}) {
  return request("/reporting/compositions/donor-summary/artifacts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idempotency_key: idempotencyKey }),
  }, apiBase, fetchImpl);
}

export async function listAuthorizedReportRecipients({ apiBase = DEFAULT_API_BASE, fetchImpl = globalThis.fetch } = {}) {
  const data = await request("/reporting/distribution-recipients", {}, apiBase, fetchImpl);
  return Array.isArray(data?.items) ? data.items.filter((item) => item?.status === "AUTHORIZED") : [];
}

export async function listApprovedDonorDisclosures(artifactId, artifactVersion, { apiBase = DEFAULT_API_BASE, fetchImpl = globalThis.fetch } = {}) {
  const data = await request(`/reporting/artifacts/${encodeURIComponent(artifactId)}/disclosure-decisions`, {}, apiBase, fetchImpl);
  return Array.isArray(data?.items)
    ? data.items.filter((item) => item?.decision === "APPROVED" && Number(item?.artifact_version) === Number(artifactVersion))
    : [];
}

export function authorizeDonorSummaryDistribution(artifactId, input, { apiBase = DEFAULT_API_BASE, fetchImpl = globalThis.fetch } = {}) {
  return request(`/reporting/artifacts/${encodeURIComponent(artifactId)}/distributions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      artifact_version: input.artifact_version,
      recipient_authorization_id: input.recipient_authorization_id,
      disclosure_decision_id: input.disclosure_decision_id,
      idempotency_key: input.idempotency_key,
      distribution_purpose: "donor-summary",
    }),
  }, apiBase, fetchImpl);
}
