import { resolveDevUserId } from "@/lib/liveLearning/api.js";

const BASE = import.meta.env?.VITE_SHS_API_BASE || import.meta.env?.VITE_LIVE_LEARNING_API_BASE || "http://127.0.0.1:8091";

function headers(role) {
  const userId = window.__user?.id || resolveDevUserId(role);
  return { Authorization: `Bearer dev-token:${userId}`, "Content-Type": "application/json" };
}

async function read(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.ok === false) throw new Error(body?.error?.message || "Notifications are unavailable.");
  return body?.data ?? body;
}

export async function listNotifications(role = "student") {
  return read(await fetch(`${BASE}/notifications`, { cache: "no-store", headers: headers(role) }));
}

export async function markNotificationRead(role, notificationId) {
  return read(await fetch(`${BASE}/notifications/${encodeURIComponent(notificationId)}/read`, { method: "POST", headers: headers(role) }));
}

export async function markAllNotificationsRead(role) {
  return read(await fetch(`${BASE}/notifications/read-all`, { method: "POST", headers: headers(role) }));
}
