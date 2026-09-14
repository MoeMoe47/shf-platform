import React from "react";
import "./notifications.css";
import { useNotificationInbox, useOrganizationUnreadCounts, NOTIFICATION_FILTERS } from "./useNotifications.js";
import NotificationFilters from "./NotificationFilters.jsx";
import NotificationList from "./NotificationList.jsx";

// NCA-3 §9/§29: the one canonical inbox destination. Every shell mounts
// this same component at its own contextual route (e.g.
// /curriculum/notifications, /store/notifications) — a thin routing
// alias, not a per-product re-implementation (NCA-D002).
export default function NotificationInbox({ heading = "Notifications", description = "Updates across your Silicon Heartland activity." }) {
  const [filter, setFilter] = React.useState(NOTIFICATION_FILTERS.ALL);
  const [organizationId, setOrganizationId] = React.useState(undefined);
  const { organizations } = useOrganizationUnreadCounts();
  const { status, items, error, reload, markRead, markAllRead, archive } = useNotificationInbox({ organizationId, filter });

  const unreadCount = items.filter((item) => item.status === "UNREAD").length;
  const showOrganizationColumn = organizations.length > 1;

  const emptyReason = organizationId
    ? "organization"
    : filter === NOTIFICATION_FILTERS.UNREAD
      ? "unread"
      : filter === NOTIFICATION_FILTERS.ACTION_REQUIRED
        ? "action_required"
        : "all";

  return (
    <main className="nca-notif-inbox" aria-labelledby="nca-notif-inbox-heading">
      <header className="nca-notif-inbox__header">
        <div>
          <p className="nca-notif-inbox__eyebrow">Inbox</p>
          <h1 id="nca-notif-inbox-heading">{heading}</h1>
          <p>{description}</p>
        </div>
        <div className="nca-notif-inbox__actions">
          <button type="button" className="nca-notif-inbox__button" onClick={reload}>
            Refresh
          </button>
          {unreadCount > 0 ? (
            <button type="button" className="nca-notif-inbox__button" onClick={markAllRead}>
              Mark all read
            </button>
          ) : null}
        </div>
      </header>

      <NotificationFilters
        filter={filter}
        onFilterChange={setFilter}
        organizations={organizations}
        organizationId={organizationId}
        onOrganizationChange={setOrganizationId}
      />

      {status === "loading" ? <p className="nca-notif-status" role="status">Loading notifications…</p> : null}

      {status === "error" ? (
        <div className="nca-notif-error" role="alert">
          <strong>Notifications unavailable</strong>
          <span>{error}</span>
          <button type="button" onClick={reload}>Retry</button>
        </div>
      ) : null}

      {status === "ready" ? (
        <section className="nca-notif-inbox__panel" aria-labelledby="nca-notif-list-heading">
          <div className="nca-notif-inbox__panel-head">
            <h2 id="nca-notif-list-heading">Your notifications</h2>
            <span>{unreadCount} unread</span>
          </div>
          <NotificationList
            items={items}
            emptyReason={emptyReason}
            onMarkRead={markRead}
            onArchive={archive}
            showOrganization={showOrganizationColumn}
          />
        </section>
      ) : null}
    </main>
  );
}
