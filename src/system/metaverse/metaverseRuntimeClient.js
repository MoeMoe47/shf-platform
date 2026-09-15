import { resolveDevUserId } from "@/lib/liveLearning/api.js";

const API_BASE = import.meta.env?.VITE_SHS_API_BASE || import.meta.env?.VITE_LIVE_LEARNING_API_BASE || "http://127.0.0.1:8091";

function productionMode() {
  return import.meta.env?.MODE === "production" || import.meta.env?.PROD === true;
}

function devFixtureAllowed() {
  if (productionMode()) return false;
  return import.meta.env?.DEV === true && import.meta.env?.VITE_METAVERSE_ENABLE_DEV_UNLOCK_FIXTURE !== "0";
}

function headers() {
  const base = { "Content-Type": "application/json" };
  if (productionMode()) return base;
  return { ...base, Authorization: `Bearer dev-token:${resolveDevUserId("learner")}` };
}

export const METAVERSE_RUNTIME_CLIENT_META = {
  productionUsesProtectedApi: true,
  protectedEntryRoute: "/metaverse/entry",
  devFixtureAllowed,
  clientAuthorityFieldsSent: false,
  credentialsIncluded: true,
};

export function resourceRequest(resource) {
  return {
    scope: String(resource?.type || resource?.scope || "").toLowerCase(),
    city_id: "silicon-heartland-city",
    district_id: resource?.districtId || resource?.district_id || (resource?.type === "DISTRICT" ? resource.id : undefined),
    facility_id: resource?.facilityId || resource?.facility_id || (resource?.type === "FACILITY" ? resource.id : undefined),
    activity_id: resource?.activityId || resource?.activity_id || (resource?.type === "ACTIVITY" ? resource.id : undefined),
    resource_id: resource?.id || resource?.resource_id,
  };
}

export async function requestMetaverseEntry(resource, options = {}) {
  const response = await fetch(`${API_BASE}/metaverse/entry`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: headers(),
    body: JSON.stringify({
      resource: resourceRequest(resource),
      event: options.event || "view",
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (payload?.ok === false) {
    const error = new Error(payload?.error?.message || "Metaverse authorization unavailable.");
    error.code = payload?.error?.code || "METAVERSE_AUTHORIZATION_UNAVAILABLE";
    error.status = response.status;
    throw error;
  }
  if (!payload?.data) {
    const error = new Error("Metaverse authorization unavailable.");
    error.code = "METAVERSE_AUTHORIZATION_UNAVAILABLE";
    error.status = response.status;
    throw error;
  }
  return payload.data;
}

export function canUseMetaverseDevFixture() {
  return devFixtureAllowed();
}
