import React from "react";
import { Link } from "react-router-dom";
import "./notifications.css";
import { useUnreadCount, useNotificationInbox } from "./useNotifications.js";
import NotificationList from "./NotificationList.jsx";

function BellIcon(props) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

// NCA-3 §7/§8: the one canonical notification bell every product consumes.
// Shows unread count from the canonical backend only (never a fake or
// localStorage-derived count, and never a badge when the real count is
// zero). Accepts `inboxHref` because each shell mounts the canonical inbox
// at its own contextual route (NCA-3 §29) — the bell itself does not
// decide routing, it only links to wherever its host page tells it the
// canonical inbox lives.
export default function NotificationBell({ inboxHref, organizationId, className = "" }) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef(null);
  const { count, status: countStatus } = useUnreadCount({ organizationId });
  const { items, status, error, markRead } = useNotificationInbox({ organizationId });

  React.useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const hasUnread = countStatus === "ready" && count > 0;
  const label = countStatus === "error"
    ? "Notifications, unread count unavailable"
    : hasUnread
      ? `Notifications, ${count} unread`
      : "Notifications";

  return (
    <div className={`nca-notif-bell ${className}`.trim()} ref={containerRef}>
      <button
        type="button"
        className="nca-notif-bell__trigger"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
      >
        <BellIcon />
        {hasUnread ? (
          <span className="nca-notif-bell__badge" aria-hidden="true">{count > 99 ? "99+" : count}</span>
        ) : null}
      </button>
      {open ? (
        <div className="nca-notif-bell__panel" role="dialog" aria-label="Notifications">
          <div className="nca-notif-bell__panel-head">
            <strong>Notifications</strong>
            {hasUnread ? <span>{count} unread</span> : null}
          </div>
          {status === "error" ? (
            <p className="nca-notif-empty" role="alert">{error}</p>
          ) : (
            <NotificationList items={items} emptyReason="all" onMarkRead={markRead} limit={8} />
          )}
          {inboxHref ? (
            <Link className="nca-notif-bell__view-all" to={inboxHref}>
              View all notifications
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
