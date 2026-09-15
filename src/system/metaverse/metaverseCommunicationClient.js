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

export const METAVERSE_COMMUNICATION_CLIENT_META = {
  productionUsesProtectedApi: true,
  clientAuthorityFieldsSent: false,
  credentialsIncluded: true,
  presenceRoute: "/metaverse/presence",
  roomsRoute: "/metaverse/rooms",
};

async function parseEnvelope(response) {
  const payload = await response.json().catch(() => ({}));
  if (payload?.ok === false || !response.ok) {
    const error = new Error(payload?.error?.message || "Metaverse communication request failed.");
    error.code = payload?.error?.code || "METAVERSE_COMMUNICATION_REQUEST_FAILED";
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

export function startPresence(body) {
  return json("/metaverse/presence", "POST", body);
}

export function heartbeatPresence(presenceSessionId, body = {}) {
  return json("/metaverse/presence/heartbeat", "POST", { ...body, presence_session_id: presenceSessionId });
}

export function revokePresence(presenceSessionId) {
  return json("/metaverse/presence/revoke", "POST", { presence_session_id: presenceSessionId });
}

export function getCityPresence() {
  return request("/metaverse/presence/city");
}

export function getParticipants({ districtId, facilityId } = {}) {
  const qs = new URLSearchParams();
  if (districtId) qs.set("district_id", districtId);
  if (facilityId) qs.set("facility_id", facilityId);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return request(`/metaverse/presence/participants${suffix}`);
}

export function getRoomsPolicy() {
  return request("/metaverse/rooms/policy");
}

export function getOrCreateRoom(body) {
  return json("/metaverse/rooms", "POST", body);
}

export function listMessages(roomId) {
  return request(`/metaverse/rooms/${encodeURIComponent(roomId)}/messages`);
}

export function sendMessage(roomId, body) {
  return json(`/metaverse/rooms/${encodeURIComponent(roomId)}/messages`, "POST", body);
}

export function deleteMessage(roomId, messageId) {
  return request(`/metaverse/rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(messageId)}`, { method: "DELETE" });
}

export function getRoomParticipants(roomId) {
  return request(`/metaverse/rooms/${encodeURIComponent(roomId)}/participants`);
}

export function muteParticipant(roomId, targetUserId) {
  return json(`/metaverse/rooms/${encodeURIComponent(roomId)}/mute`, "POST", { target_user_id: targetUserId });
}

export function blockParticipant(roomId, targetUserId) {
  return json(`/metaverse/rooms/${encodeURIComponent(roomId)}/block`, "POST", { target_user_id: targetUserId });
}

export function reportParticipant(roomId, body) {
  return json(`/metaverse/rooms/${encodeURIComponent(roomId)}/reports`, "POST", body);
}
