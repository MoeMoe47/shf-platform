import React from "react";

// NCA-3 §17: honest, specific empty states — never a generic
// "nothing here" that could be mistaken for a loading/error state, and
// never implies data exists but is hidden.
const MESSAGES = {
  all: "No notifications yet.",
  unread: "No unread notifications.",
  action_required: "No action-required items right now.",
  organization: "No notifications for the selected organization.",
};

export default function NotificationEmptyState({ reason = "all" }) {
  return (
    <p className="nca-notif-empty" role="status">
      {MESSAGES[reason] || MESSAGES.all}
    </p>
  );
}
