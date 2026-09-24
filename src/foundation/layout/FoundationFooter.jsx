import React from "react";

export default function FoundationFooter() {
  return (
    <footer className="shf-footer" id="get-involved">
      <div className="shf-shell shf-footer__inner">
        <a className="shf-footer__brand" href="/foundation.html" aria-label="Silicon Heartland Foundation home">
          <img src="/assets/shf-command/brand/shf-globe-logo.png" alt="" />
          <span>
            <strong>Silicon Heartland</strong>
            <strong>Foundation</strong>
            <small>People - Opportunity - Stronger Communities</small>
          </span>
        </a>

        <nav className="shf-footer__links" aria-label="Foundation footer">
          <a href="#/about">About</a>
          <a href="#/programs">Programs</a>
          <a href="#impact">Impact</a>
          <a href="#/partners">Partners</a>
          <a href="#/reports">Resources</a>
          <a href="#/reports">News</a>
          <a href="#/get-involved">Contact</a>
        </nav>

        <div className="shf-footer__social" aria-label="Social links">
          <span>in</span>
          <span>yt</span>
          <span>x</span>
          <span>ig</span>
        </div>
      </div>
      <div className="shf-footer__bottom">
        <span>A stronger region. A brighter tomorrow.</span>
        <span>© 2026 Silicon Heartland Foundation. All rights reserved.</span>
      </div>
    </footer>
  );
}
