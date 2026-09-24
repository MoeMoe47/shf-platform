import React, { useState } from "react";
import "./shs-header.css";

const NAV_LINKS = [
  { label: "Solutions", href: "#solutions" },
  { label: "Industries", href: "#industries" },
  { label: "Our Work", href: "#our-work" },
  { label: "Technology", href: "#technology" },
  { label: "Company", href: "/solutions.html#/team" },
  { label: "Resources", href: "#resources" },
];

export default function ShsHeader({ searchQuery = "", onSearchChange }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="shs-home-header">
      <div className="shs-header-inner">
        <a className="shs-header-brand" href="/solutions.html#/home" aria-label="Silicon Heartland Systems home">
          <img src="/assets/shs/shs-orbiter-logo.png" alt="" className="shs-home-header-logo" width="34" height="34" />
          <span className="shs-header-wordmark">
            <strong>SILICON HEARTLAND</strong>
            <span>SYSTEMS</span>
            <em>TECHNOLOGY &middot; INFRASTRUCTURE &middot; OPERATIONAL SOLUTIONS</em>
          </span>
        </a>

        <nav className="shs-header-nav" aria-label="Primary">
          {NAV_LINKS.map((item) => (
            <a key={item.label} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="shs-header-actions">
          <div className={`shs-header-search ${searchOpen ? "is-open" : ""}`}>
            <button
              type="button"
              className="shs-header-icon-btn"
              aria-label={searchOpen ? "Close search" : "Search solutions and industries"}
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((open) => !open)}
            >
              &#128269;
            </button>
            {searchOpen ? (
              <input
                type="search"
                autoFocus
                placeholder="Search..."
                value={searchQuery}
                onChange={(event) => onSearchChange && onSearchChange(event.target.value)}
                aria-label="Search solutions and industries"
              />
            ) : null}
          </div>
          <a className="shs-header-contact" href="/solutions.html#/contact">
            Contact
          </a>
          <a className="shs-home-btn shs-home-btn-primary shs-header-cta" href="/solutions.html#/contact">
            Work With SHS <span aria-hidden="true">&rarr;</span>
          </a>
          <button
            type="button"
            className="shs-header-menu-btn"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="shs-header-mobile-panel">
          <nav aria-label="Primary (mobile)">
            {NAV_LINKS.map((item) => (
              <a key={item.label} href={item.href} onClick={() => setMenuOpen(false)}>
                {item.label}
              </a>
            ))}
          </nav>
          <a className="shs-header-contact" href="/solutions.html#/contact">
            Contact
          </a>
        </div>
      ) : null}
    </header>
  );
}
