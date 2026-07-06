import { getNotifications, queueAlert } from "./shsNotificationStorage";

export function getAlertQueue(notifications = getNotifications()) {
  return notifications.filter((item) => ["queued", "blocked", "escalation_preview"].includes(item.status));
}

export function queueNotificationAlert(notificationId) {
  return queueAlert(notificationId);
}

