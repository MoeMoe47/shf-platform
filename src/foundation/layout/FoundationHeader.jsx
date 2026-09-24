import React from "react";

const universeOrigin = String(import.meta.env.VITE_UNIVERSE_ORIGIN || "").replace(/\/+$/, "");
const returnToUniverseHref = universeOrigin ? `${universeOrigin}/universe` : "";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

export default function FoundationHeader() {
  return (
    <header className="shf-header">
      <div className="shf-header__inner shf-shell">
        <a className="shf-brand" href="/foundation.html" aria-label="Silicon Heartland Foundation home">
          <img src="/assets/shf-command/brand/shf-globe-logo.png" alt="" />
          <span>
            <strong>Silicon Heartland</strong>
            <strong>Foundation</strong>
            <small>People - Opportunity - Stronger Communities</small>
          </span>
        </a>

        <nav className="shf-nav" aria-label="Foundation navigation">
          <a href="#/about">About</a>
          <a href="#/programs">Our Work</a>
          <a href="#/programs">Programs</a>
          <a href="#impact">Impact</a>
          <a href="#/partners">Partners</a>
          <a href="#/reports">Resources</a>
        </nav>

        <div className="shf-header__actions">
          <a className="shf-icon-link" href="#/reports" aria-label="Search SHF resources">
            <SearchIcon />
          </a>
          <a className="shf-contact-link" href="#/get-involved">Contact</a>
          <a className="shf-support-link" href="#/get-involved">
            Support SHF <span aria-hidden="true">-&gt;</span>
          </a>
          {returnToUniverseHref ? (
            <a className="shf-return-universe-pill" href={returnToUniverseHref} aria-label="Return to Universe">
              Return to Universe
            </a>
          ) : null}
        </div>
      </div>
    </header>
  );
}
