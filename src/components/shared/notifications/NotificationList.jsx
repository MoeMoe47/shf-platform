import React from "react";
import NotificationItem from "./NotificationItem.jsx";
import NotificationEmptyState from "./NotificationEmptyState.jsx";

export default function NotificationList({ items, emptyReason = "all", onMarkRead, onArchive, showOrganization = false, limit }) {
  const visible = typeof limit === "number" ? items.slice(0, limit) : items;
  if (!visible.length) return <NotificationEmptyState reason={emptyReason} />;
  return (
    <ul className="nca-notif-list">
      {visible.map((item) => (
        <NotificationItem
          key={item.notificationId}
          item={item}
          onMarkRead={onMarkRead}
          onArchive={onArchive}
          showOrganization={showOrganization}
        />
      ))}
    </ul>
  );
}
