import React from "react";

export default function FoundationHeader() {
  return (
    <header className="shf-header">
      <div className="shf-header__inner shf-shell">
        <a className="shf-brand" href="/foundation.html">
          <span className="shf-brand__mark">
            <img src="/assets/branding/shf-impact-center-logo.png" alt="SH Foundation logo" />
          </span>
          <span className="shf-brand__name">SH FOUNDATION</span>
        </a>

        <nav className="shf-nav" aria-label="Foundation navigation">
          <a href="#about">About</a>
          <a href="#programs">Programs</a>
          <a href="#impact">Impact</a>
          <a href="#get-involved">Get Involved</a>
          <a href="#reports">Reports</a>
        </nav>

        <div className="shf-header__actions">
          <a className="shf-donate-pill" href="#donate">Donate</a>
          <a className="shf-command-pill" href="/shf.html">SHF Command Center</a>
        </div>
      </div>
    </header>
  );
}
