// src/pages/oas/oasShared.jsx
// Small stateless building blocks shared by every OAS page (the OAS
// landing page, OAS-1, and any future OAS document page) so they don't
// get redefined/duplicated per page. Depends only on oas-landing.css's
// class names (.oas-venus-mark, .oas__planned), not on any page-specific
// markup, so it's safe to import from any OAS page regardless of which
// page-specific stylesheet that page also loads.
import React, { useState, useRef } from "react";
import "./oas-release-foundation.css";
import { oasRelease } from "./oasRelease.js";

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


export const OAS_PAGES = [
  ["/oas.html", "Overview"],
  ["/oas-1.html", "OAS-1"],
  ["/oas-control-domains.html", "Control Domains"],
  ["/oas-purpose-boundaries.html", "Purpose & Boundaries"],
  ["/oas-risk-classification.html", "Risk Classification"],
];

export function OASHeader({ current }) {
  const [open, setOpen] = useState(false);
  const toggle = useRef(null);
  return <header className="oas-header" onKeyDown={(event) => {
    if (event.key === "Escape" && open) { setOpen(false); toggle.current?.focus(); }
  }}>
    <div className="oas-header__bar">
      <a className="oas-header__brand" href="/oas.html">
        <VenusMark size={54} />
        <div className="oas-header__brand-text"><span className="oas-header__mark">OAS</span>
          <span className="oas-header__tagline"><span>Open Autonomous Standard</span></span>
        </div>
      </a>
      <button ref={toggle} type="button" className="oas-header__toggle" aria-expanded={open}
        aria-controls="oas-primary-nav" aria-label="Toggle navigation menu" onClick={() => setOpen(!open)}>
        <span aria-hidden="true">☰</span>
      </button>
      <nav id="oas-primary-nav" className={`oas-header__nav${open ? " oas-header__nav--open" : ""}`} aria-label="Primary">
        {OAS_PAGES.map(([href, label]) => <a key={href} href={href} aria-current={current === href ? "page" : undefined}>{label}</a>)}
        <span className="oas-nav-planned" aria-disabled="true">Governance <small>Later batch</small></span>
      </nav>
    </div>
  </header>;
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
              <a href={oasRelease.humanUrl}>Specification (Markdown)</a>
            </li>
            <li>
              <a href={oasRelease.declarationSchemaUrl}>Declaration schema</a>
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
          <h4>Governance — later batch</h4>
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
          <p className="oas-footer__domain">Independent standards authority</p>
        </div>
      </div>

      <p className="oas__container oas-release-boundary">{oasRelease.id}: {oasRelease.requirements} requirements across {oasRelease.domains} domains.
        Provider declarations remain provider-attributed: {oasRelease.evaluationStatus}. OAS defines standards;
        the Autonomous Registry governs registration and public records; ATB provides independent assessment;
        SHS BOS governs business operations. Publication is not certification or behavioral verification.</p>
      <div className="oas__container oas-footer__bottom">
        <span>© {YEAR} Open Autonomous Standard. {oasRelease.id} · Frozen published release · {oasRelease.publicationDate}.</span>
        <span className="oas-footer__bottom-links">
          <PlannedItem>Privacy</PlannedItem>
          <PlannedItem>Terms</PlannedItem>
          <PlannedItem>Accessibility</PlannedItem>
        </span>
      </div>
    </footer>
  );
}
