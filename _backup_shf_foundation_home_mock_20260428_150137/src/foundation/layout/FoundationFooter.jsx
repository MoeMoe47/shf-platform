import React from "react";
import "../styles/foundation.css";

export default function FoundationFooter() {
  return (
    <footer className="shf-footer">
      <div className="shf-shell shf-footer__inner">
        <div className="shf-footer__brand">
          <div className="shf-footer__title">Silicon Heartland Foundation</div>
          <p className="shf-footer__text">
            Education, workforce pathways, and measurable community outcomes.
          </p>
        </div>

        <div className="shf-footer__links">
          <a href="/foundation/about">About</a>
          <a href="/foundation/programs">Programs</a>
          <a href="/foundation/impact">Impact</a>
          <a href="/foundation/careers">Careers</a>
          <a href="/foundation/donate">Donate</a>
        </div>
      </div>
    </footer>
  );
}
