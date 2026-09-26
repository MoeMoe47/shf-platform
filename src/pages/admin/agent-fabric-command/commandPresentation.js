// src/pages/admin/agent-fabric-command/commandPresentation.js
// Pure presentation helpers: source-state copy, the status strip model, and
// value formatting. No React here so it can be tested directly.
import { derivePosture, POSTURE } from "./commandAdapters.js";
import { GAP, GAP_LABEL, SOURCE_STATE } from "./commandContracts.js";
import { formatAge } from "./commandTime.js";

export { formatAge };

export const SOURCE_STATE_COPY = Object.freeze({
  [SOURCE_STATE.LOADING]: { label: "Loading", tone: "neutral", detail: "Waiting for the first response from Agent Fabric." },
  [SOURCE_STATE.AVAILABLE]: { label: "Available", tone: "ok", detail: "" },
  [SOURCE_STATE.EMPTY]: { label: "No records", tone: "neutral", detail: "The source responded and returned no records." },
  [SOURCE_STATE.UNAUTHENTICATED]: { label: "Auth required", tone: "warn", detail: "Agent Fabric returned 401 for this source." },
  [SOURCE_STATE.AUTH_BRIDGE_REQUIRED]: { label: "Auth bridge required", tone: "gap", detail: "This source is read with an Agent Fabric session, which this browser does not hold, and it is not yet served through the SHS bridge. The browser holds no Fabric credential, so the source is not read." },
  [SOURCE_STATE.FORBIDDEN]: { label: "Access restricted", tone: "warn", detail: "Agent Fabric returned 403: the current identity lacks the read permission for this source." },
  [SOURCE_STATE.OFFLINE]: { label: "Network error", tone: "fail", detail: "Agent Fabric could not be reached." },
  [SOURCE_STATE.TIMEOUT]: { label: "Timed out", tone: "fail", detail: "Agent Fabric did not respond in time." },
  [SOURCE_STATE.INVALID_RESPONSE]: { label: "Invalid response", tone: "fail", detail: "The response did not match this endpoint's contract, so nothing from it is shown." },
  [SOURCE_STATE.HTTP_ERROR]: { label: "Backend error", tone: "fail", detail: "Agent Fabric returned an error for this source." },
  [SOURCE_STATE.AUTH_HARDENING_REQUIRED]: { label: "Auth hardening required", tone: "gap", detail: "This endpoint has no backend authorization, so the Command Center does not call it." },
  [SOURCE_STATE.NOT_YET_VERIFIED]: { label: "Not yet verified", tone: "gap", detail: "No verification result has been recorded. Verification runs only as a privileged admin action; this view never runs it." },
  [SOURCE_STATE.NOT_YET_EVALUATED]: { label: "Not yet evaluated", tone: "gap", detail: "Watchtower has no persisted evaluation for these programs. This view reads persisted state and never evaluates." },
  [SOURCE_STATE.NOT_CONFIGURED]: { label: "Not configured", tone: "gap", detail: "No Agent Fabric route is configured for this deployment." },
  [SOURCE_STATE.BACKEND_UNAVAILABLE]: { label: "Backend unavailable", tone: "fail", detail: "The service behind this source could not be reached. Nothing was read." },
  [SOURCE_STATE.FABRIC_ERROR]: { label: "Fabric error", tone: "fail", detail: "Agent Fabric was reached, but its handler failed to produce this source." },
  [SOURCE_STATE.BRIDGE_NOT_CONFIGURED]: { label: "Bridge not configured", tone: "gap", detail: "The SHS API is not configured to reach Agent Fabric (Fabric URL or service keyring missing). Nothing was read." },
  [SOURCE_STATE.BRIDGE_REJECTED]: { label: "Bridge rejected", tone: "fail", detail: "Agent Fabric refused the SHS API service identity. The service keyrings on SHS and Fabric do not match." },
});

// Where a failure happened (AFCC-2A.2).
export const FAILURE_LAYER_COPY = Object.freeze({
  browser_to_shs: "Browser → SHS API",
  shs: "SHS API",
  shs_to_fabric: "SHS API → Agent Fabric",
  fabric: "Agent Fabric handler",
  gateway_to_fabric: "Browser → gateway → Agent Fabric",
});

export function failureLayerLabel(layer) {
  return FAILURE_LAYER_COPY[layer] || null;
}

export function stateCopy(state) {
  return SOURCE_STATE_COPY[state] || { label: "Not available", tone: "fail", detail: "" };
}

export const isDataState = (state) => state === SOURCE_STATE.AVAILABLE || state === SOURCE_STATE.EMPTY;

// Maps a source that could not supply data to the missing-data vocabulary.
export function gapForState(state) {
  if (state === SOURCE_STATE.AUTH_HARDENING_REQUIRED) return GAP.AUTH_HARDENING_REQUIRED;
  if (state === SOURCE_STATE.AUTH_BRIDGE_REQUIRED) return GAP.AUTH_BRIDGE_REQUIRED;
  if (state === SOURCE_STATE.NOT_YET_VERIFIED || state === SOURCE_STATE.NOT_YET_EVALUATED) return GAP.NOT_PUBLISHED;
  return GAP.NOT_AVAILABLE;
}

export function gapLabel(gap) {
  return GAP_LABEL[gap] || GAP_LABEL[GAP.NOT_AVAILABLE];
}

export function formatTimestamp(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

export function shortId(value, length = 8) {
  const text = String(value || "");
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

export const POSTURE_COPY = Object.freeze({
  [POSTURE.CHECKING]: { headline: "Checking Fabric", strip: "CHECKING", tone: "neutral" },
  [POSTURE.OPERATIONAL]: { headline: "Fabric operational", strip: "LIVE", tone: "ok" },
  [POSTURE.DEGRADED]: { headline: "Fabric degraded", strip: "DEGRADED", tone: "warn" },
  [POSTURE.OFFLINE]: { headline: "Fabric offline", strip: "OFFLINE", tone: "fail" },
});

export const VERDICT_TONE = Object.freeze({ PASS: "ok", DEGRADED: "warn", FAIL: "fail" });

function unavailable(projection) {
  const copy = stateCopy(projection?.state);
  return { value: copy.label.toUpperCase(), tone: projection?.state === SOURCE_STATE.LOADING ? "neutral" : copy.tone };
}

// The top status strip. Every value comes from a named source; when a source
// cannot supply one, the strip shows that source's state instead of a number.
export function buildStatusStrip(snapshot) {
  const posture = derivePosture(snapshot);
  const postureCopy = POSTURE_COPY[posture.posture];

  const ready = snapshot.healthReady;
  const readiness = isDataState(ready?.state)
    ? { value: ready.data.ready ? "READY" : "NOT READY", tone: ready.data.ready ? "ok" : "warn" }
    : unavailable(ready);

  // Last recorded verification verdict with its age; never presented as current.
  const infra = snapshot.infrastructure;
  let infraItem;
  if (isDataState(infra?.state)) {
    const age = formatAge(infra.data.ageSeconds);
    infraItem = { value: infra.data.verdict, tone: VERDICT_TONE[infra.data.verdict], detail: age ? `Verified ${age}` : "Verification time not captured" };
  } else infraItem = unavailable(infra);

  const agents = snapshot.agentHealth;
  let agentsItem;
  if (agents?.state === SOURCE_STATE.EMPTY) agentsItem = { value: "NONE REGISTERED", tone: "neutral" };
  else if (isDataState(agents?.state) && agents.data.summary.total !== null && agents.data.summary.ready !== null) {
    const { ready: r, total } = agents.data.summary;
    agentsItem = { value: `${r} / ${total} READY`, tone: r === total ? "ok" : "warn" };
  } else agentsItem = unavailable(agents);

  const risk = snapshot.watchtower;
  let riskItem;
  if (isDataState(risk?.state) && risk.data.worstRiskBand) {
    const age = formatAge(risk.data.ageSeconds);
    riskItem = { value: risk.data.worstRiskBand, tone: risk.data.worstRiskBand === "GREEN" ? "ok" : "warn", detail: age ? `Evaluated ${age}` : null };
  } else riskItem = unavailable(risk);

  return {
    posture,
    items: [
      { id: "fabric", label: "Fabric", value: postureCopy.strip, tone: postureCopy.tone, drawer: { type: "posture" } },
      { id: "readiness", label: "Readiness", ...readiness, drawer: { type: "source", key: "healthReady" } },
      { id: "agents", label: "Agent health", ...agentsItem, drawer: { type: "agents" } },
      { id: "infrastructure", label: "Infrastructure", ...infraItem, drawer: { type: "source", key: "infrastructure" } },
      { id: "risk", label: "Watchtower risk", ...riskItem, drawer: { type: "source", key: "watchtower" } },
    ],
  };
}

// Agents that the registry itself flags: health status "warning" or execution blocked.
export function agentsNeedingAttention(agentHealth, agentReadiness) {
  const byId = new Map();
  if (isDataState(agentHealth?.state)) {
    for (const agent of agentHealth.data.agents) {
      if (agent.agentId && agent.status && agent.status !== "ready") {
        byId.set(agent.agentId, { agentId: agent.agentId, name: agent.name, health: agent.status, execution: null });
      }
    }
  }
  if (isDataState(agentReadiness?.state)) {
    for (const agent of agentReadiness.data.agents) {
      if (agent.agentId && agent.executionStatus === "blocked") {
        const current = byId.get(agent.agentId) || { agentId: agent.agentId, name: agent.name, health: null, execution: null };
        byId.set(agent.agentId, { ...current, execution: agent.executionStatus });
      }
    }
  }
  return [...byId.values()];
}
