// src/pages/oas/oasShared.jsx
// Small stateless building blocks shared by every OAS page (the OAS
// landing page, OAS-1, and any future OAS document page) so they don't
// get redefined/duplicated per page. Depends only on oas-landing.css's
// class names (.oas-venus-mark, .oas__planned), not on any page-specific
// markup, so it's safe to import from any OAS page regardless of which
// page-specific stylesheet that page also loads.
import React from "react";

export function VenusMark({ size = 40 }) {
  return (
    <img
      className="oas-venus-mark"
      src="/assets/oas/oas-venus-logo.png"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      alt=""
      aria-hidden="true"
    />
  );
}

export function PlannedItem({ children }) {
  return (
    <span className="oas__planned" aria-disabled="true" title="Planned — not yet published">
      {children}
    </span>
  );
}

export function AnchorLink({ href, children, className }) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

// Footer content is identical across every OAS page per the shared OAS
// footer system — extracted here once rather than re-authored per page.
export function OASFooter() {
  const YEAR = new Date().getFullYear();
  return (
    <footer className="oas-footer" id="site-footer">
      <div className="oas__container oas-footer__top">
        <div>
          <div className="oas-footer__brand-mark">
            <VenusMark size={32} />
            <strong>OAS</strong>
          </div>
          <p className="oas-footer__tagline">
            Open Autonomous Standard
            <br />
            A more trustworthy AI future.
          </p>
        </div>

        <div className="oas-footer__col">
          <h4>About</h4>
          <ul>
            <li>
              <a href="/oas.html#why-oas">Why OAS</a>
            </li>
            <li>
              <PlannedItem>Principles</PlannedItem>
            </li>
            <li>
              <a href="/oas.html#separation-of-authority">Ecosystem</a>
            </li>
            <li>
              <PlannedItem>News</PlannedItem>
            </li>
          </ul>
        </div>

        <div className="oas-footer__col">
          <h4>Standard</h4>
          <ul>
            <li>
              <a href="/oas-1.html">OAS-1</a>
            </li>
            <li>
              <PlannedItem>Specification</PlannedItem>
            </li>
            <li>
              <PlannedItem>Schemas</PlannedItem>
            </li>
            <li>
              <PlannedItem>Conformance</PlannedItem>
            </li>
          </ul>
        </div>

        <div className="oas-footer__col">
          <h4>Resources</h4>
          <ul>
            <li>
              <PlannedItem>Implementation Guides</PlannedItem>
            </li>
            <li>
              <PlannedItem>Developer Resources</PlannedItem>
            </li>
            <li>
              <PlannedItem>Use Cases</PlannedItem>
            </li>
            <li>
              <PlannedItem>FAQ</PlannedItem>
            </li>
          </ul>
        </div>

        <div className="oas-footer__col">
          <h4>Governance</h4>
          <ul>
            <li>
              <PlannedItem>Process</PlannedItem>
            </li>
            <li>
              <PlannedItem>Public Comment</PlannedItem>
            </li>
            <li>
              <PlannedItem>Version History</PlannedItem>
            </li>
            <li>
              <PlannedItem>Contact</PlannedItem>
            </li>
          </ul>
        </div>

        <div className="oas-footer__right">
          <p>
            OPEN STANDARDS.
            <br />
            REAL PROGRESS.
          </p>
          <p className="oas-footer__domain">OAS.ORG</p>
        </div>
      </div>

      <div className="oas__container oas-footer__bottom">
        <span>© {YEAR} Open Autonomous Standard. Public Working Draft — OAS-1.</span>
        <span className="oas-footer__bottom-links">
          <PlannedItem>Privacy</PlannedItem>
          <PlannedItem>Terms</PlannedItem>
          <PlannedItem>Accessibility</PlannedItem>
        </span>
      </div>
    </footer>
  );
}
