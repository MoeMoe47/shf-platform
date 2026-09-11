// src/pages/oas/OASLandingPage.jsx
//
// Public landing page for the Open Autonomous Standard (OAS) — a public
// working draft, "OAS-1". This page is intentionally self-contained: it
// does not import shared SHF/SHS tokens or styles (see oas-landing.css),
// matching the same isolation precedent already established for the
// canonical Universe experience (universe.html/universe.main.jsx).
//
// Status/claims discipline: OAS-1 is a working draft with no operational
// certification, validation, or Registry/Trust Bureau backend behind it
// in this repository. Copy below deliberately uses "defines" / "proposes"
// / "establishes requirements" language and never claims adoption,
// certification, or third-party endorsement. The Autonomous Registry and
// Autonomous Trust Bureau are described as independent, separately
// governed authorities — never merged with the Standard itself.
//
// Deep sub-routes (About/Standard/Ecosystem page-level content, Use
// Cases, Resources, Governance, footer link destinations) do not exist
// yet in this repository. Where a nav/footer item has a real, honest
// destination on this single page, it is an in-page anchor; where it
// does not, it renders as non-interactive text via <PlannedItem>, per
// the routing rules for this page — no fabricated routes.

import React, { useState } from "react";
import "./oas-landing.css";
import { VenusMark, PlannedItem, AnchorLink, OASFooter } from "./oasShared.jsx";

/* ---------------------------- Foundation icons ---------------------------- */
/* Minimal hand-authored line icons (no external icon library dependency). */

const iconProps = {
  className: "oas-foundation__icon",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
  focusable: "false",
};

const FOUNDATION_ICONS = [
  // 01 Identity & Ownership
  (props) => (
    <svg {...props}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5.5 20c1.2-3.6 4-5 6.5-5s5.3 1.4 6.5 5" />
    </svg>
  ),
  // 02 Purpose & Boundaries
  (props) => (
    <svg {...props}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M15.2 8.8 13 13l-4.2 2.2L11 11z" />
    </svg>
  ),
  // 03 Capabilities & Resources
  (props) => (
    <svg {...props}>
      <path d="M12 3.5 20 8l-8 4.5L4 8z" />
      <path d="M4 8v8l8 4.5 8-4.5V8" />
      <path d="M12 12.5V21" />
    </svg>
  ),
  // 04 Permissions & Access
  (props) => (
    <svg {...props}>
      <circle cx="8" cy="15" r="3.4" />
      <path d="M10.4 12.6 18 5" />
      <path d="M15 8l2 2" />
      <path d="M17.5 5.5l2 2" />
    </svg>
  ),
  // 05 Safety & Prohibited Actions
  (props) => (
    <svg {...props}>
      <path d="M12 3.5 19 6.3v5.4c0 4.5-3 7-7 8.8-4-1.8-7-4.3-7-8.8V6.3z" />
      <path d="M9.2 12.2l2 2 3.6-4" />
    </svg>
  ),
  // 06 Human Authority
  (props) => (
    <svg {...props}>
      <circle cx="12" cy="7" r="2.9" />
      <path d="M6 20c0-3.6 2.7-6 6-6s6 2.4 6 6" />
      <path d="M4.5 15.5 2.5 17.5" />
      <path d="M19.5 15.5l2 2" />
    </svg>
  ),
  // 07 Validation & Evidence
  (props) => (
    <svg {...props}>
      <rect x="5.5" y="3.5" width="13" height="17" rx="1.2" />
      <path d="M9 8h6M9 11.5h6M9 15h4" />
      <path d="M8.5 20.5 12 22l3.5-1.5" />
    </svg>
  ),
  // 08 Lifecycle & Accountability
  (props) => (
    <svg {...props}>
      <path d="M4.5 12a7.5 7.5 0 0 1 12.6-5.5" />
      <path d="M19.5 12a7.5 7.5 0 0 1-12.6 5.5" />
      <path d="M17.5 3.5v3.6h-3.6" />
      <path d="M6.5 20.5v-3.6h3.6" />
    </svg>
  ),
];

const FOUNDATIONS = [
  {
    n: "01",
    label: "Identity & Ownership",
    desc: "How an agent is uniquely identified, and who owns it.",
  },
  {
    n: "02",
    label: "Purpose & Boundaries",
    desc: "What the agent is built to do, and the limits on its scope.",
  },
  {
    n: "03",
    label: "Capabilities & Resources",
    desc: "What the agent can access, use, or control.",
  },
  {
    n: "04",
    label: "Permissions & Access",
    desc: "What the agent is explicitly authorized to do.",
  },
  {
    n: "05",
    label: "Safety & Prohibited Actions",
    desc: "What the agent must never do, under any circumstance.",
  },
  {
    n: "06",
    label: "Human Authority",
    desc: "How people retain oversight, override, and control.",
  },
  {
    n: "07",
    label: "Validation & Evidence",
    desc: "How claims and behavior can be verified over time.",
  },
  {
    n: "08",
    label: "Lifecycle & Accountability",
    desc: "How agents are versioned, retired, and held accountable.",
  },
];

export default function OASLandingPage() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="oas oas-home">
      <a className="oas__skip-link" href="#oas-main">
        Skip to main content
      </a>

      {/* ---------------------------- Header ---------------------------- */}
      {/* Brought in line with the compact header shared by every other
          OAS page (same nav items, same VenusMark size, single-line
          tagline) — Home's header had drifted to its own bespoke nav
          set; this restores one shared header architecture across the
          whole OAS site. No nav item is marked active: Home has no
          corresponding nav entry (it's reached via the logo), matching
          the "no active state unless cleanly supported" instruction. */}
      <header className="oas-header">
        <div className="oas-header__bar">
          <div className="oas-header__brand">
            <VenusMark size={54} />
            <div className="oas-header__brand-text">
              <span className="oas-header__mark">OAS</span>
              <span className="oas-header__tagline">
                <span>Open Autonomous Standard</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            className="oas-header__toggle"
            aria-expanded={navOpen}
            aria-controls="oas-primary-nav"
            aria-label="Toggle navigation menu"
            onClick={() => setNavOpen((v) => !v)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>

          <nav
            id="oas-primary-nav"
            className={`oas-header__nav${navOpen ? " oas-header__nav--open" : ""}`}
            aria-label="Primary"
          >
            <AnchorLink href="#why-oas">About</AnchorLink>
            <AnchorLink href="/oas-1.html">OAS-1</AnchorLink>
            <AnchorLink href="/oas-control-domains.html">Control Domains</AnchorLink>
            <AnchorLink href="/oas-risk-classification.html">Risk</AnchorLink>
            <PlannedItem>Conformance</PlannedItem>
            <PlannedItem>Schemas</PlannedItem>
            <PlannedItem>Implementation</PlannedItem>
            <AnchorLink href="#site-footer">Governance</AnchorLink>
          </nav>

          <div className="oas-header__cta">
            <a className="oas-btn oas-btn--primary" href="/oas-1.html">
              Read OAS-1
            </a>
          </div>
        </div>
      </header>

      <main id="oas-main">
        {/* ---------------------------- Hero ---------------------------- */}
        {/* Full-bleed dark cinematic hero per the approved Home mock.
            Phase 1 (structure only): the right column is a plain,
            unstyled dark area reserving space for the future planet/
            atmosphere art — no generated art, no CSS-drawn planet, no
            particles or glow yet. Live micro-copy sits directly on the
            placeholder rather than being baked into art. */}
        <section className="oas-hero" aria-labelledby="oas-hero-heading">
          {/* Approved deep-space background — purely decorative (dark
              atmospheric base for the planet layer to come later).
              Sits behind the readability overlay and all live content;
              no information depends on it. */}
          <img
            className="oas-hero__bg"
            src="/assets/oas/oas-home-deep-space-background.png"
            alt=""
            aria-hidden="true"
          />
          <div className="oas-hero__bg-overlay" aria-hidden="true" />
          <div className="oas-hero__grid">
            <div className="oas-hero__copy">
              <p className="oas__eyebrow">Open Autonomous Standard</p>
              <h1 id="oas-hero-heading" className="oas-hero__heading">
                A safer,
                <br />
                more open
                <br />
                future for
                <br />
                <span className="oas-hero__accent">autonomous agents.</span>
              </h1>
              <p className="oas-hero__body">
                OAS is a global standard for how autonomous agents are built, governed, and operated — so
                they can create real value while keeping people, organizations, and society safe.
              </p>
              <div className="oas-hero__actions">
                <a className="oas-btn oas-btn--on-dark" href="/oas-1.html">
                  Explore OAS-1
                </a>
                <a className="oas-btn oas-btn--outline-on-dark" href="#why-oas">
                  Watch Overview
                </a>
              </div>
            </div>

            <div className="oas-hero__visual" aria-hidden="true">
              <div className="oas-hero__micro">
                <span>People</span>
                <span>Systems</span>
                <span>Agents</span>
                <span>A More Open</span>
                <span>Future</span>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------- Hero bottom strip ---------------------------- */}
        <section className="oas-hero-strip" aria-label="OAS at a glance">
          <div className="oas__container oas-hero-strip__row">
            <p className="oas-hero-strip__statement">A shared standard. A safer, more open future.</p>
            <ul className="oas-hero-strip__tags">
              <li>Open</li>
              <li>Transparent</li>
              <li>Collaborative</li>
            </ul>
          </div>
        </section>

        {/* ---------------------------- Why OAS Exists ---------------------------- */}
        {/* Simple two-column editorial layout — no final institutional
            architecture image yet (Phase 1: neutral placeholder only). */}
        <section className="oas-why" id="why-oas" aria-labelledby="oas-why-heading">
          <div className="oas__container oas-why__grid">
            <div className="oas-why__intro">
              <p className="oas__eyebrow">Why OAS exists</p>
              <h2 id="oas-why-heading" className="oas-why__heading">
                A shared foundation for a more trustworthy AI future.
              </h2>
              <p className="oas-why__body">
                Autonomous agents need a common, open framework for identity, purpose, permissions,
                safety, human authority, evidence, and accountability. Today, every platform describes
                them differently — OAS creates a common language so autonomous systems can be understood,
                governed, and trusted across organizations, industries, and countries.
              </p>
            </div>
            <div className="oas-why__visual" aria-hidden="true" />
          </div>
        </section>

        {/* ---------------------------- What OAS Governs ---------------------------- */}
        <section className="oas-foundations" id="what-oas-governs" aria-labelledby="oas-foundations-heading">
          <div className="oas__container">
            <div className="oas-foundations__head">
              <div>
                <p className="oas__eyebrow">What OAS governs</p>
                <h2 id="oas-foundations-heading">The Eight Foundations</h2>
              </div>
              <p>
                Every agent built to OAS is expected to address these eight domains. Together, they
                establish a complete and interoperable control model.
              </p>
            </div>

            <div className="oas-foundations__row">
              {FOUNDATIONS.map((f, i) => {
                const Icon = FOUNDATION_ICONS[i];
                return (
                  <div className="oas-foundation" key={f.n}>
                    <span className="oas-foundation__num">{f.n}</span>
                    <Icon {...iconProps} />
                    <p className="oas-foundation__label">{f.label}</p>
                    <p className="oas-foundation__desc">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ---------------------------- Separation of Authority ---------------------------- */}
        <section className="oas-authority" id="separation-of-authority" aria-labelledby="oas-authority-heading">
          <div className="oas__container">
            <div className="oas-authority__head">
              <p className="oas__eyebrow">A separation of authority</p>
              <h2 id="oas-authority-heading">Three independent roles. A stronger ecosystem.</h2>
              <p>
                OAS, the Autonomous Registry, and the Trust Bureau are designed as independent authorities.
                This separation is intended to support transparency, accountability, and long-term
                credibility.
              </p>
            </div>

            <div className="oas-authority__flow">
              <div className="oas-authority__node">
                <span className="oas-authority__circle oas-authority__circle--oas" aria-hidden="true">
                  OAS
                </span>
                <div className="oas-authority__node-text">
                  <h3>The Standard</h3>
                  <p>Defines what must be true — rules, specifications, protocols, schemas, and evidence requirements.</p>
                </div>
              </div>
              <span className="oas-authority__arrow" aria-hidden="true">
                →
              </span>
              <div className="oas-authority__node">
                <span className="oas-authority__circle oas-authority__circle--registry" aria-hidden="true">
                  Registry
                </span>
                <div className="oas-authority__node-text">
                  <h3>The Autonomous Registry</h3>
                  <p>
                    Records what agent exists — identity, registration, discovery, version records, and
                    lifecycle records. Operated as a separate, independent authority.
                  </p>
                </div>
              </div>
              <span className="oas-authority__arrow" aria-hidden="true">
                →
              </span>
              <div className="oas-authority__node">
                <span className="oas-authority__circle oas-authority__circle--bureau" aria-hidden="true">
                  Trust
                  <br />
                  Bureau
                </span>
                <div className="oas-authority__node-text">
                  <h3>The Trust Bureau</h3>
                  <p>
                    Independently evaluates whether claims can be trusted — verification, integrity review,
                    and compliance evaluation, as a separately governed authority.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------- Opportunity Banner ---------------------------- */}
        {/* Phase 1: flat dark placeholder, no final landscape art yet. */}
        <section className="oas-opportunity" aria-labelledby="oas-opportunity-heading">
          <div className="oas__container oas-opportunity__content">
            <h2 id="oas-opportunity-heading">A more trustworthy autonomous future starts with shared rules.</h2>
            <p>
              Explore the working draft that defines how autonomous agents can be built, governed, and
              trusted.
            </p>
            <a className="oas-btn oas-btn--on-dark" href="/oas-1.html">
              Read OAS-1
            </a>
          </div>
        </section>
      </main>

      <OASFooter />
    </div>
  );
}
