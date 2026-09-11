const API_BASE = import.meta.env.VITE_SHS_API_BASE || import.meta.env.VITE_API_BASE || "http://localhost:8091";
const DEFAULT_TOKEN = "dev-token:user_admin_001";
const DEFAULT_ORG = "org_shf_001";

function headers() {
  const token = window.localStorage.getItem("shfOperatorToken") || DEFAULT_TOKEN;
  const organizationId = window.localStorage.getItem("shfOperatorOrganizationId") || DEFAULT_ORG;
  return { Authorization: `Bearer ${token}`, "x-shs-organization-id": organizationId };
}

async function get(path) {
  const response = await fetch(`${API_BASE}${path}`, { headers: headers() });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message || "Government assurance request failed");
  return body.data;
}

async function post(path, payload = {}) {
  const response = await fetch(`${API_BASE}${path}`, { method: "POST", headers: { ...headers(), "content-type": "application/json" }, body: JSON.stringify(payload) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message || "Government assurance action failed");
  return body.data;
}

export function getAssuranceDashboard() { return get("/government-assurance/pilot/dashboard"); }
export function getPilotReadiness() { return get("/government-assurance/pilot/readiness"); }
export function getPilotConfigurations() { return get("/government-assurance/pilot/configurations"); }
export function getMonitoringQueue() { return get("/government-assurance/monitoring/work-queue"); }
export function getMonitoringPlan(id) { return get(`/government-assurance/monitoring/plans/${encodeURIComponent(id)}`); }
export function getMonitoringPlanHistory(id) { return get(`/government-assurance/monitoring/plans/${encodeURIComponent(id)}/history`); }
export function getMonitoringActivity(id) { return get(`/government-assurance/monitoring/activities/${encodeURIComponent(id)}`); }
export function getMonitoringActivityHistory(id) { return get(`/government-assurance/monitoring/activities/${encodeURIComponent(id)}/history`); }
export function getEvidenceRequest(id) { return get(`/government-assurance/monitoring/evidence-requests/${encodeURIComponent(id)}`); }
export function getEvidenceRequestHistory(id) { return get(`/government-assurance/monitoring/evidence-requests/${encodeURIComponent(id)}/history`); }
export function getFinding(id) { return get(`/government-assurance/findings/${encodeURIComponent(id)}`); }
export function getFindingHistory(id) { return get(`/government-assurance/findings/${encodeURIComponent(id)}/history`); }
export function determineFinding(id, payload = {}) { return post(`/government-assurance/findings/${encodeURIComponent(id)}/determine`, payload); }
export function getProviderResponse(id) { return get(`/government-assurance/provider-responses/${encodeURIComponent(id)}`); }
export function getProviderResponseHistory(id) { return get(`/government-assurance/provider-responses/${encodeURIComponent(id)}/history`); }
export function getCorrectiveAction(id) { return get(`/government-assurance/corrective-actions/${encodeURIComponent(id)}`); }
export function getCorrectiveActionHistory(id) { return get(`/government-assurance/corrective-actions/${encodeURIComponent(id)}/history`); }
export function retestCorrectiveAction(id, payload = {}) { return post(`/government-assurance/corrective-actions/${encodeURIComponent(id)}/retest`, payload); }
export function getPublicAssuranceSummary() { return fetch(`${API_BASE}/government-assurance/public/summary`).then((r) => r.json()).then((body) => body.data); }

export function getWorkspace(path) { return get(path); }
export function getPrograms() { return getWorkspace("/government-assurance/programs"); }
export function getProviders() { return getWorkspace("/government-assurance/funding/references"); }
export function getFundingReferences() { return getWorkspace("/government-assurance/funding/references"); }
export function getFundingLineage(reference) { return getWorkspace(`/government-assurance/funding/lineage/${encodeURIComponent(reference)}`); }
export function getFundingReadiness(payload = {}) { return post("/government-assurance/funding/readiness", payload); }
export function getProgramAssurance(reference) { return getWorkspace(`/government-assurance/programs/${encodeURIComponent(reference)}/assurance`); }
export function getProgramOversight(reference) { return getWorkspace(`/government-assurance/programs/${encodeURIComponent(reference)}/oversight`); }
export function getProviderAssurance(reference) { return getWorkspace(`/government-assurance/providers/${encodeURIComponent(reference)}/assurance`); }
export function getProviderIntegrity(reference) { return getWorkspace(`/government-assurance/providers/${encodeURIComponent(reference)}/integrity`); }
export function getClaims() { return getWorkspace("/government-assurance/claims"); }
export function getClaim(claimId) { return getWorkspace(`/government-assurance/claims/${encodeURIComponent(claimId)}`); }
export function getClaimEvidence(claimId) { return getWorkspace(`/government-assurance/claims/${encodeURIComponent(claimId)}/evidence`); }
export function getClaimReadiness(claimId) { return getWorkspace(`/government-assurance/claims/${encodeURIComponent(claimId)}/readiness`); }
export function getClaimHistory(claimId) { return getWorkspace(`/government-assurance/claims/${encodeURIComponent(claimId)}/history`); }
export function submitClaim(claimId) { return post(`/government-assurance/claims/${encodeURIComponent(claimId)}/submit`); }
export function withdrawClaim(claimId) { return post(`/government-assurance/claims/${encodeURIComponent(claimId)}/withdraw`); }
export function requestVerification(claimId, payload = {}) { return post("/government-assurance/verifications/request", { ...payload, claimId }); }
export function getVerificationQueue() { return getWorkspace("/government-assurance/verification-work-queue"); }
export function getVerification(verificationId) { return getWorkspace(`/government-assurance/verifications/${encodeURIComponent(verificationId)}`); }
export function getVerificationHistory(verificationId) { return getWorkspace(`/government-assurance/verifications/${encodeURIComponent(verificationId)}/history`); }
export function startVerification(verificationId) { return post(`/government-assurance/verifications/${encodeURIComponent(verificationId)}/start`); }
export function addVerificationContradiction(verificationId, payload = {}) { return post(`/government-assurance/verifications/${encodeURIComponent(verificationId)}/contradictions`, payload); }
export function determineVerification(verificationId, payload = {}) { return post(`/government-assurance/verifications/${encodeURIComponent(verificationId)}/determine`, payload); }
export function getReconciliationCases() { return getWorkspace("/government-assurance/reconciliation-cases"); }
export function getReconciliationCase(id) { return getWorkspace(`/government-assurance/reconciliation/${encodeURIComponent(id)}`); }
export function getReconciliationHistory(id) { return getWorkspace(`/government-assurance/reconciliation/${encodeURIComponent(id)}/history`); }
export function determineReconciliation(id, payload = {}) { return post(`/government-assurance/reconciliation/${encodeURIComponent(id)}/determine`, payload); }
export function getEntityResolutionCases() { return getWorkspace("/government-assurance/entity-resolution/cases"); }
export function determineEntityResolution(id, payload = {}) { return post(`/government-assurance/entity-resolution/${encodeURIComponent(id)}/determine`, payload); }
export function getQualityRules() { return getWorkspace("/government-assurance/data-quality/rules"); }
export function getQualityEvaluations() { return getWorkspace("/government-assurance/data-quality/evaluations"); }
export function getQualityReadiness(payload = {}) { return post("/government-assurance/data-quality/readiness", payload); }
export function getDuplicateCandidates() { return getWorkspace("/government-assurance/duplicates"); }
export function getSchemaObservations() { return getWorkspace("/government-assurance/schema-observations"); }
export function getRejectedRecords() { return getWorkspace("/government-assurance/rejected-records"); }
export function getAudits() { return getWorkspace("/government-assurance/audits"); }
export function getAudit(id) { return getWorkspace(`/government-assurance/audits/${encodeURIComponent(id)}`); }
export function getAuditHistory(id) { return getWorkspace(`/government-assurance/audits/${encodeURIComponent(id)}/history`); }
export function getAuditPacket(id) { return getWorkspace(`/government-assurance/audits/${encodeURIComponent(id)}/packet`); }
export function getSources() { return getWorkspace("/government-assurance/source-systems"); }
export function getSource(id) { return getWorkspace(`/government-assurance/source-systems/${encodeURIComponent(id)}`); }
export function getSourceAuthorities() { return getWorkspace("/government-assurance/source-authorities"); }
export function getDataUsePolicies() { return getWorkspace("/government-assurance/data-use-policies"); }
export function getSourceHealth() { return getWorkspace("/government-assurance/source-health"); }
export function getSemanticMappings() { return getWorkspace("/government-assurance/semantic-mappings"); }
export function getMetricResults() { return getWorkspace("/government-assurance/metric-results"); }
export function getTruthFacts() { return getWorkspace("/government-assurance/truth-facts"); }
export function getTruthFact(id) { return getWorkspace(`/government-assurance/truth-facts/${encodeURIComponent(id)}`); }
export function getLineage(metricResultId) { return getWorkspace(`/government-assurance/metric-results/${encodeURIComponent(metricResultId)}/lineage`); }
export function getAiDelegations() { return getWorkspace("/ai-governance/delegations"); }
export function askGovernmentAssuranceAssistant(payload = {}) { return post("/government-assurance/assistant/respond", payload); }
export function generateGovernmentAssuranceReport(payload = {}) { return post("/government-assurance/reports/generate", payload); }
export function getReportArtifactSnapshot(artifactId) { return get(`/reporting/artifacts/${encodeURIComponent(artifactId)}/snapshot`); }
export function getReportRenderedFiles(artifactId) { return get(`/reporting/artifacts/${encodeURIComponent(artifactId)}/rendered-files`); }
export function getReportArtifacts() { return get("/reporting/artifacts"); }
export function getReportRenderedFileUrl(fileId, download = false) { return `${API_BASE}/reporting/rendered-files/${encodeURIComponent(fileId)}${download ? "?download=1" : ""}`; }
export async function fetchReportRenderedFile(fileId) {
  const response = await fetch(`${API_BASE}/reporting/rendered-files/${encodeURIComponent(fileId)}`, { headers: headers() });
  if (!response.ok) throw new Error("Rendered report file retrieval failed");
  return { blob: await response.blob(), contentType: response.headers.get("content-type") || "application/octet-stream" };
}
