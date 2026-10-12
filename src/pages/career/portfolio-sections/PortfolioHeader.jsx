// src/pages/career/portfolio-sections/PortfolioHeader.jsx
import React from "react";
import { SearchIcon, BellIcon, ChevronDownIcon } from "@/components/curriculum/icons.jsx";

export default function PortfolioHeader({ onSearch, onShare, onExport, shareStatus }) {
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
      <div className="sp-headerCopy">
        <nav className="sp-breadcrumb" aria-label="Breadcrumb">
          <a href="/career.html#/portfolio">Portfolio</a>
          <span aria-hidden="true">›</span>
          <span>Student</span>
        </nav>
        <div className="sp-titleRow">
          <span className="sp-titleIcon" aria-hidden="true">✣</span>
          <h1 id="portfolio-v1-heading" className="sp-h1">Student Portfolio</h1>
        </div>
        <p className="sp-subtitle">Evidence-backed learner profile across curriculum, projects, skills, credentials, and verified achievements.</p>
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

        <button type="button" className="sp-btn sp-btnPrimary" onClick={onShare}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="6" cy="12" r="2.5" />
            <circle cx="18" cy="6" r="2.5" />
            <circle cx="18" cy="18" r="2.5" />
            <path d="M8.2 10.8 15.8 7M8.2 13.2l7.6 3.8" />
          </svg>
          Share Portfolio
        </button>
        <button type="button" className="sp-btn sp-btnSecondary" onClick={onExport}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M5 21h14" />
          </svg>
          Export PDF
        </button>
        <span className="sp-shareStatus" role="status" aria-live="polite">{shareStatus}</span>
      </div>
    </header>
  );
}
