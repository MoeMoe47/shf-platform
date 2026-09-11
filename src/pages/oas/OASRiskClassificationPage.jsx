// src/pages/oas/OASRiskClassificationPage.jsx
//
// OAS Risk Classification page — answers "how risky is this autonomous
// agent, and what level of control should apply?" via a five-level
// (R0-R4) classification scale plus a "what changes by level?"
// comparison matrix. Reuses the shared OAS header/footer/typography/
// button primitives from oasShared.jsx and oas-landing.css, with its
// own page-specific styles in oas-risk-classification.css.
//
// The hero background is a real asset (see oas-risk-classification.css
// for how it's integrated) rather than a placeholder.
//
// The R0-R4 scale (.oasrc-scale__field) is a single continuous
// escalating field, not five separate cards: one horizontal base
// gradient spans the whole container (pale ivory at R0 through deep
// rust at R4), a clipped decorative "landscape" shape adds depth, and
// a static SVG curve with five points arcs above the row to reinforce
// the escalation narrative. Color is never the only signal — every
// level still carries its own R0-R4 badge text, title, description,
// and control-band label; text color simply switches from dark ink
// (R0-R2, pale backdrop) to white (R3-R4, dark backdrop) to stay
// readable against the field's own escalating tone.
//
// Claims discipline: same as every other OAS page — no certification,
// adoption, Registry approval, or Trust Bureau assurance is claimed
// anywhere. This page purely explains OAS's risk-classification model
// already referenced elsewhere on the site; it introduces no new
// normative claims.
import React, { useEffect, useState } from "react";
import "./oas-landing.css";
import "./oas-risk-classification.css";
import HeroMotion from "./OASRiskClassificationHeroMotion.jsx";
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
  className: "oasrc-icon",
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
  sliders: (p) => (
    <svg {...p}>
      <path d="M5 6h9M18 6h1M5 18h1M8 18h11M5 12h4M13 12h6" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="6" cy="12" r="2" />
      <circle cx="11" cy="18" r="2" />
    </svg>
  ),
  shield: (p) => (
    <svg {...p}>
      <path d="M12 3.2 19 6v5.3c0 4.8-3 7.8-7 8.5-4-.7-7-3.7-7-8.5V6l7-2.8z" />
      <path d="M8.7 12 11 14.3l4.3-4.6" />
    </svg>
  ),
  refresh: (p) => (
    <svg {...p}>
      <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" />
      <path d="M18 3v4h-4M6 21v-4h4" />
    </svg>
  ),
  planet: (p) => (
    <svg {...p}>
      <circle cx="12" cy="12" r="6.5" />
      <ellipse cx="12" cy="12" rx="10" ry="3.4" />
    </svg>
  ),
  arrowRight: (p) => (
    <svg {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
};

const LEVELS = [
  {
    n: "R0",
    title: "Minimal",
    sub: "Informational",
    body: "No material risk of harm. Typically limited to information, assistance, or productivity.",
    control: "Baseline Controls",
  },
  {
    n: "R1",
    title: "Low",
    body: "Limited risk of harm. Well-defined scope and constrained capabilities.",
    control: "Standard Controls",
  },
  {
    n: "R2",
    title: "Moderate",
    body: "Meaningful risk of harm in specific contexts. Requires additional controls and oversight.",
    control: "Enhanced Controls",
  },
  {
    n: "R3",
    title: "High",
    body: "Significant risk of harm. Higher autonomy or broader impact. Requires strong controls and human oversight.",
    control: "Strict Controls",
  },
  {
    n: "R4",
    title: "Critical",
    body: "Severe risk of harm, including safety, rights, or societal impact. Deployment typically restricted or prohibited without exceptional justification.",
    control: "Highest Controls",
  },
];

const EXPLAIN = [
  {
    icon: "sliders",
    title: "What determines risk?",
    body: "Risk classification considers the agent's capabilities, level of autonomy, context of use, and potential consequences of failure or misuse.",
  },
  {
    icon: "shield",
    title: "Why it matters",
    body: "Appropriate risk classification ensures the right level of controls, oversight, and accountability.",
  },
  {
    icon: "refresh",
    title: "When to reassess",
    body: "Risk level should be reviewed whenever capabilities, permissions, operating context, or intended use changes significantly.",
  },
];

const MATRIX_ROWS = [
  {
    label: "Purpose & Boundaries",
    values: ["Basic", "Defined", "Detailed", "Strict", "Strict"],
  },
  {
    label: "Permissions & Access",
    values: ["Minimal", "Constrained", "Limited", "Controlled", "Highly Restricted"],
  },
  {
    label: "Human Oversight",
    values: ["Not required", "Recommended", "Required", "Required", "Continuous"],
  },
  {
    label: "Validation & Evidence",
    values: ["Self-declared", "Basic", "Documented", "Independent review", "Formal verification"],
  },
  {
    label: "Deployment",
    values: ["Open", "Open", "Conditional", "Restricted", "Typically prohibited"],
  },
];

const MATRIX_COLUMNS = ["R0 Minimal", "R1 Low", "R2 Moderate", "R3 High", "R4 Critical"];

export default function OASRiskClassificationPage() {
  const [navOpen, setNavOpen] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className="oas oasrc">
      <a className="oas__skip-link" href="#oasrc-main">
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
            aria-controls="oasrc-primary-nav"
            aria-label="Toggle navigation menu"
            onClick={() => setNavOpen((v) => !v)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>

          <nav
            id="oasrc-primary-nav"
            className={`oas-header__nav${navOpen ? " oas-header__nav--open" : ""}`}
            aria-label="Primary"
          >
            <AnchorLink href="/oas.html#why-oas">About</AnchorLink>
            <AnchorLink href="/oas-1.html">OAS-1</AnchorLink>
            <AnchorLink href="/oas-control-domains.html">Control Domains</AnchorLink>
            <span className="oasrc-nav-active" aria-current="page">
              Risk
            </span>
            <PlannedItem>Conformance</PlannedItem>
            <PlannedItem>Schemas</PlannedItem>
            <PlannedItem>Implementation</PlannedItem>
            <AnchorLink href="/oas.html#site-footer">Governance</AnchorLink>
          </nav>

          <div className="oas-header__cta">
            <a className="oas-btn oasrc-btn--rust" href="/oas-1.html">
              Read OAS-1
            </a>
          </div>
        </div>
      </header>

      <main id="oasrc-main">
        {/* ---------------------------- Hero ---------------------------- */}
        <section className="oasrc-hero" aria-labelledby="oasrc-hero-heading">
          {/* Approved atmospheric background asset — purely decorative
              (three moons, faint orbital arcs, a golden-to-ember
              mountain ridge, reflective foreground). Sits behind all
              live content; no text is baked into it. Left side is
              protected by a soft white fade so the editorial copy stays
              easy to read over it. */}
          <img
            className="oasrc-hero__bg"
            src="/assets/oas/risk-classification-hero-background.png"
            alt=""
            aria-hidden="true"
          />
          <div className="oasrc-hero__bg-fade" aria-hidden="true" />
          {/* Dust field + ridge-peak illumination + subtle pointer
              parallax — see OASRiskClassificationHeroMotion.jsx. Sits
              between the background/fade and the live text grid;
              never mounted under prefers-reduced-motion, so there's
              zero animation cost in that case. */}
          {!reducedMotion && <HeroMotion />}
          <div className="oasrc-hero__grid">
            <div className="oasrc-hero__copy">
              <p className="oasrc-eyebrow">Risk Classification</p>
              <h1 id="oasrc-hero-heading" className="oasrc-hero__heading">
                Risk
                <br />
                Classification
              </h1>
              <p className="oasrc-hero__body">
                Determines the level of risk an autonomous agent poses based on its capabilities, autonomy,
                context, and potential impact.
              </p>
              <hr className="oasrc-hero__rule" />
              <p className="oasrc-hero__tagline">
                Right controls.
                <br />
                Greater confidence.
              </p>
            </div>

            {/* Reserves the same footprint the Phase 1 placeholder used
                (so hero proportions/height are unaffected) — now that
                the background art fills this area, the placeholder's
                own ring/caption are gone rather than left floating over
                real art. Purely decorative spacing, hidden from
                assistive tech; nothing here carries information the
                page depends on. */}
            <div className="oasrc-hero__visual" aria-hidden="true" />
          </div>
        </section>

        {/* ---------------------------- Risk levels intro ---------------------------- */}
        <section className="oasrc-levels-intro" aria-labelledby="oasrc-levels-intro-heading">
          <div className="oas__container">
            <p className="oasrc-eyebrow">The Risk Levels</p>
            <h2 id="oasrc-levels-intro-heading" className="oasrc-levels-intro__heading">
              A clear model for real-world deployment.
            </h2>
            <p className="oasrc-levels-intro__body">
              OAS uses a five-level risk classification to scale governance, oversight, and control
              requirements based on the agent's capabilities and potential impact.
            </p>
          </div>
        </section>

        {/* ---------------------------- R0-R4 classification scale ---------------------------- */}
        <section className="oasrc-scale" aria-label="Risk classification levels R0 through R4">
          <div className="oas__container">
            <div className="oasrc-scale__field">
              {/* Base escalation gradient — the single source of truth
                  for each level's color (pale ivory at R0 through deep
                  rust at R4). Everything else (the landscape accent,
                  the curve, badge fills) reads its color from this
                  same palette, so there's only one place the five
                  target colors are ever defined. */}
              <div className="oasrc-scale__base" aria-hidden="true" />

              {/* Restrained decorative depth — a clipped diagonal
                  "rising ground" shape, not a second dominant graphic.
                  Purely atmospheric; it carries no information the
                  page depends on. */}
              <div className="oasrc-scale__landscape" aria-hidden="true" />

              {/* Static ascending curve with five points — a
                  conceptual escalation indicator, not a financial
                  chart. No animation. */}
              <svg
                className="oasrc-scale__curve"
                viewBox="0 0 1000 130"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M100,95 L300,85 L500,66.7 L700,43 L900,15" />
                <circle cx="100" cy="95" r="5" />
                <circle cx="300" cy="85" r="5" />
                <circle cx="500" cy="66.7" r="5" />
                <circle cx="700" cy="43" r="5" />
                <circle cx="900" cy="15" r="5" />
              </svg>

              <div className="oasrc-scale__grid">
                {LEVELS.map((l) => (
                  <div className={`oasrc-level oasrc-level--${l.n.toLowerCase()}`} key={l.n}>
                    <div className="oasrc-level__badge">{l.n}</div>
                    <p className="oasrc-level__title">
                      {l.title}
                      {l.sub && <span className="oasrc-level__sub">{l.sub}</span>}
                    </p>
                    <p className="oasrc-level__body">{l.body}</p>
                    <p className="oasrc-level__control">{l.control}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------- Supporting explanation row ---------------------------- */}
        <section className="oasrc-explain" aria-label="How risk classification works">
          <div className="oas__container oasrc-explain__grid">
            {EXPLAIN.map((e) => (
              <div className="oasrc-explain__col" key={e.title}>
                <span className="oasrc-explain__icon">{ICONS[e.icon](iconProps)}</span>
                <h3 className="oasrc-explain__title">{e.title}</h3>
                <p className="oasrc-explain__body">{e.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------------------- What changes by level? ---------------------------- */}
        <section className="oasrc-matrix-section" aria-labelledby="oasrc-matrix-heading">
          <div className="oas__container">
            <p className="oasrc-eyebrow">What Changes By Level?</p>
            <h2 id="oasrc-matrix-heading" className="oasrc-matrix-section__heading">
              Controls scale with risk.
            </h2>
            <p className="oasrc-matrix-section__body">
              As risk increases, so do the expectations for governance, human oversight, evidence, and
              deployment controls.
            </p>

            <div className="oasrc-matrix__scroll">
              <table className="oasrc-matrix">
                <caption className="oas__skip-link">Requirements compared across risk levels R0 through R4</caption>
                <thead>
                  <tr>
                    <th scope="col">Requirement</th>
                    {MATRIX_COLUMNS.map((c) => (
                      <th scope="col" key={c}>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MATRIX_ROWS.map((row) => (
                    <tr key={row.label}>
                      <th scope="row">{row.label}</th>
                      {row.values.map((v, i) => (
                        <td key={MATRIX_COLUMNS[i]} data-label={MATRIX_COLUMNS[i]}>
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ---------------------------- Bottom CTA band ---------------------------- */}
        <section className="oasrc-cta" aria-label="Apply the right level of control">
          <div className="oas__container oasrc-cta__row">
            <div className="oasrc-cta__left">
              <span className="oasrc-cta__icon">{ICONS.planet(iconProps)}</span>
              <div className="oasrc-cta__text">
                <p className="oasrc-cta__heading">Apply the right level of control.</p>
                <p className="oasrc-cta__body">
                  Risk classification helps align agent capabilities with appropriate safeguards, building a
                  safer, more open future.
                </p>
              </div>
            </div>

            <div className="oasrc-cta__actions">
              {/* Implementation isn't built yet (same as its header-nav
                  PlannedItem) — flagged the same way OAS1Page flags its
                  not-yet-real actions, so a solid rust button never
                  reads as live when it has nowhere to go. */}
              <PlannedItem>
                <span className="oas-btn oasrc-btn--rust oasrc-cta__primary">
                  Explore Implementation <span aria-hidden="true">→</span>
                  <span className="oasrc-cta__badge">Coming Soon</span>
                </span>
              </PlannedItem>
              <a className="oasrc-textlink" href="/oas-1.html">
                Read OAS-1 Specification <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <OASFooter />
    </div>
  );
}
