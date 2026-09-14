// NCA-3 §30: the one shared adapter for fetch/count/mark-read/filter
// logic. Every product consumes these hooks instead of re-implementing
// its own fetch/count/mark-read logic (which is exactly how Store,
// Arcade, and CivicSure ended up with three independent fake bells before
// this phase — see docs/architecture/NCA-0_SYSTEM_WIDE_NOTIFICATION_COMMUNICATION_ARCHITECTURE_AUDIT.md §6).
import React from "react";
import { useUser } from "@/context/UserContext.jsx";
import * as notificationsApi from "@/lib/notifications/api.js";
import { messageForError } from "./errorMessages.js";
import { filterItemsForView } from "./filterItems.js";

// A read/archive mutation from one consumer (e.g. the full inbox page)
// must not leave a sibling consumer (e.g. the header bell mounted at the
// same time) showing a stale, now-incorrect count — an unread count that
// silently disowns the backend after the fact reads as exactly the
// "misleading count" this phase's own law forbids (NCA-3 §8). This is a
// same-tab notification-of-change, not a new persistence or attention
// store: every listener still re-fetches from the canonical backend, this
// only tells them when to.
const changeBus = typeof window !== "undefined" ? new EventTarget() : null;
function notifyNotificationsChanged() {
  changeBus?.dispatchEvent(new Event("change"));
}
function useNotificationsChanged(onChange) {
  React.useEffect(() => {
    if (!changeBus) return undefined;
    changeBus.addEventListener("change", onChange);
    return () => changeBus.removeEventListener("change", onChange);
  }, [onChange]);
}

/**
 * Canonical unread count, always sourced from the backend
 * (GET /notifications/unread-count) — never derived from localStorage or
 * any client-local authority.
 */
export function useUnreadCount({ organizationId } = {}) {
  const { role } = useUser();
  const [state, setState] = React.useState({ status: "loading", count: 0, error: "" });

  const reload = React.useCallback(() => {
    let cancelled = false;
    setState((s) => ({ ...s, status: "loading", error: "" }));
    notificationsApi.unreadCount(role, { organizationId })
      .then((data) => { if (!cancelled) setState({ status: "ready", count: Number(data?.count || 0), error: "" }); })
      .catch((error) => { if (!cancelled) setState((s) => ({ ...s, status: "error", error: messageForError(error, "Unread count is temporarily unavailable.") })); });
    return () => { cancelled = true; };
  }, [role, organizationId]);

  React.useEffect(() => reload(), [reload]);
  useNotificationsChanged(reload);

  return { ...state, reload };
}

/**
 * Which authorized organizations (if more than one) have unread
 * notifications — the safe, aggregate cross-org signal (NCA-1/NCA-2),
 * never a merged cross-org list. Returns an empty array for single-org
 * users so callers can skip rendering an organization filter entirely.
 */
export function useOrganizationUnreadCounts() {
  const { role } = useUser();
  const [state, setState] = React.useState({ status: "loading", organizations: [], error: "" });

  React.useEffect(() => {
    let cancelled = false;
    notificationsApi.listOrganizationUnreadCounts(role)
      .then((data) => { if (!cancelled) setState({ status: "ready", organizations: data?.organizations || [], error: "" }); })
      .catch((error) => { if (!cancelled) setState({ status: "error", organizations: [], error: messageForError(error, "Organization list is temporarily unavailable.") }); });
    return () => { cancelled = true; };
  }, [role]);

  return state;
}

const FILTERS = { ALL: "all", UNREAD: "unread", ACTION_REQUIRED: "action_required" };
export { FILTERS as NOTIFICATION_FILTERS };

/**
 * The canonical inbox/preview data source. `filter` selects between the
 * full canonical projection and the canonical attention-item projection
 * (NCA-2) — both are the same underlying notifications, never a second
 * store. Mutations (markRead/markAllRead/archive) update local state
 * optimistically after a successful backend call; they never mutate
 * anything client-side-only or treat client state as authoritative.
 */
export function useNotificationInbox({ organizationId, filter = FILTERS.ALL } = {}) {
  const { role } = useUser();
  const [state, setState] = React.useState({ status: "loading", items: [], error: "" });

  const load = React.useCallback(() => {
    setState((s) => ({ ...s, status: "loading", error: "" }));
    const request = filter === FILTERS.ACTION_REQUIRED
      ? notificationsApi.listAttentionItems(role, { organizationId }).then((data) => (data.items || []).map((item) => ({
          notificationId: item.notificationId,
          organizationId: item.organizationId,
          type: item.type,
          title: item.title,
          message: item.message,
          destinationPath: item.destinationPath,
          urgency: item.urgency,
          status: item.readState,
          createdAt: item.createdAt,
          actionRequired: true,
        })))
      : notificationsApi.listNotifications(role, { organizationId }).then((data) => filterItemsForView(data.items || [], filter));
    request
      .then((items) => setState({ status: "ready", items, error: "" }))
      .catch((error) => setState({ status: "error", items: [], error: messageForError(error, "Notifications are temporarily unavailable.") }));
  }, [role, organizationId, filter]);

  React.useEffect(() => { load(); }, [load]);
  useNotificationsChanged(load);

  const markRead = React.useCallback(async (item) => {
    if (item.status !== "UNREAD") return;
    await notificationsApi.markNotificationRead(role, item.notificationId, { organizationId });
    // READ never implies the underlying action is complete (NCA-2/NCA-3
    // governing law) — an action-required item keeps actionRequired=true
    // here; only the source-domain workflow, reflected the next time this
    // loads from the canonical attention projection, can make it disappear.
    setState((s) => ({ ...s, items: s.items.map((n) => n.notificationId === item.notificationId ? { ...n, status: "READ" } : n) }));
    notifyNotificationsChanged();
  }, [role, organizationId]);

  const markAllRead = React.useCallback(async () => {
    await notificationsApi.markAllNotificationsRead(role, { organizationId });
    setState((s) => ({ ...s, items: s.items.map((n) => ({ ...n, status: "READ" })) }));
    notifyNotificationsChanged();
  }, [role, organizationId]);

  const archive = React.useCallback(async (item) => {
    await notificationsApi.archiveNotification(role, item.notificationId, { organizationId });
    setState((s) => ({ ...s, items: s.items.filter((n) => n.notificationId !== item.notificationId) }));
    notifyNotificationsChanged();
  }, [role, organizationId]);

  return { ...state, reload: load, markRead, markAllRead, archive };
}
