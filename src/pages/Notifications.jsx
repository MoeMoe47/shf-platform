// NCA-3: thin page wrapper — the canonical inbox now lives in
// src/components/shared/notifications/NotificationInbox.jsx so every
// shell's route mounts the same, single implementation (NCA-D002).
import React from "react";
import NotificationInbox from "@/components/shared/notifications/NotificationInbox.jsx";

export default function Notifications() {
  return <NotificationInbox description="Updates from your learning and Studio activity." />;
}
