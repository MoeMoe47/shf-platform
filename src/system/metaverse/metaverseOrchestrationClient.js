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

export const METAVERSE_ORCHESTRATION_CLIENT_META = {
  productionUsesProtectedApi: true,
  route: "/metaverse/orchestration",
  clientAuthorityFieldsSent: false,
  readOnlyProjection: true,
  fastTravelUsesProtectedEntry: true,
  credentialsIncluded: true,
};

async function parseEnvelope(response) {
  const payload = await response.json().catch(() => ({}));
  if (payload?.ok === false || !response.ok) {
    const error = new Error(payload?.error?.message || "City orchestration request failed.");
    error.code = payload?.error?.code || "CITY_ORCHESTRATION_REQUEST_FAILED";
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

export function getCityOrchestration() {
  return request("/metaverse/orchestration");
}

export function getDailyCityBriefing() {
  return request("/metaverse/orchestration/briefing");
}

export function getGuidedNextAction() {
  return request("/metaverse/orchestration/next-action");
}

export function getDistrictPulse() {
  return request("/metaverse/orchestration/district-pulse");
}

export function getCityEvents() {
  return request("/metaverse/orchestration/events");
}

export function getBuildingPreview(facilityId) {
  return request(`/metaverse/orchestration/building/${encodeURIComponent(facilityId)}`);
}

export function fastTravel(destinationId) {
  return request("/metaverse/orchestration/fast-travel", {
    method: "POST",
    body: JSON.stringify({ destination_id: destinationId }),
  });
}
