// src/pages/oas/OASPurposeBoundariesPage.jsx
//
// OAS Domain 02 — Purpose & Boundaries detail page. Distinct from
// OASControlDomainsPage.jsx (the framework overview with the radial
// flywheel): this page is a single-domain deep dive. Reuses the shared
// OAS header/footer/typography/button primitives from oasShared.jsx
// and oas-landing.css, with its own page-specific styles in
// oas-purpose-boundaries.css.
//
// The hero's visual foundation is the single final background asset
// (purpose-boundaries-final-background.png: horizon, dust, small
// planet, faint orbital atmosphere) plus a left-side white fade — no
// live target/halo/orbit graphic sits on top of it (an earlier pass
// added one, then a cleanup pass removed it entirely as duplicate
// visual weight). A silver/gold dust particle canvas
// (OASPurposeBoundariesMotion.jsx) now sits between the background and
// the live content — autonomous drift only, no pointer coupling — and
// isn't mounted at all when prefers-reduced-motion is set. Only the
// live "02 / Purpose & Boundaries" text remains in the right column.
// The lower section (section nav through Dive Deeper) has its own,
// calmer dust canvas (OASPurposeBoundariesLowerMotion.jsx), scoped to
// .oaspb-lower so it can never render over the footer.
// The "Why It Matters" and "In Practice" icons (including the small
// target-style line icon used for "Enables accountability") are
// unrelated to the hero and are simple line icons matching the
// restrained style already used on the Control Domains page — not
// final premium treatments.
//
// Claims discipline: same as OAS-1 and Control Domains — no
// certification, adoption, Registry approval, or Trust Bureau
// assurance is claimed anywhere. This page purely explains one of the
// eight control domains already named on OAS-1 and Control Domains;
// it introduces no new normative claims.
import React, { useEffect, useState } from "react";
import "./oas-landing.css";
import "./oas-purpose-boundaries.css";
import HeroAtmosphere from "./OASPurposeBoundariesMotion.jsx";
import LowerAtmosphere from "./OASPurposeBoundariesLowerMotion.jsx";
import { VenusMark, PlannedItem, AnchorLink, OASFooter } from "./oasShared.jsx";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e) => setReduced(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

const iconProps = {
  className: "oaspb-icon",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
  focusable: "false",
};

const ICONS = {
  target: (p) => (
    <svg {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  ),
  shield: (p) => (
    <svg {...p}>
      <path d="M12 3.2 19 6v5.3c0 4.8-3 7.8-7 8.5-4-.7-7-3.7-7-8.5V6l7-2.8z" />
      <path d="M8.7 12 11 14.3l4.3-4.6" />
    </svg>
  ),
  people: (p) => (
    <svg {...p}>
      <circle cx="9" cy="8.5" r="2.9" />
      <circle cx="17" cy="9.6" r="2.3" />
      <path d="M3.5 19.5c.6-3.3 2.8-5.2 5.5-5.2s4.9 1.9 5.5 5.2" />
      <path d="M15.8 14.9c2.2.3 3.7 1.9 4.2 4.6" />
    </svg>
  ),
  infinity: (p) => (
    <svg {...p}>
      <path d="M7 9.5a4.5 4.5 0 1 0 0 9c2 0 3-.9 5-3.5 2 2.6 3 3.5 5 3.5a4.5 4.5 0 1 0 0-9c-2 0-3 .9-5 3.5-2-2.6-3-3.5-5-3.5z" />
    </svg>
  ),
  book: (p) => (
    <svg {...p}>
      <path d="M12 6.5c-1.5-1-4-1.5-7-1v13c3 -.5 5.5 0 7 1 1.5-1 4-1.5 7-1v-13c-3-.5-5.5 0-7 1z" />
      <path d="M12 6.5v13" />
    </svg>
  ),
  arrowRight: (p) => (
    <svg {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
};

const SECTION_NAV = [
  { id: "overview", label: "Overview" },
  { id: "key-elements", label: "Key Elements" },
  { id: "in-practice", label: "In Practice" },
  { id: "standards-schemas", label: "Standards & Schemas" },
  { id: "related-domains", label: "Related Domains" },
];

const WHY_IT_MATTERS = [
  {
    icon: "shield",
    title: "Prevents unintended behavior",
    body: "Clear purpose reduces the risk of harmful, unexpected, or misaligned actions.",
  },
  {
    icon: "people",
    title: "Builds trust",
    body: "Users and stakeholders can understand what the agent is designed to do.",
  },
  {
    icon: "target",
    title: "Enables accountability",
    body: "A defined purpose supports evaluation, monitoring, and governance.",
  },
  {
    icon: "infinity",
    title: "Supports responsible innovation",
    body: "Well-scoped agents create value while respecting human and societal boundaries.",
  },
];

const IN_PRACTICE = [
  {
    n: "1",
    title: "Define the agent's purpose",
    body: "Document the intended goals and use cases.",
  },
  {
    n: "2",
    title: "Establish boundaries",
    body: "Specify what the agent can and cannot do.",
  },
  {
    n: "3",
    title: "Validate and maintain",
    body: "Regularly review purpose and boundaries as the agent evolves.",
  },
];

export default function OASPurposeBoundariesPage() {
  const [navOpen, setNavOpen] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className="oas oaspb">
      <a className="oas__skip-link" href="#oaspb-main">
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
            aria-controls="oaspb-primary-nav"
            aria-label="Toggle navigation menu"
            onClick={() => setNavOpen((v) => !v)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>

          <nav
            id="oaspb-primary-nav"
            className={`oas-header__nav${navOpen ? " oas-header__nav--open" : ""}`}
            aria-label="Primary"
          >
            <AnchorLink href="/oas.html#why-oas">About</AnchorLink>
            <AnchorLink href="/oas-1.html">OAS-1</AnchorLink>
            <AnchorLink href="/oas-control-domains.html" className="oaspb-nav-active">
              Control Domains
            </AnchorLink>
            <PlannedItem>Risk</PlannedItem>
            <PlannedItem>Conformance</PlannedItem>
            <PlannedItem>Schemas</PlannedItem>
            <PlannedItem>Implementation</PlannedItem>
            <AnchorLink href="/oas.html#site-footer">Governance</AnchorLink>
          </nav>

          <div className="oas-header__cta">
            <a className="oas-btn oaspb-btn--rust" href="/oas-1.html">
              Read OAS-1
            </a>
          </div>
        </div>
      </header>

      <main id="oaspb-main">
        {/* ---------------------------- Hero ---------------------------- */}
        <section className="oaspb-hero" aria-labelledby="oaspb-hero-heading">
          {/* Final approved background asset — purely decorative
              (planetary horizon, cloud/dust detail, small distant
              planet, faint orbital arcs). The only hero art layer; no
              target or other graphic sits on top of it. */}
          <img
            className="oaspb-hero__bg"
            src="/assets/oas/purpose-boundaries-final-background.png"
            alt=""
            aria-hidden="true"
          />
          <div className="oaspb-hero__bg-fade" aria-hidden="true" />
          {/* Silver/gold dust particle canvas — autonomous drift only
              (no pointer coupling). Not mounted at all under
              prefers-reduced-motion, so there's zero animation cost in
              that case rather than an animation that gets stopped. */}
          {!reducedMotion && <HeroAtmosphere />}
          <div className="oaspb-hero__grid">
            <div className="oaspb-hero__copy">
              <a className="oaspb-back" href="/oas-control-domains.html">
                <span aria-hidden="true">←</span> Back to Control Domains
              </a>
              <p className="oaspb-eyebrow">Domain 02</p>
              <h1 id="oaspb-hero-heading" className="oaspb-hero__heading">
                Purpose &amp;
                <br />
                Boundaries
              </h1>
              <p className="oaspb-hero__body">
                Defines what the agent is intended to do, including its goals, scope and operational
                boundaries.
              </p>
              <hr className="oaspb-hero__rule" />
              <p className="oaspb-hero__tagline">
                Clear purpose.
                <br />
                Safer outcomes.
              </p>
            </div>

            {/* Live Domain 02 identity text only. The hero's visual
                weight now comes entirely from the final background
                asset (planet, dust, orbital atmosphere) — an earlier
                pass added a live SVG target/halo/orbit system here,
                which duplicated what the background already provides;
                it has been removed rather than hidden. */}
            <div className="oaspb-emblem">
              <div className="oaspb-emblem__label" aria-hidden="true">
                <span className="oaspb-emblem__num">02</span>
                <span className="oaspb-emblem__title">
                  Purpose &amp;
                  <br />
                  Boundaries
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------- Lower half: section nav through Dive Deeper ----------------------------
            Wraps the section nav, main content, and Dive Deeper band so
            one shared atmospheric background can sit behind all three.
            The image itself is a wide, short band (its own aspect ratio
            preserved via width:100%/height:auto — no cropping, so the
            edge planets/orbit rings it was designed to show are never
            cut off); it's tallest right under the hero and dissolves to
            transparent well before Dive Deeper, so nothing competes
            with that band's existing ivory surface or bleeds into the
            footer. */}
        <div className="oaspb-lower">
          <img
            className="oaspb-lower__bg"
            src="/assets/oas/purpose-boundaries-lower-background.png"
            alt=""
            aria-hidden="true"
          />
          <div className="oaspb-lower__veil" aria-hidden="true" />
          {/* Calmer companion to the hero's dust canvas — scoped to
              this section only, so it can never render over the
              footer. Not mounted at all under prefers-reduced-motion. */}
          {!reducedMotion && <LowerAtmosphere />}

          {/* ---------------------------- Section navigation ---------------------------- */}
          <nav className="oaspb-subnav" aria-label="Purpose & Boundaries sections">
            <div className="oas__container oaspb-subnav__row">
              {SECTION_NAV.map((s, i) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={`oaspb-subnav__link${i === 0 ? " oaspb-subnav__link--active" : ""}`}
                  aria-current={i === 0 ? "true" : undefined}
                >
                  {s.label}
                </a>
              ))}
            </div>
          </nav>

          {/* ---------------------------- Main 3-column content ---------------------------- */}
          <section className="oaspb-main" id="overview" aria-label="Purpose & Boundaries overview">
            <div className="oas__container oaspb-main__grid">
              <div className="oaspb-main__col">
                <p className="oaspb-eyebrow">Overview</p>
                <h2 className="oaspb-main__heading">
                  A clear purpose
                  <br />
                  creates trust.
                </h2>
                <p className="oaspb-main__body">
                  Every autonomous agent must have a clearly defined purpose, with well-established goals,
                  scope, and operational boundaries. This ensures agents operate in alignment with human
                  intent, organizational values, and societal benefit.
                </p>
              </div>

              <div className="oaspb-main__col oaspb-main__col--divider" id="key-elements">
                <p className="oaspb-eyebrow">Why it matters</p>
                <div className="oaspb-reasons">
                  {WHY_IT_MATTERS.map((r) => (
                    <div className="oaspb-reason" key={r.title}>
                      <span className="oaspb-reason__icon">{ICONS[r.icon](iconProps)}</span>
                      <span className="oaspb-reason__text">
                        <span className="oaspb-reason__title">{r.title}</span>
                        <span className="oaspb-reason__body">{r.body}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="oaspb-main__col oaspb-main__col--divider" id="in-practice">
                <p className="oaspb-eyebrow">In practice</p>
                <div className="oaspb-steps">
                  {IN_PRACTICE.map((s) => (
                    <div className="oaspb-step" key={s.n}>
                      <span className="oaspb-step__num">{s.n}</span>
                      <span className="oaspb-step__text">
                        <span className="oaspb-step__title">{s.title}</span>
                        <span className="oaspb-step__body">{s.body}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ---------------------------- Dive deeper band ---------------------------- */}
          <section className="oaspb-dive" aria-label="Explore the full specification">
            <div className="oas__container oaspb-dive__row">
              <div className="oaspb-dive__left">
                <span className="oaspb-dive__icon">{ICONS.book(iconProps)}</span>
                <div className="oaspb-dive__text">
                  <p className="oaspb-dive__heading">Dive deeper.</p>
                  <p className="oaspb-dive__body">
                    Explore the detailed requirements, schemas, and implementation guidance for Purpose &amp;
                    Boundaries in OAS-1.
                  </p>
                </div>
              </div>

              <a className="oas-btn oaspb-btn--rust oaspb-dive__cta" href="/oas-1.html">
                View OAS-1 Specification <span aria-hidden="true">→</span>
              </a>

              <a className="oaspb-dive__next" href="/oas-control-domains.html">
                <span className="oaspb-dive__next-text">
                  <span className="oaspb-dive__next-label">Next Domain</span>
                  <span className="oaspb-dive__next-title">Capabilities &amp; Resources</span>
                </span>
                <span className="oaspb-dive__next-arrow" aria-hidden="true">
                  {ICONS.arrowRight(iconProps)}
                </span>
              </a>
            </div>
          </section>
        </div>
      </main>

      <OASFooter />
    </div>
  );
}
