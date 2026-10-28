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
// Website summary of the frozen published release; normative files remain unchanged.
import React from "react";
import "./oas-landing.css";
import "./oas1-page.css";
import { oasRelease } from "./oasRelease.js";
import { oasDomains } from "./oasStandard.js";
import { OASHeader, PlannedItem, OASFooter } from "./oasShared.jsx";

// Public standard navigation for the surfaces currently published.
// Governance, developer tooling, conformance, SDKs, CLI, and later
// interoperability work remain outside this Batch 2 presentation scope.
const STANDARD_NAV = [
  { number: "01", label: "Overview", href: "#oas1-covers" },
  { number: "02", label: "Purpose & Boundaries", href: "/oas-purpose-boundaries.html" },
  { number: "03", label: "Control Domains", href: "/oas-control-domains.html" },
  { number: "04", label: "Requirements", href: "#requirements" },
  { number: "05", label: "Risk Classification", href: "/oas-risk-classification.html" },
  { number: "06", label: "Release Artifacts", href: "#read-the-standard" },
];

const QUICK_FACTS = [
  { label: "Version", value: oasRelease.id, icon: "edit" },
  { label: "Status", value: "Frozen published release", icon: "clock" },
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

function ActionRow({ icon, title, comingSoon = false, description, href = undefined }) {
  const Tag = href ? "a" : "span";
  return (
    <Tag className="oas1-action" href={href} aria-disabled={href ? undefined : true} title={href ? undefined : "Planned — not yet published"}>
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
    </Tag>
  );
}

export default function OAS1Page() {
  return (
    <div className="oas oas1">
      <a className="oas__skip-link" href="#oas1-main">
        Skip to main content
      </a>

      {/* ---------------------------- Header ---------------------------- */}
      <OASHeader current="/oas-1.html" />

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

            <div className="oas1-hero__visual oas1-release-summary">
              <p>{oasRelease.name}</p><h2>{oasRelease.id}</h2>
              <p>Frozen published release · {oasRelease.publicationDate}</p>
              <p>{oasRelease.requirements} requirements · {oasRelease.domains} domains</p>
              <p>Declaration contract {oasRelease.declarationContract}</p>
              <p>{oasRelease.evaluationStatus}</p>
              <a className="oas-btn oas1-btn--ghost-on-dark" href={oasRelease.humanUrl}>Read OAS 1.0</a>
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
                {oasDomains.map((domain) => (
                  <a
                    className="oas1-domain"
                    key={domain.id}
                    href={`/oas-control-domains.html#${domain.anchor}`}
                  >
                    <span className="oas1-domain__num">{domain.number}</span>
                    <span className="oas1-domain__label">{domain.title}</span>
                  </a>
                ))}
              </div>

              <a className="oas1-textlink" href="/oas-control-domains.html">
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
                {STANDARD_NAV.map((item) => (
                  <li className="oas1-toc__item" key={item.label}>
                    <span className="oas1-toc__num">{item.number}</span>
                    <a className="oas1-toc__title" href={item.href}>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ol>
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
                <ActionRow icon="doc" title="Read OAS 1.0" href={oasRelease.humanUrl} description="The frozen human-readable standard (Markdown)." />
                <ActionRow icon="download" title="Download PDF" comingSoon description="A printable version of the OAS-1 standard." />
                <ActionRow icon="code" title="Machine-readable JSON" href={oasRelease.artifactUrl} description="The frozen release catalog, including all canonical requirements." />
                <ActionRow icon="code" title="Currentness metadata" href={oasRelease.currentnessUrl} description="Published release observation and file checksum." />
                <ActionRow icon="code" title="Declaration schema" href={oasRelease.declarationSchemaUrl} description={`Published declaration contract ${oasRelease.declarationContract}; no assessment implied.`} />
              </div>

              <details className="oas-release-checksums"><summary>Release checksums (SHA-256)</summary>
                <dl><dt>Artifact file</dt><dd>{oasRelease.artifactChecksum}</dd>
                <dt>Requirements</dt><dd>{oasRelease.requirementsChecksum}</dd>
                <dt>Scope</dt><dd>{oasRelease.scopeChecksum}</dd></dl>
              </details>
              {/* ---------------------------- Normative Notice ---------------------------- */}
              <p className="oas1-notice">
                <span className="oas1-notice__icon">{ICONS.info(iconProps)}</span>
                This page provides an overview. The OAS-1 Specification contains the normative requirements.
              </p>
            </div>
          </div>
        </section>

        {/* ---------------------------- Canonical requirements ---------------------------- */}
        <section
          className="oas1-requirements"
          id="requirements"
          aria-labelledby="oas1-requirements-heading"
        >
          <div className="oas__container">
            <div className="oas1-requirements__intro">
              <p className="oas__eyebrow">Normative requirements</p>

              <h2 id="oas1-requirements-heading" className="oas1-requirements__heading">
                The 14 requirements of OAS-1.
              </h2>

              <p className="oas1-requirements__lead">
                The requirement IDs and normative text below are derived directly from the frozen
                {` ${oasRelease.id} `}release catalog. Domain names are informative presentation
                labels used to organize the published requirements.
              </p>

              <p className="oas1-requirements__boundary">
                Publication defines the standard. It does not certify, assess, endorse, or
                behaviorally verify any provider or autonomous system. Provider declarations remain
                {` ${oasRelease.evaluationStatus}`}.
              </p>
            </div>

            <nav className="oas1-requirements__domain-nav" aria-label="Requirement domains">
              {oasDomains.map((domain) => (
                <a key={domain.id} href={`#requirements-${domain.slug}`}>
                  <span>{domain.number}</span>
                  {domain.title}
                </a>
              ))}
            </nav>

            <div className="oas1-requirements__domains">
              {oasDomains.map((domain) => (
                <section
                  className="oas1-requirement-domain"
                  id={`requirements-${domain.slug}`}
                  key={domain.id}
                  aria-labelledby={`requirements-${domain.slug}-heading`}
                >
                  <header className="oas1-requirement-domain__header">
                    <div>
                      <p className="oas1-requirement-domain__id">
                        Domain {domain.number} · {domain.id}
                      </p>

                      <h3
                        className="oas1-requirement-domain__title"
                        id={`requirements-${domain.slug}-heading`}
                      >
                        {domain.title}
                      </h3>
                    </div>

                    <a
                      className="oas1-requirement-domain__domain-link"
                      href={`/oas-control-domains.html#${domain.anchor}`}
                    >
                      View domain →
                    </a>
                  </header>

                  <ol className="oas1-requirement-list">
                    {domain.requirements.map((requirement) => (
                      <li
                        className="oas1-requirement"
                        id={requirement.anchor}
                        key={requirement.requirement_id}
                      >
                        <div className="oas1-requirement__meta">
                          <a
                            className="oas1-requirement__id"
                            href={`#${requirement.anchor}`}
                          >
                            {requirement.requirement_id}
                          </a>

                          <span className="oas1-requirement__badge">Normative</span>

                          <span className="oas1-requirement__status">
                            {requirement.status}
                          </span>
                        </div>

                        <p className="oas1-requirement__text">
                          {requirement.normative_text}
                        </p>

                        <dl className="oas1-requirement__facts">
                          <div>
                            <dt>Release</dt>
                            <dd>{requirement.release_id}</dd>
                          </div>

                          <div>
                            <dt>Domain</dt>
                            <dd>
                              <a href={`/oas-control-domains.html#${domain.anchor}`}>
                                {requirement.domain_id}
                              </a>
                            </dd>
                          </div>

                          <div>
                            <dt>Evaluation</dt>
                            <dd>{oasRelease.evaluationStatus}</dd>
                          </div>
                        </dl>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </div>

            <p className="oas1-requirements__source">
              Normative source:{" "}
              <a href={oasRelease.artifactUrl}>
                {oasRelease.id} machine-readable catalog
              </a>
              .
            </p>
          </div>
        </section>
      </main>

      <OASFooter />
    </div>
  );
}
