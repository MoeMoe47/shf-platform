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

export const METAVERSE_MARKET_CLIENT_META = {
  productionUsesProtectedApi: true,
  balanceAuthority: "TREASURY",
  clientEditableBalance: false,
  createsMarketplaceDm: false,
  listingRoute: "/metaverse/market/listings",
};

async function parseEnvelope(response) {
  const payload = await response.json().catch(() => ({}));
  if (payload?.ok === false || !response.ok) {
    const error = new Error(payload?.error?.message || "Student Market request failed.");
    error.code = payload?.error?.code || "MARKET_REQUEST_FAILED";
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

export function getMarketBalance() {
  return request("/metaverse/market/balance");
}

export function listMarketListings() {
  return request("/metaverse/market/listings").then((data) => data?.items || []);
}

export function listMarketOrders() {
  return request("/metaverse/market/orders").then((data) => data?.items || []);
}

export function purchaseListing(input) {
  return json("/metaverse/market/orders", "POST", {
    listingId: input.listingId,
    quantity: input.quantity || 1,
    idempotencyKey: input.idempotencyKey,
  });
}

export function requestMarketRefund(orderId, reason) {
  return json(`/metaverse/market/orders/${encodeURIComponent(orderId)}/refunds`, "POST", { reason });
}
