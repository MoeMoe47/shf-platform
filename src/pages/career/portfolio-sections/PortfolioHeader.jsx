// src/pages/career/portfolio-sections/PortfolioHeader.jsx
import React from "react";
import { SearchIcon, BellIcon, ChevronDownIcon } from "@/components/curriculum/icons.jsx";

export default function PortfolioHeader({ onSearch }) {
  const [query, setQuery] = React.useState("");
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [hasUnread, setHasUnread] = React.useState(true);
  const [pathway, setPathway] = React.useState("AI & Web Development");
  const notifRef = React.useRef(null);

  React.useEffect(() => {
    if (!notifOpen) return;
    const onDocClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setNotifOpen(false);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [notifOpen]);

  function handleSearchChange(e) {
    setQuery(e.target.value);
    onSearch?.(e.target.value);
  }

  return (
    <header className="sp-header">
      <div>
        <h1 className="sp-h1">Student Portfolio</h1>
        <p className="sp-subtitle">Showcase your progress, projects, and career readiness.</p>
      </div>

      <div className="sp-headerControls">
        <div className="sp-search">
          <SearchIcon size={18} className="sp-searchIcon" />
          <label htmlFor="portfolio-search" className="sp-srOnly">
            Search portfolio
          </label>
          <input
            id="portfolio-search"
            type="search"
            className="sp-searchInput"
            placeholder="Search portfolio..."
            value={query}
            onChange={handleSearchChange}
            autoComplete="off"
          />
        </div>

        <div className="sp-notifWrap" ref={notifRef}>
          <button
            type="button"
            className="sp-iconBtn"
            aria-haspopup="true"
            aria-expanded={notifOpen}
            aria-label={hasUnread ? "Notifications, unread notifications available" : "Notifications"}
            onClick={() => {
              setNotifOpen((v) => !v);
              setHasUnread(false);
            }}
          >
            <BellIcon size={19} />
            {hasUnread && <span className="sp-unreadDot" aria-hidden="true" />}
          </button>
          {notifOpen && (
            <div className="sp-notifPanel" role="dialog" aria-label="Notifications">
              <p className="sp-notifEmpty">You're all caught up — no new notifications.</p>
            </div>
          )}
        </div>

        <div className="sp-pathwaySelect">
          <label htmlFor="portfolio-pathway" className="sp-srOnly">
            Pathway
          </label>
          <select
            id="portfolio-pathway"
            className="sp-pathwaySelectInput"
            value={pathway}
            onChange={(e) => setPathway(e.target.value)}
          >
            <option value="AI & Web Development">AI &amp; Web Development</option>
          </select>
          <ChevronDownIcon size={16} className="sp-pathwayChevron" />
        </div>
      </div>
    </header>
  );
}
