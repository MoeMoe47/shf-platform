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

// MET-7 — mission projections come from the server's own real
// assignment/curriculum/arcade/completion-policy authority. This client
// never lets the caller set student identity, org membership, assignment
// ownership, completion truth, evidence verification, or credential
// state — every write here is an operational-fact event, never a truth
// claim (see mission-projection-service.ts's own boundary).
export const METAVERSE_MISSION_CLIENT_META = {
  productionUsesProtectedApi: true,
  clientAuthorityFieldsSent: false,
  credentialsIncluded: true,
  missionsRoute: "/metaverse/missions",
};

async function parseEnvelope(response) {
  const payload = await response.json().catch(() => ({}));
  if (payload?.ok === false || !response.ok) {
    const error = new Error(payload?.error?.message || "Mission request failed.");
    error.code = payload?.error?.code || "METAVERSE_MISSION_REQUEST_FAILED";
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

export function listMissions() {
  return request("/metaverse/missions");
}

export function getMission(missionProjectionId) {
  return request(`/metaverse/missions/${encodeURIComponent(missionProjectionId)}`);
}

export function enterMission(missionProjectionId, body = {}) {
  return json(`/metaverse/missions/${encodeURIComponent(missionProjectionId)}/enter`, "POST", body);
}

export function exitMission(missionProjectionId) {
  return json(`/metaverse/missions/${encodeURIComponent(missionProjectionId)}/enter`, "POST", { exit: true });
}

export function recordMissionViewed(missionProjectionId) {
  return json(`/metaverse/missions/${encodeURIComponent(missionProjectionId)}/events`, "POST", { event: "viewed" });
}

export function recordMissionActivityCompleted(missionProjectionId) {
  return json(`/metaverse/missions/${encodeURIComponent(missionProjectionId)}/events`, "POST", { event: "activity_completed" });
}

export function submitMission(missionProjectionId) {
  return json(`/metaverse/missions/${encodeURIComponent(missionProjectionId)}/submit`, "POST", {});
}
