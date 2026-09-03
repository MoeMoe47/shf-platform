import React from "react";
import { useUser } from "@/context/UserContext.jsx";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/notifications/api.js";

export default function Notifications() {
  const { role } = useUser();
  const [state, setState] = React.useState({ status: "loading", items: [], error: "" });
  const load = React.useCallback(() => {
    setState((current) => ({ ...current, status: "loading", error: "" }));
    listNotifications(role).then((data) => setState({ status: "ready", items: data.items || [], error: "" })).catch(() => setState({ status: "error", items: [], error: "Notifications are temporarily unavailable." }));
  }, [role]);
  React.useEffect(() => load(), [load]);
  async function read(item) {
    if (item.status !== "UNREAD") return;
    await markNotificationRead(role, item.notificationId);
    setState((current) => ({ ...current, items: current.items.map((candidate) => candidate.notificationId === item.notificationId ? { ...candidate, status: "READ" } : candidate) }));
  }
  async function readAll() {
    await markAllNotificationsRead(role);
    setState((current) => ({ ...current, items: current.items.map((item) => ({ ...item, status: "READ" })) }));
  }
  return <main className="ops-page" aria-labelledby="notifications-heading">
    <header className="ops-header"><div><p className="ops-eyebrow">Inbox</p><h1 id="notifications-heading">Notifications</h1><p>Updates from your learning and Studio activity.</p></div><div><button type="button" className="ops-secondary" onClick={load}>Refresh</button>{state.items.some((item) => item.status === "UNREAD") && <button type="button" className="ops-secondary" onClick={readAll}>Mark all read</button>}</div></header>
    {state.status === "loading" && <p className="ops-status" role="status">Loading notifications…</p>}
    {state.status === "error" && <div className="ops-error" role="alert"><strong>Notifications unavailable</strong><span>{state.error}</span><button type="button" onClick={load}>Retry</button></div>}
    {state.status === "ready" && <section className="ops-panel" aria-labelledby="notification-list-heading"><div className="ops-panel-head"><h2 id="notification-list-heading">Your notifications</h2><span>{state.items.filter((item) => item.status === "UNREAD").length} unread</span></div>{state.items.length ? <ul className="notification-list">{state.items.map((item) => <li key={item.notificationId} className={item.status === "UNREAD" ? "is-unread" : ""}><div><strong>{item.title}</strong><p>{item.message}</p><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time><span className="notification-status">{item.status}</span></div>{item.destinationPath && <a className="ops-secondary" href={item.destinationPath} onClick={() => read(item)}>Open</a>}{item.status === "UNREAD" && <button type="button" className="ops-secondary" onClick={() => read(item)}>Mark read</button>}</li>)}</ul> : <p className="ops-empty">No notifications yet.</p>}</section>}
  </main>;
}
