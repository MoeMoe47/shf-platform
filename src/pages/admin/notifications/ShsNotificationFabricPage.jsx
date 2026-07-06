import React from "react";
import { SHS_NOTIFICATION_RULES } from "@/system/notification-fabric/shsNotificationRules";
import {
  acknowledgeNotification,
  archiveNotification,
  createEscalationPreview,
  createInternalNotification,
  getNotificationCenterState,
  queueNotificationAlert,
} from "@/system/notification-fabric/shsNotificationCenter";
import "./shsNotificationFabric.css";

export default function ShsNotificationFabricPage() {
  const initialState = React.useMemo(() => getNotificationCenterState(), []);
  const [notifications, setNotifications] = React.useState(initialState.notifications);
  const [metrics, setMetrics] = React.useState(initialState.metrics);
  const [safety, setSafety] = React.useState(initialState.safety);
  const [escalationPreview, setEscalationPreview] = React.useState(initialState.escalation_preview);
  const [selectedType, setSelectedType] = React.useState("governance");

  function refresh() {
    const state = getNotificationCenterState();
    setNotifications([...state.notifications]);
    setMetrics(state.metrics);
    setSafety(state.safety);
    setEscalationPreview(state.escalation_preview);
  }

  function handleCreateNotification() {
    const result = createInternalNotification({ alert_type: selectedType });
    setNotifications([...result.notifications]);
    setSafety(result.safety);
    setMetrics(getNotificationCenterState().metrics);
  }

  function handleAction(action, notification) {
    if (action === "queue") queueNotificationAlert(notification.notification_id);
    if (action === "acknowledge") acknowledgeNotification(notification.notification_id);
    if (action === "archive") archiveNotification(notification.notification_id);
    if (action === "escalate") setEscalationPreview(createEscalationPreview(notification));
    refresh();
  }

  const alertQueue = notifications.filter((item) => ["queued", "blocked", "escalation_preview"].includes(item.status));

  return (
    <main className="shs-notification-page">
      <section className="notification-hero">
        <div>
          <p>SHS BOS Notification & Alert Fabric V1</p>
          <h1>Notifications</h1>
          <span>Internal admin-only operator awareness for governance, readiness, reports, agents, workflows, persistence, tracking, registry, scheduler, and system alerts.</span>
        </div>
        <div className="notification-actions">
          <button type="button" onClick={handleCreateNotification}>Create Internal Notification</button>
          <button type="button" onClick={refresh}>Refresh Inbox</button>
        </div>
      </section>

      <section className="notification-toolbar">
        <label>
          Alert type
          <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
            {SHS_NOTIFICATION_RULES.map((rule) => (
              <option key={rule.alert_type} value={rule.alert_type}>{rule.label}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="notification-grid">
        <section className="notification-panel overview">
          <div className="panel-heading"><p>Overview</p><h2>Internal Notification Inbox</h2></div>
          <div className="metric-row">
            <article><span>Total</span><strong>{metrics.total_notifications}</strong></article>
            <article><span>Inbox</span><strong>{metrics.inbox_count}</strong></article>
            <article><span>Queued</span><strong>{metrics.queued_count}</strong></article>
            <article><span>Blocked</span><strong>{metrics.blocked_count}</strong></article>
          </div>
        </section>

        <section className="notification-panel rules">
          <div className="panel-heading"><p>Severity</p><h2>Alert Rules</h2></div>
          <div className="rule-list">
            {SHS_NOTIFICATION_RULES.map((rule) => (
              <article key={rule.alert_type}>
                <strong>{rule.label}</strong>
                <span>{rule.severity} - {rule.owner_layer}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="notification-panel inbox">
          <div className="panel-heading"><p>Inbox</p><h2>Internal Notifications</h2></div>
          <div className="notification-list">
            {notifications.map((notification) => (
              <article key={notification.notification_id}>
                <div>
                  <strong>{notification.title}</strong>
                  <span>{notification.alert_type} - {notification.severity} - {notification.status}</span>
                  <small>{notification.delivery_mode} - {notification.visibility}</small>
                </div>
                <div className="notification-row-actions">
                  <button type="button" onClick={() => handleAction("queue", notification)}>Queue Alert</button>
                  <button type="button" onClick={() => handleAction("escalate", notification)}>Escalation Preview</button>
                  <button type="button" onClick={() => handleAction("acknowledge", notification)}>Acknowledge</button>
                  <button type="button" onClick={() => handleAction("archive", notification)}>Archive</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="notification-panel queue">
          <div className="panel-heading"><p>Queue</p><h2>Alert Queue</h2></div>
          {alertQueue.length === 0 && <p className="empty-state">No queued or blocked alerts.</p>}
          {alertQueue.map((alert) => (
            <article key={alert.notification_id}><strong>{alert.title}</strong><span>{alert.status} - {alert.severity}</span></article>
          ))}
        </section>

        <section className="notification-panel escalation">
          <div className="panel-heading"><p>Escalation</p><h2>Escalation Preview</h2></div>
          <strong>{escalationPreview.severity}</strong>
          <ol>
            {(escalationPreview.preview_path || []).map((step) => <li key={step}>{step}</li>)}
          </ol>
          <span>External delivery: {String(escalationPreview.external_delivery)}</span>
        </section>

        <section className="notification-panel safety">
          <div className="panel-heading"><p>Safety</p><h2>Blocked External Delivery</h2></div>
          <p>{safety.safety_copy}</p>
          <strong>External delivery blocked: {String(!safety.safe)}</strong>
          <div className="safety-flags">
            {Object.entries(safety.dangerous_capabilities).map(([flag, enabled]) => (
              <span key={flag}>{flag}: {String(enabled)}</span>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
