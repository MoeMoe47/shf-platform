// src/components/curriculum/CurriculumHeader.jsx
import React from "react";
import { href as HREFS } from "@/router/paths.js";
import { SearchIcon, BellIcon, ChevronDownIcon } from "./icons.jsx";
import CurriculumThemeSwitch from "./CurriculumThemeSwitch.jsx";

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
  const notifRef = React.useRef(null);
  const [hasUnread, setHasUnread] = React.useState(true);

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
                setHasUnread(false);
              }}
            >
              <BellIcon size={19} />
              {hasUnread && <span className="ld-unreadDot" aria-hidden="true" />}
            </button>
            {notifOpen && (
              <div className="ld-notifPanel" role="dialog" aria-label="Notifications">
                <p className="ld-notifEmpty">You're all caught up — no new notifications.</p>
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
