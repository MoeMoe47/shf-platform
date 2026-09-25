import { apiGet } from "@/lib/apiClient";
import { fabricUrl } from "@/system/fabric/fabricConfig";

// Capital operator routes (/api/v1/operator/*) are served by the Agent
// Fabric (services/shf-agent-fabric), not the SHS API, so they are sent to the
// canonical Fabric base. apiGet only passes ABSOLUTE URLs through untouched
// (relative paths get the SHS "/api" base), so the Fabric URL — which is the
// same-origin "/fabric-api" proxy by default — is made absolute first.
function fabricGet(path) {
  const origin = globalThis.location?.origin || "http://127.0.0.1";
  return apiGet(new URL(fabricUrl(path), origin).href);
}

export function getOperatorSummary() {
  return fabricGet("/api/v1/operator/summary");
}

export function getOperatorFlow() {
  return fabricGet("/api/v1/operator/flow");
}

export function getOperatorDisputes() {
  return fabricGet("/api/v1/operator/disputes");
}

export function getOperatorPools() {
  return fabricGet("/api/v1/operator/pools");
}

export function getOperatorPool(poolId) {
  return fabricGet(`/api/v1/operator/pools/${poolId}`);
}

export function getOperatorPayout(payoutIntentId) {
  return fabricGet(`/api/v1/operator/payouts/${encodeURIComponent(String(payoutIntentId || "").trim())}`);
}

export function getTreasuryAccount(treasuryCode) {
  return fabricGet(`/api/v1/operator/treasury/accounts/${encodeURIComponent(String(treasuryCode || "").trim())}`);
}
