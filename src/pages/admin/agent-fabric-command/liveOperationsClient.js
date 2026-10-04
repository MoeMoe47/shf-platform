// src/pages/admin/agent-fabric-command/liveOperationsClient.js
// AFCC-3 Phase 7 — Live Operations reads. SHS bridge only (browser -> SHS ->
// Fabric safe read projection). GET only, cookies only: no admin key, no HMAC,
// no storage credential, never a direct Fabric call. Reuses the Command Center
// transport (commandClient.fetchCommandSource) so failures classify the same way.
import { AUTHORITY, BACKEND_AUTH, SOURCE_STATE, TRANSPORT } from "./commandContracts.js";
import { fetchCommandSource } from "./commandClient.js";
import { isRunIdentifier, validateEnvelope } from "./liveOperationsModel.js";

const RESERVED = new Set(["execute", "validate", "dry-run", "recent", "approve", "reject", "cancel", "revoke", "retry", "timeout", "loo"]);

const endpoint = (key, path, envelopeKind) =>
  Object.freeze({
    key,
    method: "GET",
    transport: TRANSPORT.SHS,
    path,
    envelopeKind,
    auth: BACKEND_AUTH.SHS_BRIDGE,
    admitted: true,
    authority: AUTHORITY.FABRIC_RUN_LEDGER,
    acceptStatuses: [200],
  });

export const LIVE_ENDPOINTS = Object.freeze({
  runs: endpoint("liveRuns", "/agent-fabric/command/runs", "runs_live"),
  storage: endpoint("artifactStorage", "/agent-fabric/command/storage/artifacts", "artifact_storage"),
});

const RUN_VIEWS = Object.freeze({
  detail: { suffix: "", kind: "run_detail" },
  timeline: { suffix: "/timeline", kind: "run_timeline" },
  evidence: { suffix: "/evidence", kind: "run_evidence" },
  dependencies: { suffix: "/dependencies", kind: "run_dependencies" },
});

export function isSafeRunId(value) {
  return isRunIdentifier(value) && !RESERVED.has(String(value).toLowerCase());
}

/** Endpoint for one view of one run; null when the id is outside the read contract. */
export function runEndpoint(view, runId) {
  const spec = RUN_VIEWS[view];
  if (!spec || !isSafeRunId(runId)) return null;
  return endpoint(`run_${view}`, `/agent-fabric/command/runs/${encodeURIComponent(runId)}${spec.suffix}`, spec.kind);
}

export function artifactEndpoint(runId, artifactId) {
  if (!isSafeRunId(runId) || !isRunIdentifier(artifactId)) return null;
  return endpoint(
    "run_artifact",
    `/agent-fabric/command/runs/${encodeURIComponent(runId)}/artifacts/${encodeURIComponent(artifactId)}`,
    "run_artifact",
  );
}

/** Fetch + contract check. A 200 that is not the exact read envelope is INVALID_RESPONSE. */
export async function fetchLive(ep, options = {}) {
  if (!ep) {
    return { state: SOURCE_STATE.INVALID_RESPONSE, payload: null, message: "Identifier is outside the read contract.", source: null };
  }
  const result = await fetchCommandSource(ep, options);
  if (result.state === SOURCE_STATE.AVAILABLE && !validateEnvelope(result.payload, ep.envelopeKind)) {
    return { ...result, state: SOURCE_STATE.INVALID_RESPONSE, payload: null, message: "Response was not the read contract this view expects." };
  }
  return result;
}
