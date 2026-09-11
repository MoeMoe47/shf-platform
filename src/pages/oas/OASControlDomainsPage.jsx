// src/pages/oas/OASControlDomainsPage.jsx
//
// The OAS Control Domains page — answers "what are the eight areas OAS
// governs?" with a flywheel diagram plus a detail grid. Distinct from
// OAS1Page.jsx (a formal spec-document entry point) and
// OASLandingPage.jsx (the public homepage): this is a framework/system
// map page. Reuses the shared OAS header/footer/typography/button
// primitives from oasShared.jsx and oas-landing.css, with its own
// page-specific styles in oas-control-domains.css.
//
// Phase 1 (current): structure/spacing/proportions/responsiveness only.
// The flywheel is a placeholder (FlywheelPlaceholder below) reserving
// its final footprint — no center planet art, orbit graphics, glow, or
// animation yet; those are a later phase.
//
// Claims discipline: same as OAS-1 — no certification, adoption,
// Registry approval, or Trust Bureau assurance is claimed anywhere.
// This page purely explains the eight control domains already named on
// OAS-1; it introduces no new normative claims.
import React, { useState, useEffect, useRef, useCallback } from "react";
import "./oas-landing.css";
import "./oas-control-domains.css";
import { VenusMark, PlannedItem, AnchorLink, OASFooter } from "./oasShared.jsx";

const iconProps = {
  className: "oascd-icon",
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
  fingerprint: (p) => (
    <svg {...p}>
      <path d="M12 3a9 9 0 0 0-9 9c0 3 1 5 2 7" />
      <path d="M12 3a9 9 0 0 1 9 9c0 2-.3 3.5-1 5" />
      <path d="M8 9a4 4 0 0 1 8 0c0 5 1 8 2 10" />
      <path d="M12 9v2c0 5 1 7 3 9" />
      <path d="M8 13c0 4 1 6 3 8" />
    </svg>
  ),
  target: (p) => (
    <svg {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  ),
  gear: (p) => (
    <svg {...p}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.5v2.4M12 18.1v2.4M20.5 12h-2.4M5.9 12H3.5M17.8 6.2l-1.7 1.7M7.9 16.1l-1.7 1.7M17.8 17.8l-1.7-1.7M7.9 7.9 6.2 6.2" />
    </svg>
  ),
  key: (p) => (
    <svg {...p}>
      <circle cx="7.5" cy="16.5" r="3.8" />
      <path d="M10.5 13.5 19 5" />
      <path d="M15.5 9 18.5 12" />
      <path d="M13 11.5 15.5 14" />
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
  doc: (p) => (
    <svg {...p}>
      <rect x="6" y="3" width="12" height="18" rx="1.2" />
      <path d="M9 8h6M9 12h6M9 16h3.5" />
    </svg>
  ),
  cycle: (p) => (
    <svg {...p}>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.6-5.7" />
      <path d="M20.5 4.2 19.5 8.4l-4.2-1" />
    </svg>
  ),
};

// Canonical order, copy, and per-node radial position — matches the
// approved mock's exact placement (top, then clockwise).
const DOMAINS = [
  {
    n: "01",
    title: "Identity & Ownership",
    icon: "fingerprint",
    pos: "top",
    body: "Establishes clear identity, provenance and ownership for agents, ensuring accountability throughout their lifecycle.",
  },
  {
    n: "02",
    title: "Purpose & Boundaries",
    icon: "target",
    pos: "upper-right",
    body: "Defines what the agent is intended to do, including its goals, scope and operational boundaries.",
  },
  {
    n: "03",
    title: "Capabilities & Resources",
    icon: "gear",
    pos: "right",
    body: "Specifies the agent's capabilities, required resources and any external tools or systems it can access.",
  },
  {
    n: "04",
    title: "Permissions & Access",
    icon: "key",
    pos: "lower-right",
    body: "Controls what the agent can access, including data, systems and actions, with appropriate authorization mechanisms.",
  },
  {
    n: "05",
    title: "Safety & Prohibited Actions",
    icon: "shield",
    pos: "bottom",
    body: "Defines safety requirements, prohibited actions and guardrails to prevent harmful behavior.",
  },
  {
    n: "06",
    title: "Human Authority",
    icon: "people",
    pos: "lower-left",
    body: "Clarifies human oversight, authority structures and escalation paths for critical decisions.",
  },
  {
    n: "07",
    title: "Validation & Evidence",
    icon: "doc",
    pos: "left",
    body: "Establishes verification methods, performance monitoring and evidence requirements.",
  },
  {
    n: "08",
    title: "Lifecycle & Accountability",
    icon: "cycle",
    pos: "upper-left",
    body: "Covers the full lifecycle from development to decommissioning, including ongoing accountability and impact assessment.",
  },
];

// Screen-space angles (SVG y grows downward): top = -90deg, then every
// 45deg clockwise — matches the approved mock's exact node order and
// placement (01 top, 02 upper-right, ... 08 upper-left).
const NODE_ANGLES = {
  top: (-90 * Math.PI) / 180,
  "upper-right": (-45 * Math.PI) / 180,
  right: (0 * Math.PI) / 180,
  "lower-right": (45 * Math.PI) / 180,
  bottom: (90 * Math.PI) / 180,
  "lower-left": (135 * Math.PI) / 180,
  left: (180 * Math.PI) / 180,
  "upper-left": (-135 * Math.PI) / 180,
};

// Flywheel geometry, in the 0-840 coordinate space used by both the
// connector SVG (viewBox="0 0 840 840") and the CSS percentage
// positions on .oascd-flywheel (measured against the approved mock:
// there, the node-center orbit sits at roughly 1.88x the planet's own
// radius — these constants preserve that ratio at the larger scale
// this pass calls for). All of it scales together with .oascd-flywheel
// at each responsive breakpoint since everything below is expressed as
// percentages of that shared 840 reference.
const FW = 840;
const CENTER = FW / 2;
const PLANET_R = 165; // 330px diameter
const ORBIT_R = 290; // node-center radius — tightened from 310 for a denser, more unified wheel
const NODE_R = 56; // 112px diameter

// ---------------------------- Domain activation state ----------------------------
// One canonical activeDomain value (a domain number string, e.g. "01")
// drives every synchronized visual: the flywheel node, its connector,
// and the matching lower-grid entry. Nothing duplicates this state —
// the flywheel and the lower grid both just read the same value from
// this hook, passed down from OASControlDomainsPage.
const DWELL_MS = 1900; // time each domain stays active in auto-cycle (1.6-2.2s target)
const RESUME_DELAY_MS = 900; // delay before auto-cycle resumes after hover/focus/click ends (700-1200ms target)

function useDomainCycle() {
  const [activeDomain, setActiveDomain] = useState(DOMAINS[0].n);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const resumeTimerRef = useRef(null);

  // Auto-cycle start state is Phase 1 identity ("01"), per spec — not
  // "no active state."
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handleChange = (e) => setReducedMotion(e.matches);
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    // Reduced motion disables the auto-sequence entirely — the page
    // stays on whichever domain is currently active (still fully
    // understandable/readable, just not auto-advancing).
    if (paused || reducedMotion) return undefined;
    const id = setInterval(() => {
      setActiveDomain((prev) => {
        const idx = DOMAINS.findIndex((d) => d.n === prev);
        return DOMAINS[(idx + 1) % DOMAINS.length].n;
      });
    }, DWELL_MS);
    return () => clearInterval(id);
  }, [paused, reducedMotion]);

  useEffect(
    () => () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    },
    []
  );

  // Hover, focus, and click all funnel through this one function —
  // simple by design (per the task's own "keep implementation simple"
  // instruction) rather than separate hover/click state machines.
  const activate = useCallback((n) => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
    setActiveDomain(n);
    setPaused(true);
  }, []);

  // Called on mouseleave/blur — covers both "resume after hover ends"
  // and "resume when focus/selection leaves" with the same mechanism.
  const release = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      setPaused(false);
      resumeTimerRef.current = null;
    }, RESUME_DELAY_MS);
  }, []);

  return { activeDomain, activate, release, reducedMotion };
}

// Phase 1 reserved the flywheel's footprint. Phase 2 added a CSS
// atmosphere. Phase 3 placed the real center planet + live "OAS /
// EIGHT DOMAINS" text. Phase 4 swapped in the approved design-texture
// background. The hero-fidelity pass scaled the planet/orbit and added
// the real 8 domain nodes with connector lines. This pass adds the
// interaction/motion layer: auto-cycling activation, hover/click/
// keyboard, synced to the lower domain grid via activeDomain.
//
// No role="img"/aria-label on the outer wrapper: it contains real live
// text (planet label, all 8 node labels/buttons), and an img role on
// an ancestor would flatten that text out of the accessibility tree.
// Each decorative piece (planet image, halo, rings, connectors) is
// hidden individually instead.
function Flywheel({ activeDomain, onActivate, onRelease }) {
  return (
    <div className="oascd-flywheel">
      {/* Decorative connector lines only — which domain is which is
          carried entirely by each node's own live label text. */}
      <svg className="oascd-flywheel__connectors" viewBox={`0 0 ${FW} ${FW}`} aria-hidden="true" focusable="false">
        {DOMAINS.map((d, i) => {
          const a = NODE_ANGLES[d.pos];
          const rIn = PLANET_R + 10;
          const rOut = ORBIT_R - NODE_R - 8;
          const x1 = CENTER + Math.cos(a) * rIn;
          const y1 = CENTER + Math.sin(a) * rIn;
          const x2 = CENTER + Math.cos(a) * rOut;
          const y2 = CENTER + Math.sin(a) * rOut;
          const dotX = CENTER + Math.cos(a) * ((rIn + rOut) / 2);
          const dotY = CENTER + Math.sin(a) * ((rIn + rOut) / 2);
          const isActive = d.n === activeDomain;
          return (
            <g key={d.n}>
              <line
                className={`oascd-flywheel__connector${isActive ? " oascd-flywheel__connector--active" : ""}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                markerEnd={i === 1 ? "url(#oascd-arrow)" : undefined}
              />
              <circle
                className={`oascd-flywheel__connector-dot${isActive ? " oascd-flywheel__connector-dot--active" : ""}`}
                cx={dotX}
                cy={dotY}
                r="3"
              />
            </g>
          );
        })}
        <defs>
          <marker id="oascd-arrow" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" className="oascd-flywheel__connector-arrow" />
          </marker>
        </defs>
      </svg>

      <div className="oascd-flywheel__ring oascd-flywheel__ring--outer" aria-hidden="true" />
      <div className="oascd-flywheel__ring oascd-flywheel__ring--mid" aria-hidden="true" />
      <div className="oascd-flywheel__ring oascd-flywheel__ring--orbit" aria-hidden="true" />
      <span className="oascd-flywheel__guide oascd-flywheel__guide--1" aria-hidden="true" />
      <span className="oascd-flywheel__guide oascd-flywheel__guide--2" aria-hidden="true" />

      <div className="oascd-planet">
        <div className="oascd-planet__halo" aria-hidden="true" />
        <img
          className="oascd-planet__img"
          src="/assets/oas/control-domains-center-planet.png"
          alt=""
          aria-hidden="true"
        />
        <div className="oascd-planet__sheen" aria-hidden="true" />
        <div className="oascd-planet__label">
          <span className="oascd-planet__mark">OAS</span>
          <span className="oascd-planet__sub">Eight Domains</span>
        </div>
      </div>

      {DOMAINS.map((d) => {
        const isActive = d.n === activeDomain;
        return (
          <button
            type="button"
            className={`oascd-node oascd-node--${d.pos}${isActive ? " oascd-node--active" : ""}`}
            key={d.n}
            aria-current={isActive ? "true" : undefined}
            onMouseEnter={() => onActivate(d.n)}
            onMouseLeave={onRelease}
            onFocus={() => onActivate(d.n)}
            onBlur={onRelease}
            onClick={() => onActivate(d.n)}
          >
            <span className="oascd-node__circle">{ICONS[d.icon](iconProps)}</span>
            <span className="oascd-node__label">
              <span className="oascd-node__num">{d.n}</span>
              <span className="oascd-node__title">{d.title}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function OASControlDomainsPage() {
  const [navOpen, setNavOpen] = useState(false);
  const { activeDomain, activate, release } = useDomainCycle();

  return (
    <div className="oas oascd">
      <a className="oas__skip-link" href="#oascd-main">
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
            aria-controls="oascd-primary-nav"
            aria-label="Toggle navigation menu"
            onClick={() => setNavOpen((v) => !v)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>

          <nav
            id="oascd-primary-nav"
            className={`oas-header__nav${navOpen ? " oas-header__nav--open" : ""}`}
            aria-label="Primary"
          >
            <AnchorLink href="/oas.html#why-oas">About</AnchorLink>
            <AnchorLink href="/oas-1.html">OAS-1</AnchorLink>
            <span className="oascd-nav-active" aria-current="page">
              Control Domains
            </span>
            <PlannedItem>Risk</PlannedItem>
            <PlannedItem>Conformance</PlannedItem>
            <PlannedItem>Schemas</PlannedItem>
            <PlannedItem>Implementation</PlannedItem>
            <AnchorLink href="/oas.html#site-footer">Governance</AnchorLink>
          </nav>

          <div className="oas-header__cta">
            <a className="oas-btn oascd-btn--rust" href="/oas-1.html">
              Read OAS-1
            </a>
          </div>
        </div>
      </header>

      <main id="oascd-main">
        {/* ---------------------------- Framework intro + flywheel ---------------------------- */}
        <section className="oascd-intro" aria-labelledby="oascd-intro-heading">
          {/* Final approved background art — supersedes the earlier
              Phase 4 "design-texture" asset (still present on disk at
              control-domains-design-texture-background.png but no
              longer referenced anywhere, so no two background PNGs are
              ever stacked). Provides the lower-left planetary horizon,
              the right-side orbital ring/halo system, and general
              atmosphere in one image. Purely decorative: empty alt +
              aria-hidden, no information depends on it. object-position
              is tuned so the image's own ring-system center lands
              behind the live center planet (see oas-control-domains.css
              for the measurement). */}
          <img
            className="oascd-intro__texture"
            src="/assets/oas/control-domains-final-background.png"
            alt=""
            aria-hidden="true"
          />
          {/* Protects the left editorial column: a plain white fade,
              not a mask on the texture image itself, so it's simple
              and reliable across browsers. */}
          <div className="oascd-intro__texture-fade" aria-hidden="true" />

          {/* Quiet right-margin micro-copy from the approved mock — a
              supporting flourish (same spirit as the OAS-1 hero's
              OPEN/TRANSPARENT/COLLABORATIVE word list), not primary
              content. aria-hidden since it's decorative typographic
              texture, not information the page depends on. */}
          <p className="oascd-intro__micro oascd-intro__micro--top-right" aria-hidden="true">
            A safer
            <br />
            more open
            <br />
            tomorrow
          </p>
          <p className="oascd-intro__micro oascd-intro__micro--bottom-right" aria-hidden="true">
            Standards
            <br />
            for a brighter
            <br />
            tomorrow
          </p>
          <p className="oascd-intro__micro oascd-intro__micro--bottom-left" aria-hidden="true">
            People / Agents / A more open tomorrow
          </p>

          <div className="oascd-intro__grid">
            <div className="oascd-intro__copy">
              <p className="oascd-eyebrow">The Framework</p>
              <h1 id="oascd-intro-heading" className="oascd-intro__heading">
                The Eight
                <br />
                Control Domains
              </h1>
              <p className="oascd-intro__body">
                OAS-1 is built on eight control domains that work together to ensure autonomous agents are
                safe, transparent, and beneficial.
              </p>
              <a className="oascd-textlink" href="/oas.html#why-oas">
                A shared standard for a more open future. <span aria-hidden="true">→</span>
              </a>
            </div>

            <Flywheel activeDomain={activeDomain} onActivate={activate} onRelease={release} />
          </div>
        </section>

        {/* ---------------------------- Lower atmosphere (shared by domain details + Stronger Together) ----------------------------
            One background layer behind both sections (not two separate
            images) so the domain grid and the closing band read as one
            continuous environment rather than two independently-white
            blocks. Same approved asset used once — no stacking of
            multiple large PNGs. Purely decorative: empty alt +
            aria-hidden, no information depends on it. Mirrored
            horizontally so its planetary horizon lands bottom-LEFT,
            continuing the hero's own bottom-left planet rather than
            introducing a second one on the opposite side. */}
        <div className="oascd-lower">
          <img
            className="oascd-lower__texture"
            src="/assets/oas/control-domains-lower-background.png"
            alt=""
            aria-hidden="true"
          />

          {/* ---------------------------- Domain details ---------------------------- */}
          <section className="oascd-details" aria-labelledby="oascd-details-heading">
          <div className="oas__container oascd-details__grid">
            <div className="oascd-details__intro">
              <p className="oascd-eyebrow">The Domains</p>
              <h2 id="oascd-details-heading" className="oascd-details__heading">
                A closer look
                <br />
                at each domain.
              </h2>
              <p className="oascd-details__body">
                Each domain addresses a critical aspect of autonomous agent behavior. Together, they form a
                comprehensive framework for trustworthy, real-world deployment across diverse contexts.
              </p>
            </div>

            <div className="oascd-details__list">
              {DOMAINS.map((d) => (
                <div
                  className={`oascd-detail${d.n === activeDomain ? " oascd-detail--active" : ""}`}
                  key={d.n}
                >
                  <span className="oascd-detail__icon">{ICONS[d.icon](iconProps)}</span>
                  <span className="oascd-detail__head">
                    <span className="oascd-detail__num">{d.n}</span>
                    <span className="oascd-detail__title">{d.title}</span>
                  </span>
                  <p className="oascd-detail__body">{d.body}</p>
                </div>
              ))}
            </div>
          </div>
          </section>

          {/* ---------------------------- Stronger together band ---------------------------- */}
          <section className="oascd-together" aria-labelledby="oascd-together-heading">
          <div className="oas__container oascd-together__panel">
            <div className="oascd-together__left">
              <svg className="oascd-together__mark" viewBox="0 0 48 32" aria-hidden="true" focusable="false">
                <circle cx="18" cy="16" r="13.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="30" cy="16" r="13.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
              </svg>
              <div className="oascd-together__text">
                <h2 id="oascd-together-heading" className="oascd-together__heading">
                  Stronger together.
                </h2>
                <p className="oascd-together__body">
                  The eight control domains work as an integrated system, creating multiple layers of
                  assurance that enable autonomous agents to deliver real-world value safely and
                  responsibly.
                </p>
              </div>
            </div>

            <div className="oascd-together__right">
              <a className="oas-btn oascd-btn--rust" href="/oas.html#what-oas-governs">
                Explore the Full Framework
              </a>
              <a className="oascd-textlink" href="/oas-1.html">
                View OAS-1 Specification <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
          </section>
        </div>
      </main>

      <OASFooter />
    </div>
  );
}
