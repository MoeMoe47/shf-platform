import React from "react";
import { SeaAttention } from "@/components/sea/SeaDashboardPrimitives.jsx";
import { useNotificationInbox, NOTIFICATION_FILTERS } from "./useNotifications.js";
import { domainLabelForType } from "./domainLabels.js";

// NCA-3 §14/§35: the reusable attention-projection component intended for
// a future EXR ATTENTION_PROJECTION_SLOT. This is NCA's data projected
// through the *existing* SeaAttention presentation primitive (owned by
// SEA/EXR) — not a second attention store, and not a new attention UI.
// EXR decides where this renders; NCA only supplies correct data.
export default function NotificationAttentionProjection({ organizationId }) {
  const { status, items } = useNotificationInbox({ organizationId, filter: NOTIFICATION_FILTERS.ACTION_REQUIRED });

  const sourceStatus = status === "error" ? "UNAVAILABLE" : status === "loading" ? "PARTIAL" : "AVAILABLE";
  const seaItems = items.map((item) => ({
    type: "ACTION_REQUIRED",
    label: item.title,
    reason: item.message,
    owner: domainLabelForType(item.type),
    href: item.destinationPath || undefined,
    actionLabel: "Open",
  }));

  return <SeaAttention items={seaItems} sourceStatus={sourceStatus} />;
}
