// Route: /civic.html#/notifications (via CivicRoutes.jsx → CivicLayout)
//
// NCA-3: Civic Lab's canonical inbox destination — the same shared
// NotificationInbox every shell consumes (NCA-D002), replacing the
// previous static "0 new, no live feed" bell dialog.
import React from "react";
import NotificationInbox from "@/components/shared/notifications/NotificationInbox.jsx";

export default function CivicNotifications() {
  return <NotificationInbox description="Updates across Civic Lab and your ecosystem activity." />;
}
