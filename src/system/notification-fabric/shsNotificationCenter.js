import { SHS_NOTIFICATION_RULES } from "./shsNotificationRules";
import {
  acknowledgeNotification,
  archiveNotification,
  createInternalNotification,
  getNotifications,
  loadSeedNotifications,
} from "./shsNotificationStorage";
import { queueNotificationAlert, getAlertQueue } from "./shsAlertQueue";
import { createEscalationPreview } from "./shsEscalationRules";
import { createBlockedExternalDeliveryPreview } from "./shsNotificationSafety";
import { calculateNotificationMetrics } from "./shsNotificationMetrics";

export function getNotificationCenterState() {
  const notifications = loadSeedNotifications();
  const safety = createBlockedExternalDeliveryPreview();
  return {
    notifications,
    alert_queue: getAlertQueue(notifications),
    rules: SHS_NOTIFICATION_RULES,
    escalation_preview: createEscalationPreview(notifications[0] || {}),
    safety,
    metrics: calculateNotificationMetrics(notifications),
  };
}

export {
  acknowledgeNotification,
  archiveNotification,
  createEscalationPreview,
  createInternalNotification,
  getAlertQueue,
  getNotifications,
  queueNotificationAlert,
};

