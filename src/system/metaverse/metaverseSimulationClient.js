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

// MET-13 — every write here is an operational-fact/session-progress
// event, never a truth claim. The server derives learner identity,
// organization, unlock decision, retry policy, and team membership on
// every call (see simulation-session-service.ts) — this client never
// sends learner id, organization id, unlock state, or completion truth,
// and never renders a "verified skill" claim from a raw completion
// response.
export const METAVERSE_SIMULATION_CLIENT_META = {
  productionUsesProtectedApi: true,
  clientAuthorityFieldsSent: false,
  credentialsIncluded: true,
  simulationsRoute: "/metaverse/simulations",
};

async function parseEnvelope(response) {
  const payload = await response.json().catch(() => ({}));
  if (payload?.ok === false || !response.ok) {
    const error = new Error(payload?.error?.message || "Simulation request failed.");
    error.code = payload?.error?.code || "METAVERSE_SIMULATION_REQUEST_FAILED";
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

export function listSimulations() {
  return request("/metaverse/simulations");
}

export function getSimulation(simulationId) {
  return request(`/metaverse/simulations/${encodeURIComponent(simulationId)}`);
}

export function startSimulationSession(simulationId, body = {}) {
  return json(`/metaverse/simulations/${encodeURIComponent(simulationId)}/session/start`, "POST", body);
}

export function recordSimulationStep(simulationId, sessionId, body = {}) {
  return json(`/metaverse/simulations/${encodeURIComponent(simulationId)}/session/${encodeURIComponent(sessionId)}/step`, "POST", body);
}

export function retrySimulationSession(simulationId, sessionId) {
  return json(`/metaverse/simulations/${encodeURIComponent(simulationId)}/session/${encodeURIComponent(sessionId)}/retry`, "POST", {});
}

export function submitSimulationArtifact(simulationId, sessionId, body = {}) {
  return json(`/metaverse/simulations/${encodeURIComponent(simulationId)}/session/${encodeURIComponent(sessionId)}/artifact`, "POST", body);
}

export function completeSimulationSession(simulationId, sessionId) {
  return json(`/metaverse/simulations/${encodeURIComponent(simulationId)}/session/${encodeURIComponent(sessionId)}/complete`, "POST", {});
}

export function getSimulationOrchestration() {
  return request("/metaverse/simulations/orchestration");
}
