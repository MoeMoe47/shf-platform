// src/pages/foundation/PublicApps.jsx
import React from "react";
import "@/styles/apps-gallery.css";
import { foundationApps } from "@/data/apps.registry.js";
import CrossAppLink from "@/components/nav/CrossAppLink.jsx";

export default function PublicApps() {
  // Pick one featured app (flagged in foundationApps)
  const featured =
    foundationApps.find((app) => app.featured) || foundationApps[0];

  const otherApps = foundationApps.filter((app) => app.id !== featured.id);

  return (
    <div className="apps-shell">
      {/* Page header */}
      <header className="apps-header">
        <div className="apps-header-copy">
          <p className="apps-eyebrow">Silicon Heartland</p>
          <h1 className="apps-title">Apps</h1>
          <p className="apps-subtitle">
            Supercharge your experience. Start with one app, then connect the
            full ecosystem across careers, curriculum, arcade, and funding.
          </p>
        </div>

        {/* Simple search box (UI only for now) */}
        <div className="apps-search">
          <input
            type="search"
            placeholder="Search apps"
            aria-label="Search apps"
          />
        </div>
      </header>

      {/* Featured card (big flagship app) */}
      <section className="apps-featured-row">
        <article className={`apps-card apps-card--featured app-${featured.id}`}>
          {/* Top art area – still gradient-based for now */}
          <div className={`app-card-art app-${featured.id}`}>
            <div className="app-card-art-layer" />
            <div className="app-card-art-content">
              <span className="app-pill app-pill--featured">Featured</span>
              <h2>{featured.name}</h2>
              {featured.category && (
                <p className="app-category">{featured.category}</p>
              )}
            </div>
          </div>

          {/* Text + CTA area */}
          <div className="apps-card-body apps-card-body--featured">
            <p className="apps-card-tagline">{featured.tagline}</p>
            <p className="apps-card-help">
              Open the {featured.name} app to explore live dashboards, progress,
              and rewards tied to real-world outcomes.
            </p>

            <div className="apps-card-actions-row">
              <CrossAppLink to={featured.href} className="apps-primary-link">
                Open {featured.name} →
              </CrossAppLink>
              <span className="apps-card-meta">
                Workforce • Silicon Heartland
              </span>
            </div>
          </div>
        </article>
      </section>

      {/* All apps grid */}
      <section className="apps-grid-section">
        <div className="apps-grid-header">
          <h2>All Apps</h2>
          <p>Every app connects back to careers, curriculum, and the EVU ledger.</p>
        </div>

        <div className="apps-grid">
          {otherApps.map((app) => {
            const hasVideo = Boolean(app.video);
            const mediaType = hasVideo ? "video" : "image";
            const mediaSrc = hasVideo ? app.video : app.image;

            return (
              <article key={app.id} className={`apps-card app-${app.id}`}>
                {/* 🔹 BIG MEDIA STRIP ON TOP */}
                <div className="apps-card-media">
                  {mediaType === "video" && mediaSrc ? (
                    <video
                      className="apps-card-media-video"
                      src={mediaSrc}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="auto"
                    />
                  ) : (
                    <img src={mediaSrc} alt={app.name} />
                  )}
                </div>

                {/* 🔹 SMALLER BASE / TEXT AREA */}
                <div className="apps-card-body">
                  <h3>{app.name}</h3>
                  <p className="apps-card-tagline">{app.tagline}</p>

                  <div className="apps-card-footer">
                    {app.category && (
                      <span className="apps-card-pill apps-card-pill--role">
                        {app.category}
                      </span>
                    )}
                    <CrossAppLink to={app.href} className="apps-card-link">
                      Launch app →
                    </CrossAppLink>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
