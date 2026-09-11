// apps/shf-web/src/components/civicsure/CivicSurePublicNav.jsx
//
// Public-facing top navigation for citizen-facing CivicSure surfaces
// (Explorer and, eventually, other public pages). Deliberately
// separate from CivicSureShell.jsx, which is the internal operator
// console chrome (org/role context, internal nav vocabulary, no
// Sign In) — this component is not a redesign of that shell, it is a
// new, distinct header for a different audience.
//
// Frame only: search and Sign In are non-functional placeholders in
// this phase (see docs/ui/CIVICSURE_EXPLORER_FRAME.md).
import React, { useState } from "react";
import { ExplorerIcon } from "../../pages/civicsure/explorer/explorerIcons.jsx";

const NAV_ITEMS = [
  { key: "overview", label: "Overview" },
  { key: "explorer", label: "Explorer" },
  { key: "how-it-works", label: "How It Works" },
  { key: "reports", label: "Reports" },
  { key: "for-government", label: "For Government" },
  { key: "providers", label: "Providers" },
  { key: "public-trust", label: "Public Trust" },
];

export default function CivicSurePublicNav({ activeKey = "explorer" }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="cse-nav">
      <div className="cse-nav__bar">
        <div className="cse-nav__brand">
          <ExplorerIcon name="shield" className="cse-nav__brand-icon" />
          <div className="cse-nav__brand-text">
            <span className="cse-nav__wordmark">CivicSure</span>
            <span className="cse-nav__tagline">Public Trust. Proven.</span>
          </div>
        </div>

        <button
          type="button"
          className="cse-nav__toggle"
          aria-expanded={open}
          aria-controls="cse-primary-nav"
          aria-label="Toggle navigation menu"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>

        <nav id="cse-primary-nav" className={`cse-nav__links${open ? " is-open" : ""}`} aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.key}
              href="#/explorer"
              className={`cse-nav__link${item.key === activeKey ? " is-active" : ""}`}
              aria-current={item.key === activeKey ? "page" : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="cse-nav__actions">
          <button type="button" className="cse-nav__search-btn" aria-label="Search CivicSure">
            <ExplorerIcon name="search" />
          </button>
          <button type="button" className="cse-btn cse-btn--primary">
            Sign In
          </button>
        </div>
      </div>
    </header>
  );
}
