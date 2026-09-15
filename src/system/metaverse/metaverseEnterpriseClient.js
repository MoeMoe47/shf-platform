import { resolveDevUserId } from "@/lib/liveLearning/api.js";

const API_BASE = import.meta.env?.VITE_SHS_API_BASE || import.meta.env?.VITE_LIVE_LEARNING_API_BASE || "http://127.0.0.1:8091";

function productionMode() {
  return import.meta.env?.MODE === "production" || import.meta.env?.PROD === true;
}

function headers() {
  const base = { "Content-Type": "application/json" };
  if (productionMode()) return base;
  return { ...base, Authorization: `Bearer dev-token:${resolveDevUserId("learner")}` };
}

// MET-12 — Student Enterprise is educational/simulated. This client never
// asserts legal-business, employer, payroll, tax, licensing, or independent
// organization status; it only reflects server-authoritative lifecycle,
// role, catalog, and history state.
export const METAVERSE_ENTERPRISE_CLIENT_META = {
  legalBoundary: "Student Enterprise is educational/simulated: not a legal business, employer, payroll entity, tax entity, licensed contractor, registered company, or independent organization/tenant.",
  treasuryAuthority: "TREASURY",
  clientEditableBalance: false,
  createsEnterpriseDm: false,
};

async function parseEnvelope(response) {
  const payload = await response.json().catch(() => ({}));
  if (payload?.ok === false || !response.ok) {
    const error = new Error(payload?.error?.message || "Student Enterprise request failed.");
    error.code = payload?.error?.code || "ENTERPRISE_REQUEST_FAILED";
    error.status = response.status;
    throw error;
  }
  return payload?.data ?? payload;
}

function request(path, options = {}) {
  return fetch(`${API_BASE}${path}`, {
    credentials: "include",
    cache: "no-store",
    headers: headers(),
    ...options,
  }).then(parseEnvelope);
}

export function listMyEnterprises() {
  return request("/metaverse/enterprise/enterprises/mine");
}

// Canonical Studio team authority (studio_teams/studio_team_members) — the
// formation form reuses this list rather than any enterprise-local roster.
export function listMyStudioTeams() {
  return request("/studio/teams").then((result) => result?.items || result || []);
}

export function listDiscoverableEnterprises() {
  return request("/metaverse/enterprise/enterprises/discover");
}

// Reviewer-only (instructor/program manager/admin). The server is the sole
// authority: this call simply fails (401/403) for a STUDENT actor, and
// callers must treat that failure as "no reviewer surface", never attempt
// to infer or cache a reviewer identity client-side.
export function listEnterprisesForReview() {
  return request("/metaverse/enterprise/enterprises/review");
}

export function getEnterprise(enterpriseId) {
  return request(`/metaverse/enterprise/enterprises/${encodeURIComponent(enterpriseId)}`);
}

export function formEnterprise(input) {
  return request("/metaverse/enterprise/enterprises", { method: "POST", body: JSON.stringify(input) });
}

export function submitEnterpriseForApproval(enterpriseId) {
  return request(`/metaverse/enterprise/enterprises/${encodeURIComponent(enterpriseId)}/submit-for-approval`, { method: "POST" });
}

export function approveEnterprise(enterpriseId) {
  return request(`/metaverse/enterprise/enterprises/${encodeURIComponent(enterpriseId)}/approve`, { method: "POST" });
}

export function returnEnterprise(enterpriseId, reason) {
  return request(`/metaverse/enterprise/enterprises/${encodeURIComponent(enterpriseId)}/return`, { method: "POST", body: JSON.stringify({ reason }) });
}

export function pauseEnterprise(enterpriseId) {
  return request(`/metaverse/enterprise/enterprises/${encodeURIComponent(enterpriseId)}/pause`, { method: "POST" });
}

export function resumeEnterprise(enterpriseId) {
  return request(`/metaverse/enterprise/enterprises/${encodeURIComponent(enterpriseId)}/resume`, { method: "POST" });
}

export function suspendEnterprise(enterpriseId, reason) {
  return request(`/metaverse/enterprise/enterprises/${encodeURIComponent(enterpriseId)}/suspend`, { method: "POST", body: JSON.stringify({ reason }) });
}

export function closeEnterprise(enterpriseId) {
  return request(`/metaverse/enterprise/enterprises/${encodeURIComponent(enterpriseId)}/close`, { method: "POST" });
}

export function listEnterpriseCatalog(enterpriseId) {
  return request(`/metaverse/enterprise/enterprises/${encodeURIComponent(enterpriseId)}/catalog`);
}

export function addEnterpriseCatalogItem(enterpriseId, input) {
  return request(`/metaverse/enterprise/enterprises/${encodeURIComponent(enterpriseId)}/catalog`, { method: "POST", body: JSON.stringify(input) });
}

export function listEnterpriseHistory(enterpriseId) {
  return request(`/metaverse/enterprise/enterprises/${encodeURIComponent(enterpriseId)}/history`);
}
