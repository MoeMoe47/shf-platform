import React from "react";
import { domainLabelForType, urgencyLabel } from "./domainLabels.js";
import { isSafeInternalPath } from "./safeLinks.js";

function formatTimestamp(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function NotificationItem({ item, onMarkRead, onArchive, showOrganization = false }) {
  const isUnread = item.status === "UNREAD";
  const safeHref = isSafeInternalPath(item.destinationPath) ? item.destinationPath : null;
  const timestamp = formatTimestamp(item.createdAt);

  function handleOpen() {
    if (isUnread) onMarkRead?.(item);
  }

  return (
    <li className={`nca-notif-item${isUnread ? " is-unread" : ""}`}>
      <div className="nca-notif-item__marker" aria-hidden="true" />
      <div className="nca-notif-item__body">
        <div className="nca-notif-item__meta">
          <span className="nca-notif-item__domain">{domainLabelForType(item.type)}</span>
          <span className={`nca-notif-item__urgency nca-notif-item__urgency--${item.urgency || "notice"}`}>
            {urgencyLabel(item.urgency)}
          </span>
          {item.actionRequired ? <span className="nca-notif-item__action-badge">Action required</span> : null}
          {showOrganization && item.organizationId ? (
            <span className="nca-notif-item__org">Org: {item.organizationId}</span>
          ) : null}
        </div>
        <strong className="nca-notif-item__title">{item.title}</strong>
        <p className="nca-notif-item__message">{item.message}</p>
        <div className="nca-notif-item__footer">
          {timestamp ? <time dateTime={item.createdAt}>{timestamp}</time> : null}
          <span className="nca-notif-item__status">
            {isUnread ? "Unread" : item.status === "ARCHIVED" ? "Archived" : "Read"}
          </span>
        </div>
      </div>
      <div className="nca-notif-item__actions">
        {safeHref ? (
          <a className="nca-notif-item__link" href={safeHref} onClick={handleOpen}>
            Open
          </a>
        ) : null}
        {isUnread ? (
          <button type="button" className="nca-notif-item__mark-read" onClick={() => onMarkRead?.(item)}>
            Mark read
          </button>
        ) : null}
        {onArchive && item.status !== "ARCHIVED" ? (
          <button type="button" className="nca-notif-item__archive" onClick={() => onArchive(item)}>
            Archive
          </button>
        ) : null}
      </div>
    </li>
  );
}
