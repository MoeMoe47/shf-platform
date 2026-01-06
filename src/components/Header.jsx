// src/components/Header.jsx
import React from "react";
import PropTypes from "prop-types";
import { Link, useLocation } from "react-router-dom";
import brandStacked from "@/assets/brand/shf-logo-stacked.svg";
import { readJSON, safeSet } from "@/utils/storage.js";
import AIChat from "@/components/AIChat.jsx";

export default function Header({
  brandSrc = brandStacked,
  brandAlt = "Silicon Heartland",
  breadcrumbs = null,
  onToggleDrawer,
  onToggleCollapse,

  // Personalization/gamification
  level = readJSON("ui.level", "Beginner"),
  levels = ["Beginner", "Intermediate", "Advanced"],
  onChangeLevel,
  progressPct = Number(readJSON("ui.progressPct", 0)) || 0,
  xp = Number(readJSON("ui.xp", 0)) || 0,
  streakDays = Number(readJSON("ui.streak", 0)) || 0,

  // AI coach
  onAiCoachClick, // optional external hook
  aiCoachName = "Billy",
  onUploadClick,
  currentTitle,
}) {
  const location = useLocation();

  /* ---------- sidebar toggles ---------- */
  const toggleDrawer = () => {
    if (typeof onToggleDrawer === "function") return onToggleDrawer();
    document.querySelector(".app-root")?.classList.toggle("drawer-open");
  };
  const toggleCollapse = () => {
    if (typeof onToggleCollapse === "function") return onToggleCollapse();
    const root = document.querySelector(".app-root");
    if (!root) return;
    const nowCollapsed = !root.classList.contains("is-collapsed");
    root.classList.toggle("is-collapsed", nowCollapsed);
    try { localStorage.setItem("app:sidebarCollapsed", nowCollapsed ? "1" : "0"); } catch {}
  };

  /* ---------- global toggles ---------- */
  const [aslFirst, setAslFirst] = React.useState(!!readJSON("ui.aslFirst", false));
  const [contrast, setContrast] = React.useState(!!readJSON("ui.contrast", false));
  React.useEffect(() => {
    safeSet("ui.aslFirst", aslFirst);
    document.documentElement.classList.toggle("asl-first", aslFirst);
  }, [aslFirst]);
  React.useEffect(() => {
    safeSet("ui.contrast", contrast);
    document.documentElement.classList.toggle("theme-contrast", contrast);
  }, [contrast]);

  /* ---------- level chip (state only) ---------- */
  const [curLevel, setCurLevel] = React.useState(level);
  const levelDetailsRef = React.useRef(null);
  function changeLevel(next) {
    setCurLevel(next);
    safeSet("ui.level", next);
    onChangeLevel?.(next);
    try { levelDetailsRef.current?.removeAttribute("open"); } catch {}
  }

  /* ---------- search (⌘/Ctrl-K) ---------- */
  const [search, setSearch] = React.useState("");
  const searchRef = React.useRef(null);
  React.useEffect(() => {
    function onKey(e){
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  function onSearchSubmit(e){
    e.preventDefault();
    try {
      window.dispatchEvent(new CustomEvent("global:search", { detail: { q: search.trim() } }));
    } catch {}
  }

  /* ---------- upload ---------- */
  function handleUpload(){
    if (onUploadClick) return onUploadClick();
    try { window.dispatchEvent(new CustomEvent("ui:open-upload")); } catch {}
  }

  /* ---------- avatar menu ---------- */
  const [openUser, setOpenUser] = React.useState(false);
  const userRef = React.useRef(null);
  React.useEffect(() => {
    function onDocClick(e){ if (openUser && !userRef.current?.contains(e.target)) setOpenUser(false); }
    function onEsc(e){ if (e.key === "Escape") setOpenUser(false); }
    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onDocClick); window.removeEventListener("keydown", onEsc); };
  }, [openUser]);

  /* ---------- progress bump/glow ---------- */
  const pct = Math.max(0, Math.min(100, Number(progressPct) || 0));
  const ringRef = React.useRef(null);
  React.useEffect(() => {
    if (!ringRef.current) return;
    ringRef.current.classList.add("is-bump");
    const t = setTimeout(() => ringRef.current?.classList.remove("is-bump"), 220);
    return () => clearTimeout(t);
  }, [pct]);
  React.useEffect(() => {
    if (!ringRef.current) return;
    ringRef.current.classList.add("is-bump", "is-glow");
    const t = setTimeout(() => ringRef.current?.classList.remove("is-bump", "is-glow"), 700);
    return () => clearTimeout(t);
  }, [aslFirst, contrast]);

  /* ---------- AI Coach panel ---------- */
  const [aiOpen, setAiOpen] = React.useState(false);
  const aiPanelRef = React.useRef(null);

  function openAI(){
    setAiOpen(true);
    onAiCoachClick?.(); // optional analytics/hook
    requestAnimationFrame(() => aiPanelRef.current?.focus());
  }
  function closeAI(){ setAiOpen(false); }

  // Close AI panel on route change to prevent “stuck” overlay
  React.useEffect(() => { if (aiOpen) setAiOpen(false); /* eslint-disable-next-line */ }, [location.pathname]);

  React.useEffect(() => {
    function onEsc(e){ if (e.key === "Escape") setAiOpen(false); }
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  const title = currentTitle || (typeof document !== "undefined" ? (document.title?.split("—")[0] || "") : "");

  return (
    <header className="app-header" role="banner">
      {/* Brand */}
      <div className="app-headerBrand">
        <Link to="/" aria-label="Go to home">
          <img className="app-brandImg" src={brandSrc} alt={brandAlt} />
        </Link>
      </div>

      {/* Right side */}
      <div className="app-headerRight">
        {/* Left cluster */}
        <div className="hdr-left" aria-live="polite">
          <nav aria-label="Breadcrumbs" className="app-breadcrumbs">
            {breadcrumbs || <span>Home</span>}
          </nav>
          {title && <div className="hdr-title" title={title}>{title}</div>}
        </div>

        {/* Middle: progress */}
        <div className="hdr-hero">
          <div
            ref={ringRef}
            className="hd-ring hdr-progress"
            title={`Progress ${pct}%`}
            role="img"
            aria-label={`Progress ${pct}%`}
          >
            <svg className="hdr-ringSvg" viewBox="0 0 56 56" width="48" height="48" aria-hidden="true">
              <circle cx="28" cy="28" r="22" className="hdr-ringBg" />
              <circle cx="28" cy="28" r="22" className="hdr-ringFg" strokeDasharray={`${pct * 1.382} 1000`} transform="rotate(-90 28 28)" />
            </svg>
            <span className="hd-ring__pct hdr-pct" aria-hidden="true">{pct}%</span>
          </div>
          <div className="hdr-stats">
            <div className="hdr-xp" aria-label={`Experience ${xp}`}>XP {xp}</div>
            <div className="hdr-streak" role="status" title={`${streakDays}-day streak`}>
              <span className="hdr-fire" aria-hidden>🔥</span>
              <span className="hdr-streakNum">{streakDays}</span>
              <span className="hdr-streakLabel">day streak</span>
            </div>
          </div>
        </div>

        {/* Right cluster */}
        <form className="app-search hd-search" role="search" onSubmit={onSearchSubmit}>
          <input
            ref={searchRef}
            className="app-search__input"
            type="search"
            placeholder="Search…  ⌘K"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search"
          />
        </form>

        <button
          type="button"
          className="hd-iconBtn"
          aria-pressed={aslFirst}
          aria-label={`ASL-first mode ${aslFirst ? "on" : "off"}`}
          title="ASL-first mode"
          onClick={() => setAslFirst(v => !v)}
        >🤟</button>

        <button
          type="button"
          className="hd-iconBtn"
          aria-pressed={contrast}
          aria-label={`High contrast ${contrast ? "on" : "off"}`}
          title="High contrast"
          onClick={() => setContrast(v => !v)}
        >◑</button>

        {/* AI Coach (opens panel) */}
        <button
          type="button"
          className="ai-btn"
          onClick={openAI}
          title={`Ask ${aiCoachName}`}
          aria-haspopup="dialog"
          aria-expanded={aiOpen}
          aria-controls="ai-panel"
        >
          <span className="ai-avatar" aria-hidden>✨</span>
          <span className="ai-label">{aiCoachName}</span>
        </button>

        {/* Upload */}
        <button type="button" className="sh-btn sh-btn--primary" onClick={handleUpload} title="Upload Artifact">+ Upload</button>

        {/* Avatar */}
        <div className="hd-avatarWrap" ref={userRef}>
          <button className="hd-avatar" aria-haspopup="menu" aria-expanded={openUser} onClick={() => setOpenUser(v => !v)} title="Account">
            <span aria-hidden>M</span><span className="sr-only">Open account menu</span>
          </button>
          {openUser && (
            <div className="hd-menu" role="menu">
              <button role="menuitem" className="hd-menu__item">Profile</button>
              <button role="menuitem" className="hd-menu__item">Settings</button>
              <button role="menuitem" className="hd-menu__item">Sign out</button>
            </div>
          )}
        </div>

        {/* Rail controls */}
        <button type="button" className="sh-btn" onClick={toggleDrawer} aria-label="Toggle sidebar drawer" title="Toggle sidebar">☰</button>
        <button type="button" className="sh-btn sh-btn--secondary" onClick={toggleCollapse} aria-label="Collapse/expand sidebar" title="Collapse / Expand sidebar">⇔</button>
      </div>

      {/* AI Coach Panel + Scrim */}
      <div
        id="ai-panel"
        ref={aiPanelRef}
        className={`ai-panel ${aiOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-panel-title"
        tabIndex={-1}
      >
        <button className="ai-close" aria-label="Close coach panel" onClick={closeAI}>×</button>
        <h2 id="ai-panel-title">{aiCoachName} — AI Coach</h2>
        <p className="muted">Personalized tips, quick feedback, and practice prompts.</p>

        {/* If you want a fully interactive chat, render it here */}
        <div style={{ marginTop: 8, marginBottom: 12 }}>
          <AIChat compact onClose={closeAI} />
        </div>

        {/* Keep your static guidance as quick-start content */}
        <section>
          <h3>Today’s objectives</h3>
          <ul>
            <li>Reinforce key vocabulary</li>
            <li>Practice with a 3-minute micro-exercise</li>
            <li>Log one reflection</li>
          </ul>
        </section>

        <section>
          <h3>Quick practice</h3>
          <blockquote>“Explain your learning goal in one sentence.”</blockquote>
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <button className="btn btn--small btn--secondary">Try prompt</button>
            <button className="btn btn--small btn--primary">Start</button>
          </div>
        </section>

        <section>
          <h3>Ethical anchor</h3>
          <p className="muted">This coach respects your privacy, cites sources, and never replaces instructor judgment.</p>
        </section>
      </div>

      {aiOpen && <div className="ai-scrim" onClick={closeAI} aria-hidden="true" />}
    </header>
  );
}

Header.propTypes = {
  brandSrc: PropTypes.string,
  brandAlt: PropTypes.string,
  breadcrumbs: PropTypes.node,
  onToggleDrawer: PropTypes.func,
  onToggleCollapse: PropTypes.func,
  level: PropTypes.string,
  levels: PropTypes.arrayOf(PropTypes.string),
  onChangeLevel: PropTypes.func,
  progressPct: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  xp: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  streakDays: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onAiCoachClick: PropTypes.func,
  aiCoachName: PropTypes.string,
  onUploadClick: PropTypes.func,
  currentTitle: PropTypes.string,
};
