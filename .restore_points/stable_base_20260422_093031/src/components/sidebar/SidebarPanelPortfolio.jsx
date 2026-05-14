import AppLink from "@/components/nav/AppLink";
// src/components/SidebarPanelPortfolio.jsx
import React from "react";
import { useParams } from "react-router-dom";
import { track } from "@/utils/analytics.js";

function safeReadJSON(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

export default function SidebarPanelPortfolio() {
  const { curriculum } = useParams();
  const cur = (curriculum || "").toLowerCase();

  // Load portfolio items from localStorage
  const [items, setItems] = React.useState(() =>
    safeReadJSON("portfolio:items", [])
  );

  React.useEffect(() => {
    const onStorage = (e) => {
      if (!e || !e.key) return;
      if (e.key.startsWith("portfolio:")) {
        setItems(safeReadJSON("portfolio:items", []));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Recent (max 5)
  const recent = items
    .slice()
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, 5);

  const lessonsHref = cur ? `/${cur}/lessons` : "/curriculum";

  const onGo = (href, name) => {
    try {
      track(
        "portfolio_panel_click",
        { href, name, curriculum: cur },
        { silent: true }
      );
    } catch {}
  };

  return (
    <section aria-label="Portfolio" className="sb-portfolio" style={{ display: "grid", gap: 8 }}>
      {/* Quick actions */}
      <div className="sb-quick" style={{ display: "grid", gap: 8 }}>
        <AppLink
          to="/portfolio"
          className="sb-quick__item app-nav__item"
          onClick={() => onGo("/portfolio", "open_portfolio")}
          title="Open Portfolio"
        >
          <span className="app-ico" aria-hidden>🗂️</span>
          <div style={{ display: "grid" }}>
            <strong className="sb-quick__title">Open Portfolio</strong>
            <span className="sb-muted" style={{ fontSize: 12 }}>
              View artifacts, reflections, badges
            </span>
          </div>
        </AppLink>

        <AppLink
          to={lessonsHref}
          className="sb-quick__item app-nav__item"
          onClick={() => onGo(lessonsHref, "add_from_lesson")}
          title="Add from a lesson"
        >
          <span className="app-ico" aria-hidden>📖</span>
          <div style={{ display: "grid" }}>
            <strong className="sb-quick__title">Add from a lesson</strong>
            <span className="sb-muted" style={{ fontSize: 12 }}>
              Create an artifact as you learn
            </span>
          </div>
        </AppLink>

        <AppLink
          to="/portfolio"
          className="sb-quick__item app-nav__item"
          onClick={() => onGo("/career", "align_to_path")}
          title="Align to a career path"
        >
          <span className="app-ico" aria-hidden>🧭</span>
          <div style={{ display: "grid" }}>
            <strong className="sb-quick__title">Align to a career path</strong>
            <span className="sb-muted" style={{ fontSize: 12 }}>
              Map artifacts to in-demand skills
            </span>
          </div>
        </AppLink>
      </div>

      <hr className="app-hr" />

      {/* Progress summary */}
      <div className="sb-course__sum">
        <span className="app-ico" aria-hidden>🎖️</span>
        <strong>Portfolio Progress</strong>
        <span className="sb-badge">{items.length} items</span>
      </div>

      {/* Recent artifacts */}
      {items.length === 0 ? (
        <div className="sb-muted">
          No artifacts yet. Start a lesson and create your first artifact.
        </div>
      ) : (
        <ol className="sb-lessons">
          {recent.map((it) => (
            <li key={it.id || it.title} className="sb-row">
              <AppLink
                to="/portfolio"
                className="app-nav__item"
                title={it.title || "Untitled artifact"}
                onClick={() => onGo("/portfolio", "open_recent")}
              >
                <span className="app-ico" aria-hidden>📌</span>
                <span className="sb-lessonTitle">
                  {it.title || "Untitled artifact"}
                </span>
                <span className="sb-min">
                  {it.updatedAt ? new Date(it.updatedAt).toLocaleDateString() : ""}
                </span>
              </AppLink>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
