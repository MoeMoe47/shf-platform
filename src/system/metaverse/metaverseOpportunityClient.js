import { resolveDevUserId } from "@/lib/liveLearning/api.js";
import { API_BASE as SHS_API_BASE } from "@/lib/apiClient.js";

const API_BASE = SHS_API_BASE;

function productionMode() {
  return import.meta.env?.MODE === "production" || import.meta.env?.PROD === true;
}

function headers() {
  const base = { "Content-Type": "application/json" };
  if (productionMode()) return base;
  return { ...base, Authorization: `Bearer dev-token:${resolveDevUserId("learner")}` };
}

// MET-8 — every read here is the server's own eligibility/status
// projection (opportunity-service.ts); every write is a bid/withdrawal/
// work-submission request the server independently validates against
// real identity, real team membership, and real evidence ownership. This
// client never sends student_id, team ownership, credential, or verified-
// skill claims — the server derives all of those (see
// METAVERSE_OPPORTUNITY_CLIENT_META below).
export const METAVERSE_OPPORTUNITY_CLIENT_META = {
  productionUsesProtectedApi: true,
  clientAuthorityFieldsSent: false,
  credentialsIncluded: true,
  opportunitiesRoute: "/metaverse/opportunity-exchange/opportunities",
};

async function parseEnvelope(response) {
  const payload = await response.json().catch(() => ({}));
  if (payload?.ok === false || !response.ok) {
    const error = new Error(payload?.error?.message || "Opportunity Exchange request failed.");
    error.code = payload?.error?.code || "OPPORTUNITY_EXCHANGE_REQUEST_FAILED";
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

function json(path, method, body) {
  return request(path, { method, body: JSON.stringify(body || {}) });
}

export function listOpportunities() {
  return request("/metaverse/opportunity-exchange/opportunities").then((data) => data?.items || []);
}

export function getOpportunity(opportunityId) {
  return request(`/metaverse/opportunity-exchange/opportunities/${encodeURIComponent(opportunityId)}`);
}

export function getMyBid(opportunityId) {
  return request(`/metaverse/opportunity-exchange/opportunities/${encodeURIComponent(opportunityId)}/bids/mine`);
}

// input: { bidderType, teamId?, proposalSummary, approach?, requestedCompensationAmount?,
//          requestedCompensationType?, estimatedCompletionDays?, portfolioEvidenceRefs?,
//          skillEvidenceRefs?, availability? } — never a student/team identity claim.
export function submitBid(opportunityId, input) {
  return json(`/metaverse/opportunity-exchange/opportunities/${encodeURIComponent(opportunityId)}/bids`, "POST", input);
}

export function withdrawBid(bidId) {
  return json(`/metaverse/opportunity-exchange/bids/${encodeURIComponent(bidId)}/withdraw`, "POST", {});
}

export function listMyAwards() {
  return request("/metaverse/opportunity-exchange/awards").then((data) => data?.items || []);
}

export function getAward(awardId) {
  return request(`/metaverse/opportunity-exchange/awards/${encodeURIComponent(awardId)}`);
}

export function submitWork(awardId, input) {
  return json(`/metaverse/opportunity-exchange/awards/${encodeURIComponent(awardId)}/submissions`, "POST", input);
}

export function listSubmissionsForAward(awardId) {
  return request(`/metaverse/opportunity-exchange/awards/${encodeURIComponent(awardId)}/submissions`).then((data) => data?.items || []);
}
