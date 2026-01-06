import AppLink from "@/components/nav/AppLink";
// src/components/SidebarPanelExplore.jsx
import React from "react";
import { useParams } from "react-router-dom";
import { track } from "@/utils/analytics.js";

export default function SidebarPanelExplore() {
  const { curriculum } = useParams();
  const cur = (curriculum || "").toLowerCase();

  const onGo = (href, name) => {
    try {
      track("explore_click", { href, name, curriculum: cur }, { silent: true });
    } catch {}
  };

  // If we have a curriculum in the URL, send users straight to its lessons hub.
  // Otherwise, send them to the general curriculum chooser page.
  const lessonsHref = cur ? `/${cur}/lessons` : "/curriculum";

  return (
    <section aria-label="Explore" className="sb-explore">
      <div className="sb-quick" style={{ display: "grid", gap: 8 }}>
        <AppLink
          to="/explore"
          className="sb-quick__item app-nav__item"
          onClick={() => onGo("/career", "career")}
          title="Career Pathways"
        >
          <span className="app-ico" aria-hidden>🧭</span>
          <div style={{ display: "grid" }}>
            <strong className="sb-quick__title">Career Pathways</strong>
            <span className="sb-muted" style={{ fontSize: 12 }}>
              Pick a path, see jobs & pay
            </span>
          </div>
        </AppLink>

        <AppLink
          to={lessonsHref}
          className="sb-quick__item app-nav__item"
          onClick={() => onGo(lessonsHref, "lessons")}
          title="Lessons"
        >
          <span className="app-ico" aria-hidden>🎓</span>
          <div style={{ display: "grid" }}>
            <strong className="sb-quick__title">Lessons</strong>
            <span className="sb-muted" style={{ fontSize: 12 }}>
              Learn by doing, earn micro-certs
            </span>
          </div>
        </AppLink>

        <AppLink
          to="/portfolio"
          className="sb-quick__item app-nav__item"
          onClick={() => onGo("/portfolio", "portfolio")}
          title="Portfolio"
        >
          <span className="app-ico" aria-hidden>🗂️</span>
          <div style={{ display: "grid" }}>
            <strong className="sb-quick__title">Portfolio</strong>
            <span className="sb-muted" style={{ fontSize: 12 }}>
              Showcase artifacts & badges
            </span>
          </div>
        </AppLink>

        <AppLink
          to="/explore"
          className="sb-quick__item app-nav__item"
          onClick={() => onGo("/arcade", "arcade")}
          title="Arcade"
        >
          <span className="app-ico" aria-hidden>🕹️</span>
          <div style={{ display: "grid" }}>
            <strong className="sb-quick__title">Arcade</strong>
            <span className="sb-muted" style={{ fontSize: 12 }}>
              Practice skills through games
            </span>
          </div>
        </AppLink>

        {/* Optional entries—safe, non-curriculum canonical routes */}
        <AppLink
          to="/coach"
          className="sb-quick__item app-nav__item"
          onClick={() => onGo("/coach", "coach")}
          title="Coach Mode"
        >
          <span className="app-ico" aria-hidden>🧑‍🏫</span>
          <div style={{ display: "grid" }}>
            <strong className="sb-quick__title">Coach Mode</strong>
            <span className="sb-muted" style={{ fontSize: 12 }}>
              AI + human instructor tools
            </span>
          </div>
        </AppLink>

        <AppLink
          to="/parent"
          className="sb-quick__item app-nav__item"
          onClick={() => onGo("/parent", "parent")}
          title="Parent Guide"
        >
          <span className="app-ico" aria-hidden>👨‍👩‍👧‍👦</span>
          <div style={{ display: "grid" }}>
            <strong className="sb-quick__title">Parent Guide</strong>
            <span className="sb-muted" style={{ fontSize: 12 }}>
              Coach your learner at home
            </span>
          </div>
        </AppLink>
      </div>

      <hr className="app-hr" />

      <div className="sb-muted" style={{ fontSize: 12 }}>
        Coming soon: personalized recommendations, live events, and “next best action” based on
        your progress.
      </div>
    </section>
  );
}
