import { createNotification } from "./shsNotificationTypes";
import { getNotificationRule } from "./shsNotificationRules";
import { scanNotificationSafety } from "./shsNotificationSafety";

const NOTIFICATION_STORAGE_KEY = "shs_bos_notification_fabric_v1_notifications";

function readNotifications() {
  if (typeof localStorage === "undefined") return [];
  try {
    const value = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function writeNotifications(notifications) {
  if (typeof localStorage === "undefined") return notifications;
  localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
  return notifications;
}

export function getNotifications() {
  return readNotifications();
}

export function createInternalNotification(input = {}) {
  const rule = getNotificationRule(input.alert_type || "system");
  const draft = createNotification({
    alert_type: rule.alert_type,
    title: input.title || rule.label,
    source_layer: input.source_layer || rule.owner_layer,
    severity: input.severity || rule.severity,
    message: input.message || `${rule.label} created for local operator awareness.`,
    payload: input.payload || { internal_awareness: true, external_delivery: false },
    operator_note: input.operator_note || "Local notification created.",
  });
  const safety = scanNotificationSafety(draft);
  const notification = { ...draft, safety_status: safety.safety_status, status: safety.safe ? "inbox" : "blocked" };
  return {
    notification,
    notifications: writeNotifications([notification, ...readNotifications()].slice(0, 80)),
    safety,
  };
}

export function queueAlert(notificationId) {
  const notifications = readNotifications().map((item) =>
    item.notification_id === notificationId ? { ...item, status: "queued", updated_at: new Date().toISOString() } : item
  );
  return writeNotifications(notifications);
}

export function acknowledgeNotification(notificationId) {
  const notifications = readNotifications().map((item) =>
    item.notification_id === notificationId ? { ...item, status: "acknowledged", updated_at: new Date().toISOString() } : item
  );
  return writeNotifications(notifications);
}

export function archiveNotification(notificationId) {
  const notifications = readNotifications().map((item) =>
    item.notification_id === notificationId ? { ...item, status: "archived", updated_at: new Date().toISOString() } : item
  );
  return writeNotifications(notifications);
}

export function loadSeedNotifications() {
  const existing = readNotifications();
  if (existing.length) return existing;
  return createInternalNotification({
    alert_type: "scheduler",
    title: "Scheduler local review alert",
    message: "Scheduler has a local job ready for operator review.",
  }).notifications;
}

