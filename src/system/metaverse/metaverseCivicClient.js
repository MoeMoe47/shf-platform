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

async function parseEnvelope(response) {
  const payload = await response.json().catch(() => ({}));
  if (payload?.ok === false || !response.ok) {
    const error = new Error(payload?.error?.message || "SHF Civic request failed.");
    error.code = payload?.error?.code || "SHF_CIVIC_REQUEST_FAILED";
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

export const METAVERSE_CIVIC_CLIENT_META = {
  authority: "SHF_CIVIC",
  civicSureAuthority: false,
  sendsEligibility: false,
  sendsRepresentation: false,
  sendsCandidacyApproval: false,
  sendsElectionResult: false,
  sendsCandidateRanking: false,
  sendsCampaignBoostPayment: false,
};

export function getCivicHall() {
  return request("/shf-civic/hall");
}

export function fileCandidacy(body) {
  return request("/shf-civic/candidacies", { method: "POST", body: JSON.stringify(body || {}) });
}

export function getBallot(electionId) {
  return request(`/shf-civic/elections/${encodeURIComponent(electionId)}/ballot`);
}

export function castBallot(electionId, candidateId) {
  return request(`/shf-civic/elections/${encodeURIComponent(electionId)}/ballots`, {
    method: "POST",
    body: JSON.stringify({ candidateId }),
  });
}

export function submitProposal(body) {
  return request("/shf-civic/proposals", { method: "POST", body: JSON.stringify(body || {}) });
}
