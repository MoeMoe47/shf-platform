import { SHS_ALERT_TYPES } from "./shsNotificationTypes";

export function calculateNotificationMetrics(notifications = []) {
  return {
    total_notifications: notifications.length,
    inbox_count: notifications.filter((item) => item.status === "inbox").length,
    queued_count: notifications.filter((item) => item.status === "queued").length,
    blocked_count: notifications.filter((item) => item.status === "blocked").length,
    acknowledged_count: notifications.filter((item) => item.status === "acknowledged").length,
    alert_type_count: SHS_ALERT_TYPES.length,
    by_type: SHS_ALERT_TYPES.map((type) => ({
      alert_type: type,
      count: notifications.filter((item) => item.alert_type === type).length,
    })),
  };
}

