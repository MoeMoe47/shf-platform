import { apiGet } from "@/lib/apiClient";

export function getOperatorSummary() {
  return apiGet("/api/v1/operator/summary");
}

export function getOperatorFlow() {
  return apiGet("/api/v1/operator/flow");
}

export function getOperatorDisputes() {
  return apiGet("/api/v1/operator/disputes");
}

export function getOperatorPools() {
  return apiGet("/api/v1/operator/pools");
}

export function getOperatorPool(poolId) {
  return apiGet(`/api/v1/operator/pools/${poolId}`);
}

export function getOperatorPayout(payoutIntentId) {
  return apiGet(`/api/v1/operator/payouts/${encodeURIComponent(String(payoutIntentId || "").trim())}`);
}

export function getTreasuryAccount(treasuryCode) {
  return apiGet(`/api/v1/operator/treasury/accounts/${encodeURIComponent(String(treasuryCode || "").trim())}`);
}
