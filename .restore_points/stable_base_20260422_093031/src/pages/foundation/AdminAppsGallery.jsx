// src/pages/foundation/AdminAppsGallery.jsx
import React from "react";
import "@/styles/apps-gallery.css";
import CrossAppLink from "@/components/nav/CrossAppLink.jsx";
import { adminDashboards } from "@/data/admin.apps.js";

export default function AdminAppsGallery() {
  // first card is the big "featured" dashboard
  const [featured, ...rest] = adminDashboards;

  return (
    <div className="apps-shell apps-shell--admin">
      {/* Hero + featured dashboard */}
      <section className="apps-hero">
        <div className="apps-hero-copy">
          <h1>Admin App Gallery</h1>
          <p className="apps-hero-tagline">
            Jump into placement, funding, and impact dashboards in one place.
            These views are designed for admins, board, and investors.
          </p>
        </div>

        {featured && (
          <article className="apps-featured apps-featured--admin">
            <div className="apps-featured-card apps-card apps-card--admin">
              <div className="apps-card-media">
                <div
                  className="apps-card-media-img"
                  style={{ backgroundImage: `url(${featured.image})` }}
                />
              </div>
              <div className="apps-card-body">
                {featured.role && (
                  <div className="apps-card-pill apps-card-pill--role">
                    {featured.role}
                  </div>
                )}
                <h2>{featured.name}</h2>
                <p className="apps-card-tagline">{featured.tagline}</p>
              </div>
              <div className="apps-card-actions">
                <CrossAppLink to={featured.href} className="apps-card-link">
                  Open dashboard →
                </CrossAppLink>
              </div>
            </div>
          </article>
        )}
      </section>

      {/* Other dashboards grid */}
      <section className="apps-grid-section apps-grid-section--admin">
        <div className="apps-grid-header">
          <h2>All Admin Dashboards</h2>
          <p className="apps-grid-subtitle">
            Placement, investor, attribution, and data tools wired to the
            Silicon Heartland ledger.
          </p>
        </div>

        <div className="apps-grid apps-grid--admin">
          {rest.map((card) => (
            <article
              key={card.id}
              className="apps-card apps-card--admin apps-card--compact"
            >
              <div className="apps-card-media">
                <div
                  className="apps-card-media-img"
                  style={{ backgroundImage: `url(${card.image})` }}
                />
              </div>

              <div className="apps-card-body">
                {card.role && (
                  <div className="apps-card-pill apps-card-pill--role">
                    {card.role}
                  </div>
                )}
                <h3>{card.name}</h3>
                <p className="apps-card-tagline">{card.tagline}</p>
              </div>

              <div className="apps-card-actions">
                <CrossAppLink to={card.href} className="apps-card-link">
                  Open dashboard →
                </CrossAppLink>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
