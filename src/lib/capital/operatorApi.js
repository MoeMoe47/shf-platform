import { apiGet } from "@/lib/apiClient";
import { FABRIC_API_BASE } from "@/system/fabric/fabricConfig";

// Capital operator routes (/api/v1/operator/*) are served by the Agent
// Fabric (services/shf-agent-fabric), not the SHS API, so they are sent to the
// canonical Fabric base. apiGet passes absolute URLs through.

function fabricGet(path) {
  return apiGet(`${FABRIC_API_BASE}${path}`);
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
