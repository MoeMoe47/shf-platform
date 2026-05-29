import React from "react";
import "./hub-growth-placeholder.css";

const navItems = [
  ["⌂", "Hub", "#/hub"],
  ["◎", "Network", "#/hub/network"],
  ["◇", "Intake", "#/hub/intake"],
  ["▤", "Queue", "#/hub/queue"],
  ["↻", "Life", "#/hub/lifecycle"],
  ["✦", "Growth", "#/hub/growth-network"],
  ["◉", "Intel", "#/hub/intelligence"],
  ["▦", "Bundles", "#/hub/bundles"],
  ["↗", "Opps", "#/hub/opportunities"],
  ["$", "Sales", "#/hub/sales-pipeline"],
  ["▧", "Reports", "#/hub/reports"],
];

function go(hash) {
  window.location.hash = hash;
}

export default function HubGrowthPlaceholder({
  active = "Intel",
  eyebrow = "SHS HUB INTELLIGENCE",
  title = "Hub Intelligence Page",
  subtitle = "This route is now wired. The full V1 surface will be built in the next sprint.",
  cards = [],
}) {
  return (
    <main className="hgp-shell">
      <aside className="hgp-rail">
        <button className="hgp-logo" onClick={() => go("#/hub")} aria-label="Go to SHS Hub">
          <img src="/assets/shs/shs-orbiter-logo.png" alt="SHS" onError={(event) => { event.currentTarget.style.display = "none"; }} />
          <span>SHS</span>
        </button>

        <nav className="hgp-nav" aria-label="Hub navigation">
          {navItems.map(([icon, label, hash]) => (
            <button
              key={label}
              className={label === active ? "is-active" : ""}
              onClick={() => go(hash)}
            >
              <span>{icon}</span>
              <small>{label}</small>
            </button>
          ))}
        </nav>

        <div className="hgp-readiness">
          <strong>INTEL</strong>
          <div>72%</div>
          <span>Queued</span>
        </div>
      </aside>

      <section className="hgp-page">
        <header className="hgp-header">
          <p>{eyebrow}</p>
          <h1>{title}</h1>
          <span>{subtitle}</span>
        </header>

        <section className="hgp-grid">
          <article className="hgp-panel">
            <h2>V1 Build Queue</h2>
            <p>
              This shell prevents dead routes while we build the full Hub Business
              Network system safely. The Growth Network page is live. This page is
              ready for the next implementation pass.
            </p>

            <div className="hgp-actions">
              <button onClick={() => go("#/hub/growth-network")}>Back to Growth Network</button>
              <button className="is-primary" onClick={() => go("#/hub")}>Hub Workspace</button>
            </div>
          </article>

          <article className="hgp-panel">
            <h2>Planned Sections</h2>
            <div className="hgp-cardGrid">
              {cards.map((card) => (
                <div className="hgp-card" key={card.label}>
                  <strong>{card.value}</strong>
                  <span>{card.label}</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
