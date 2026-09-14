import { resolveDevUserId } from "@/lib/liveLearning/api.js";

const BASE = import.meta.env?.VITE_SHS_API_BASE || import.meta.env?.VITE_LIVE_LEARNING_API_BASE || "http://127.0.0.1:8091";

function headers(role) {
  const userId = window.__user?.id || resolveDevUserId(role);
  return { Authorization: `Bearer dev-token:${userId}`, "Content-Type": "application/json" };
}

async function read(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.ok === false) {
    const error = new Error(body?.error?.message || "Notifications are unavailable.");
    // Preserved so callers can distinguish e.g. ORG_CONTEXT_REQUIRED (no
    // active organization selected yet — an org-switcher concern owned by
    // EXR, not a real outage) from a genuine backend failure, and show an
    // honest, specific message instead of a generic one.
    error.code = body?.error?.code;
    throw error;
  }
  return body?.data ?? body;
}

// NCA-3: every read/mutation below accepts an optional `{ organizationId }`
// — server-authoritative (apps/shs-api validates it against the caller's
// own authorized memberships; see NCA-2 §8/§11). Omitting it uses the
// caller's active organization, exactly as before this phase.
function withOrganizationQuery(path, organizationId) {
  return organizationId ? `${path}?organizationId=${encodeURIComponent(organizationId)}` : path;
}

export async function listNotifications(role = "student", { organizationId } = {}) {
  return read(await fetch(`${BASE}${withOrganizationQuery("/notifications", organizationId)}`, { cache: "no-store", headers: headers(role) }));
}

export async function unreadCount(role = "student", { organizationId } = {}) {
  return read(await fetch(`${BASE}${withOrganizationQuery("/notifications/unread-count", organizationId)}`, { cache: "no-store", headers: headers(role) }));
}

// NCA-2's canonical attention-item projection — the actionRequired-filtered
// subset of the same notifications, never a second store.
export async function listAttentionItems(role = "student", { organizationId } = {}) {
  return read(await fetch(`${BASE}${withOrganizationQuery("/notifications/attention-items", organizationId)}`, { cache: "no-store", headers: headers(role) }));
}

// Aggregate, non-blocking cross-org unread signal (NCA-1/NCA-2) — never a
// merged cross-org notification list.
export async function listOrganizationUnreadCounts(role = "student") {
  return read(await fetch(`${BASE}/notifications/organizations`, { cache: "no-store", headers: headers(role) }));
}

export async function markNotificationRead(role, notificationId, { organizationId } = {}) {
  return read(await fetch(`${BASE}${withOrganizationQuery(`/notifications/${encodeURIComponent(notificationId)}/read`, organizationId)}`, { method: "POST", headers: headers(role) }));
}

export async function markAllNotificationsRead(role, { organizationId } = {}) {
  return read(await fetch(`${BASE}${withOrganizationQuery("/notifications/read-all", organizationId)}`, { method: "POST", headers: headers(role) }));
}

// NCA-3 §19/§21: dismiss/archive is inbox-presentation only (apps/shs-api
// notification-service.ts archiveNotification) — never a source-workflow
// mutation.
export async function archiveNotification(role, notificationId, { organizationId } = {}) {
  return read(await fetch(`${BASE}${withOrganizationQuery(`/notifications/${encodeURIComponent(notificationId)}/archive`, organizationId)}`, { method: "POST", headers: headers(role) }));
}
