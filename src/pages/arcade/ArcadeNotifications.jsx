// Route: /arcade.html#/notifications (via ArcadeRoutes.jsx → ArcadeLayout)
//
// NCA-3: the Arcade's canonical inbox destination — the same shared
// NotificationInbox every shell consumes (NCA-D002), replacing the
// previous static "0 new, no live feed" bell dialog.
import React from "react";
import NotificationInbox from "@/components/shared/notifications/NotificationInbox.jsx";

export default function ArcadeNotifications() {
  return <NotificationInbox description="Updates across the Learning Arcade and your ecosystem activity." />;
}
