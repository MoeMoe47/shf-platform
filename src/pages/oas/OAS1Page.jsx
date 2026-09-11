// src/pages/oas/OAS1Page.jsx
//
// Official OAS-1 standards-entry page. Distinct in purpose from the OAS
// public landing page (OASLandingPage.jsx): this page is a formal
// standards document entry point (status, coverage, structure, access),
// not a marketing/editorial homepage. Reuses the OAS design system —
// tokens, header/footer styles, button base styles, eyebrow/rule
// primitives — from oas-landing.css, plus its own page-specific styles
// in oas1-page.css for sections that don't exist on the homepage (the
// publication-cover hero, quick facts strip, coverage list, spec
// table-of-contents, and access/download states).
//
// Claims discipline: OAS-1 is a Public Working Draft only. No
// certification, adoption, Registry approval, or Trust Bureau assurance
// is claimed anywhere on this page. The "Read Full Specification" /
// "Download PDF" / "Machine-Readable Schema (JSON)" actions are all
// rendered as non-interactive (no href, aria-disabled) because no such
// files currently exist in this repository (verified: no PDF, no JSON
// schema, no full-spec page anywhere in the repo). The approved mock
// shows two of the three with an active-looking arrow, but that visual
// styling is knowingly not carried over to function — nothing here
// links anywhere or claims to be downloadable when it isn't.
import React, { useState } from "react";
import "./oas-landing.css";
import "./oas1-page.css";
import { VenusMark, PlannedItem, AnchorLink, OASFooter } from "./oasShared.jsx";

const DOMAINS = [
  { n: "01", label: "Identity & Ownership" },
  { n: "02", label: "Purpose & Boundaries" },
  { n: "03", label: "Capabilities & Resources" },
  { n: "04", label: "Permissions & Access" },
  { n: "05", label: "Safety & Prohibited Actions" },
  { n: "06", label: "Human Authority" },
  { n: "07", label: "Validation & Evidence" },
  { n: "08", label: "Lifecycle & Accountability" },
];

// The approved mock shows a 10-line preview of the 14-section spec
// followed by a "View Full Table of Contents" link — a genuine partial
// preview, not the complete list twice over. The other four sections
// (Risk Classification, Conformance, Schemas, Versioning and Change
// Control) still exist as real content elsewhere on this page/site
// (Risk/Conformance/Schemas are already in the header nav as planned
// items), so truncating here doesn't hide anything invented.
const TOC_FULL = [
  "Scope",
  "Terms and Definitions",
  "Agent Identity",
  "Purpose and Operating Boundaries",
  "Capabilities and Resources",
  "Permissions and Access",
  "Safety Controls",
  "Human Authority",
  "Validation and Evidence",
  "Lifecycle Governance",
  "Risk Classification",
  "Conformance",
  "Schemas",
  "Versioning and Change Control",
];
const TOC_PREVIEW_COUNT = 10;

const QUICK_FACTS = [
  { label: "Version", value: "OAS-1 (Working Draft)", icon: "edit" },
  { label: "Status", value: "Public Review", icon: "clock" },
  { label: "Scope", value: "Autonomous Agents", icon: "target" },
  { label: "Format", value: "Human-readable + Machine-readable", icon: "doc" },
  { label: "Audience", value: "Developers, Organizations, Educators, Policymakers", icon: "people" },
  { label: "Maintainer", value: "Open Autonomous Standard", icon: "gear" },
];

const iconProps = {
  className: "oas1-icon",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  // Measured against the approved mock: icons there render ~24px with a
  // visibly bolder stroke than a thin 1.5-1.75 outline produces at that
  // size — 2 keeps them reading as solid/confident rather than faint.
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
  focusable: "false",
};

const ICONS = {
  edit: (p) => (
    <svg {...p}>
      <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z" />
    </svg>
  ),
  clock: (p) => (
    <svg {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  ),
  target: (p) => (
    <svg {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  ),
  doc: (p) => (
    <svg {...p}>
      <rect x="6" y="3.5" width="12" height="17" rx="1" />
      <path d="M9 8h6M9 11.5h6M9 15h4" />
    </svg>
  ),
  people: (p) => (
    <svg {...p}>
      <circle cx="9" cy="8.5" r="2.6" />
      <circle cx="17" cy="9.5" r="2.1" />
      <path d="M3.8 19c.6-3 2.6-4.7 5.2-4.7s4.6 1.7 5.2 4.7" />
      <path d="M15.5 14.6c2 .2 3.4 1.7 3.9 4.4" />
    </svg>
  ),
  gear: (p) => (
    <svg {...p}>
      <circle cx="12" cy="12" r="2.8" />
      <path d="M12 4.5v2M12 17.5v2M19.5 12h-2M6.5 12h-2M17.4 6.6l-1.4 1.4M8 16l-1.4 1.4M17.4 17.4L16 16M8 8 6.6 6.6" />
    </svg>
  ),
  download: (p) => (
    <svg {...p}>
      <path d="M12 4v11M8 11l4 4 4-4" />
      <path d="M5 19.5h14" />
    </svg>
  ),
  code: (p) => (
    <svg {...p}>
      <path d="M9 8 5 12l4 4M15 8l4 4-4 4" />
    </svg>
  ),
  info: (p) => (
    <svg {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 8v.01" />
    </svg>
  ),
};

function ActionRow({ icon, title, comingSoon, description }) {
  return (
    <span className="oas1-action" aria-disabled="true" title="Coming soon — this file does not exist yet">
      <span className="oas1-action__icon">{ICONS[icon](iconProps)}</span>
      <span className="oas1-action__text">
        <span className="oas1-action__title">
          {title}
          {comingSoon && <span className="oas1-action__badge">Coming Soon</span>}
        </span>
        <span className="oas1-action__desc">{description}</span>
      </span>
      <span className="oas1-action__arrow" aria-hidden="true">
        →
      </span>
    </span>
  );
}

export default function OAS1Page() {
  const [navOpen, setNavOpen] = useState(false);
  const tocPreview = TOC_FULL.slice(0, TOC_PREVIEW_COUNT);

  return (
    <div className="oas oas1">
      <a className="oas__skip-link" href="#oas1-main">
        Skip to main content
      </a>

      {/* ---------------------------- Header ---------------------------- */}
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
            aria-controls="oas1-primary-nav"
            aria-label="Toggle navigation menu"
            onClick={() => setNavOpen((v) => !v)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>

          <nav
            id="oas1-primary-nav"
            className={`oas-header__nav${navOpen ? " oas-header__nav--open" : ""}`}
            aria-label="Primary"
          >
            <AnchorLink href="/oas.html#why-oas">About</AnchorLink>
            <span className="oas1-nav-active" aria-current="page">
              OAS-1
            </span>
            <PlannedItem>Control Domains</PlannedItem>
            <PlannedItem>Risk</PlannedItem>
            <PlannedItem>Conformance</PlannedItem>
            <PlannedItem>Schemas</PlannedItem>
            <PlannedItem>Implementation</PlannedItem>
            <AnchorLink href="/oas.html#site-footer">Governance</AnchorLink>
          </nav>

          <div className="oas-header__cta">
            <a className="oas-btn oas1-btn--rust" href="#read-the-standard">
              Read OAS-1
            </a>
          </div>
        </div>
      </header>

      <main id="oas1-main">
        {/* ---------------------------- Hero ---------------------------- */}
        <section className="oas1-hero" aria-labelledby="oas1-hero-heading">
          <div className="oas1-hero__grid">
            <div className="oas1-hero__copy">
              <p className="oas1-hero__eyebrow">The Standard</p>
              <h1 id="oas1-hero-heading" className="oas1-hero__title">
                OAS-1
              </h1>
              <p className="oas1-hero__subtitle">
                A common standard
                <br />
                for autonomous agents.
              </p>
              <p className="oas1-hero__body">
                OAS-1 defines how autonomous agents describe who they are, what they are allowed to do,
                how they interact with systems, what evidence they must produce, and how they can be
                governed across platforms and organizations.
              </p>
              <div className="oas1-hero__actions">
                <a className="oas-btn oas1-btn--rust" href="#read-the-standard">
                  Read the Specification
                </a>
                <a className="oas-btn oas1-btn--ghost-on-dark" href="#oas1-covers">
                  View Summary
                </a>
              </div>
            </div>

            <div className="oas1-hero__visual">
              {/* Transparent-background cutout (see
                  public/assets/oas/oas1-book-stack-transparent.png),
                  matted from the same real photographic book-stack asset
                  (oas1-book-stack.png) so the book floats directly in the
                  hero's own dark-to-rust gradient with no visible image
                  rectangle around it. The natural contact shadow beneath
                  the book is baked into this asset's alpha channel (soft,
                  fading to full transparency) rather than reproduced as a
                  CSS box-shadow. All cover text (title, subtitle,
                  tagline, rule, status labels, Venus mark) is baked into
                  the book's own cover design, same as any product-photo
                  asset; it is not independently meaningful copy exclusive
                  to this image (the same title/tagline/mark already exist
                  as real text elsewhere on the page and site), so a
                  complete descriptive alt attribute is the correct
                  accessibility treatment here rather than a duplicate
                  live-HTML overlay at the same position. */}
              <img
                className="oas1-cover"
                src="/assets/oas/oas1-book-stack-transparent.png"
                width={750}
                height={691}
                alt="OAS-1 publication cover: a cream book with the Venus mark, titled 'OAS-1, Open Autonomous Standard,' reading 'A more trustworthy AI future,' with a warm bronze planetary sweep across the lower-right corner, labeled Public Working Draft, Version 1.0, resting against a second volume."
              />
            </div>

            <ul className="oas1-hero__tags" aria-hidden="true">
              <li>Open</li>
              <li>Transparent</li>
              <li>Collaborative</li>
              <li>A safer tomorrow</li>
            </ul>
          </div>
        </section>

        {/* ---------------------------- Quick Facts ---------------------------- */}
        <section className="oas1-facts" aria-label="OAS-1 quick facts">
          <div className="oas__container oas1-facts__row">
            {QUICK_FACTS.map((f) => (
              <div className="oas1-facts__item" key={f.label}>
                <span className="oas1-facts__icon">{ICONS[f.icon](iconProps)}</span>
                <span className="oas1-facts__text">
                  <span className="oas1-facts__label">{f.label}</span>
                  <span className="oas1-facts__value">{f.value}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------------------- Main 3-column band ----------------------------
             Covers / Structure / Access sit side-by-side in ONE compact desktop
             section, per the approved mock — not three stacked sections. Each
             column keeps its own short head + content; a vertical divider
             separates them. Below 1100px this collapses to a normal stack (see
             oas1-page.css). */}
        <section className="oas1-main" aria-label="OAS-1 coverage, structure, and access">
          <div className="oas__container oas1-main__grid">
            <div className="oas1-main__col" id="oas1-covers" aria-labelledby="oas1-covers-heading">
              <p className="oas__eyebrow">What OAS-1 covers</p>
              <h2 id="oas1-covers-heading" className="oas1-main__heading">
                Eight foundational domains.
              </h2>
              <p className="oas1-main__intro">
                OAS-1 establishes requirements across eight connected control domains that work together
                to create safe, transparent, and accountable agents.
              </p>

              <div className="oas1-covers__row">
                {DOMAINS.map((d) => (
                  <div className="oas1-domain" key={d.n}>
                    <span className="oas1-domain__num">{d.n}</span>
                    <span className="oas1-domain__label">{d.label}</span>
                  </div>
                ))}
              </div>

              <a className="oas1-textlink" href="/oas.html#what-oas-governs">
                Explore the Control Domains →
              </a>
            </div>

            <div className="oas1-main__col oas1-main__col--divider" aria-labelledby="oas1-structure-heading">
              <p className="oas__eyebrow">Inside OAS-1</p>
              <h2 id="oas1-structure-heading" className="oas1-main__heading">
                Specification Structure.
              </h2>
              <p className="oas1-main__intro">
                OAS-1 is organized into clear sections for practical use across technical, organizational,
                and policy environments.
              </p>

              <ol className="oas1-toc">
                {tocPreview.map((title, i) => (
                  <li className="oas1-toc__item" key={title}>
                    <span className="oas1-toc__num">{String(i + 1).padStart(2, "0")}</span>
                    <span className="oas1-toc__title">{title}</span>
                  </li>
                ))}
              </ol>

              <div className="oas1-textlink oas1-textlink--planned">
                <PlannedItem>View Full Table of Contents →</PlannedItem>
              </div>
            </div>

            <div className="oas1-main__col oas1-main__col--divider" id="read-the-standard" aria-labelledby="oas1-access-heading">
              <p className="oas__eyebrow">Read the standard</p>
              <h2 id="oas1-access-heading" className="oas1-main__heading">
                Get the official specification.
              </h2>
              <p className="oas1-main__intro">
                Read, download, or integrate OAS-1 into your organization or platform.
              </p>

              <div className="oas1-access__actions">
                <ActionRow icon="doc" title="Read Full Specification" description="View the complete OAS-1 standard online." />
                <ActionRow icon="download" title="Download PDF" comingSoon description="A printable version of the OAS-1 standard." />
                <ActionRow icon="code" title="Machine-Readable Schema (JSON)" description="Integrate OAS-1 into your systems." />
              </div>

              {/* ---------------------------- Normative Notice ---------------------------- */}
              <p className="oas1-notice">
                <span className="oas1-notice__icon">{ICONS.info(iconProps)}</span>
                This page provides an overview. The OAS-1 Specification contains the normative requirements.
              </p>
            </div>
          </div>
        </section>
      </main>

      <OASFooter />
    </div>
  );
}
