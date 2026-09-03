// src/components/curriculum/CurriculumHeader.jsx
import React from "react";
import { href as HREFS } from "@/router/paths.js";
import { SearchIcon, BellIcon, ChevronDownIcon } from "./icons.jsx";
import CurriculumThemeSwitch from "./CurriculumThemeSwitch.jsx";
import { useUser } from "@/context/UserContext.jsx";
import { listNotifications, markNotificationRead } from "@/lib/notifications/api.js";

const PATHWAY_OPTIONS = [
  { value: "career", label: "Career", href: HREFS.career("/planner") },
  { value: "asl", label: "ASL", to: "/curriculum/asl/dashboard" },
];

export default function CurriculumHeader({
  title = "Learning Dashboard",
  subtitle = "Continue your pathway and stay on track.",
  onSearch,
}) {
  const [query, setQuery] = React.useState("");
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [pathway, setPathway] = React.useState("career");
  const { role } = useUser();
  const notifRef = React.useRef(null);
  const [notifications, setNotifications] = React.useState([]);
  const [notificationError, setNotificationError] = React.useState("");

  React.useEffect(() => {
    if (!notifOpen) return;
    const onDocClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setNotifOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [notifOpen]);

  React.useEffect(() => {
    let cancelled = false;
    listNotifications(role).then((data) => data.items || [])
      .then((items) => { if (!cancelled) setNotifications(items); })
      .catch(() => { if (!cancelled) setNotificationError("Notifications are temporarily unavailable."); });
    return () => { cancelled = true; };
  }, [role]);

  const hasUnread = notifications.some((item) => item.status === "UNREAD");
  async function markNotificationRead(item) {
    if (item.status !== "UNREAD") return;
    await markNotificationRead(role, item.notificationId);
    setNotifications((current) => current.map((candidate) => candidate.notificationId === item.notificationId ? { ...candidate, status: "READ" } : candidate));
  }

  function handleSearchChange(e) {
    const v = e.target.value;
    setQuery(v);
    onSearch?.(v);
  }

  function handlePathwayChange(e) {
    const value = e.target.value;
    setPathway(value);
    const opt = PATHWAY_OPTIONS.find((o) => o.value === value);
    if (!opt) return;
    if (opt.href) {
      window.location.href = opt.href;
    } else if (opt.to) {
      window.location.hash = `#${opt.to}`;
    }
  }

  return (
    <header className="ld-headerBar">
      <div className="ld-header">
        {title ? (
          <div className="ld-headerTitles">
            <h1 className="ld-h1">{title}</h1>
            {subtitle && <p className="ld-subtitle">{subtitle}</p>}
          </div>
        ) : (
          <div className="ld-headerTitles" aria-hidden="true" />
        )}

        <div className="ld-headerControls">
          <div className="ld-search">
            <SearchIcon size={18} className="ld-searchIcon" />
            <label htmlFor="curriculum-search" className="ld-srOnly">
              Search lessons, assignments, and more
            </label>
            <input
              id="curriculum-search"
              type="search"
              className="ld-searchInput"
              placeholder="Search lessons, assignments, and more..."
              value={query}
              onChange={handleSearchChange}
              autoComplete="off"
            />
          </div>

          <CurriculumThemeSwitch />

          <div className="ld-notifWrap" ref={notifRef}>
            <button
              type="button"
              className="ld-iconBtn"
              aria-haspopup="true"
              aria-expanded={notifOpen}
              aria-label={hasUnread ? "Notifications, unread notifications available" : "Notifications"}
              onClick={() => {
                setNotifOpen((v) => !v);
              }}
            >
              <BellIcon size={19} />
              {hasUnread && <span className="ld-unreadDot" aria-hidden="true" />}
            </button>
            {notifOpen && (
              <div className="ld-notifPanel" role="dialog" aria-label="Notifications">
                <div className="ld-notifPanelHead"><strong>Notifications</strong>{hasUnread && <span>{notifications.filter((item) => item.status === "UNREAD").length} unread</span>}</div>
                {notificationError ? <p className="ld-notifEmpty" role="alert">{notificationError}</p> : notifications.length ? <ul className="ld-notifList">{notifications.slice(0, 8).map((item) => <li key={item.notificationId} className={item.status === "UNREAD" ? "is-unread" : ""}><div><strong>{item.title}</strong><p>{item.message}</p><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time></div>{item.destinationPath && <a href={item.destinationPath} onClick={() => markNotificationRead(item)}>Open</a>}</li>)}</ul> : <p className="ld-notifEmpty">No notifications yet.</p>}
                {notifications.length > 8 && <a className="ld-notifAll" href="/curriculum/notifications">View all notifications</a>}
              </div>
            )}
          </div>

          <div className="ld-pathwaySelect">
            <label htmlFor="curriculum-pathway" className="ld-srOnly">
              Pathway
            </label>
            <select
              id="curriculum-pathway"
              className="ld-pathwaySelectInput"
              value={pathway}
              onChange={handlePathwayChange}
            >
              {PATHWAY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon size={16} className="ld-pathwayChevron" />
          </div>
        </div>
      </div>
    </header>
  );
}
