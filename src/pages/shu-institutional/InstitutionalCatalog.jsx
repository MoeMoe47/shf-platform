import React, { useState } from "react";
import CosmicScene from "../../components/cosmic/CosmicScene.jsx";
import "./institutional-catalog.css";

const planetBase = "/assets/universe/planets/";

const areas = [
  {
    id: "curriculum",
    title: "Curriculum",
    image: "shu-planet-cratered-transparent-01.png",
  },
  {
    id: "licensing",
    title: "Licensing",
    image: "shu-planet-ringed-giant-02.png",
  },
  {
    id: "readiness",
    title: "Grant Readiness",
    image: "shu-planet-earth-01.png",
  },
  {
    id: "workforce",
    title: "Workforce",
    image: "shu-planet-banded-giant-01.png",
  },
  {
    id: "compare",
    title: "Compare Solutions",
    image: "shu-planet-cratered-02.png",
  },
];

const solutions = [
  {
    id: "curriculum",
    symbol: "◈",
    title: "Curriculum & Programs",
    description: "Explore institutional learning paths, courses, curriculum packages, and educational resources.",
  },
  {
    id: "workforce",
    symbol: "♧",
    title: "Workforce Solutions",
    description: "Discover career-connected education, training pathways, and workforce development programs.",
  },
  {
    id: "licensing",
    symbol: "◇",
    title: "Institutional Licensing",
    description: "Review educational licensing models, institutional access, and delivery options.",
  },
  {
    id: "readiness",
    symbol: "✧",
    title: "Grant Readiness",
    description: "Explore pre-award funding alignment, curriculum evidence, readiness gaps, and dossier planning.",
  },
  {
    id: "compare",
    symbol: "⚖",
    title: "Compare Solutions",
    description: "Compare educational programs, curriculum packages, and institutional capabilities.",
  },
  {
    id: "implementation",
    symbol: "↗",
    title: "Implementation Support",
    description: "Plan organizational onboarding, instructional delivery, and implementation requirements.",
  },
  {
    id: "arcade",
    symbol: "✦",
    title: "Learning Arcade",
    description: "Explore interactive learning, educational simulations, and practice-based experiences.",
  },
  {
    id: "instructors",
    symbol: "▤",
    title: "Instructor Resources",
    description: "Discover teaching guides, instructional materials, lesson plans, and facilitator support.",
  },
  {
    id: "assessments",
    symbol: "✓",
    title: "Assessments & Evidence",
    description: "Explore learning assessments, demonstrated outcomes, and educational evidence.",
  },
  {
    id: "careers",
    symbol: "⌁",
    title: "Career Pathways",
    description: "Connect educational programs with industry skills, career exploration, and workforce preparation.",
  },
  {
    id: "cohorts",
    symbol: "♧",
    title: "Cohort Planning",
    description: "Plan learner groups, program delivery models, instructor requirements, and training schedules.",
  },
  {
    id: "partnerships",
    symbol: "◇",
    title: "Institutional Partnerships",
    description: "Explore educational collaboration, community delivery arrangements, and workforce partnerships.",
  },
];

const highlights = [
  ["◈", "Guided + Expert Modes"],
  ["▦", "Curriculum Evidence Explorer"],
  ["⌁", "What-If Readiness Simulator"],
  ["▤", "Readiness Dossier"],
];

export default function InstitutionalCatalog() {
  const [query, setQuery] = useState("");

  const filtered = solutions.filter((item) =>
    `${item.title} ${item.description}`
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  );

  return (
    <div className="shuic">
      <div className="shuic-background" aria-hidden="true">
        <img
          src="/assets/shu/SHU_DIRECTORY_BACKGROUND_MASTER_V2.png"
          alt=""
        />
        <div className="shuic-background-shade" />
      </div>

      <CosmicScene />
      <header className="shuic-header">
        <a className="shuic-logo" href="/universe">
          <span className="ugw-brandMark" aria-hidden="true"><span /></span>
          <span>
            SILICON HEARTLAND
            <strong>UNIVERSE</strong>
          </span>
        </a>

        <nav aria-label="Institutional navigation">
          <a href="#solutions">Explore</a>
          <a href="#curriculum">Learn</a>
          <a href="#workforce">Work</a>
          <a href="#licensing">Build</a>
          <a href="#readiness">Grant Readiness</a>
        </nav>

        <a className="shuic-header-button" href="/universe">
          Back to Universe ↗
        </a>
      </header>

      <main className="shuic-main">
        <section className="shuic-hero">
          <div className="shuic-intro">
            <p className="shuic-eyebrow">INSTITUTIONAL SOLUTIONS</p>

            <h1>
              Build the future of learning and workforce opportunity.
            </h1>

            <p className="shuic-subtitle">
              Discover curriculum, workforce pathways, institutional
              licensing, and grant readiness solutions designed for
              schools, colleges, nonprofits, and workforce organizations.
            </p>

            <form
              className="shuic-search"
              role="search"
              onSubmit={(event) => {
                event.preventDefault();
                document.getElementById("solutions")?.scrollIntoView();
              }}
            >
              <label htmlFor="shuic-search" className="shuic-sr">
                Search institutional solutions
              </label>
              <span aria-hidden="true">⌕</span>
              <input
                id="shuic-search"
                type="search"
                placeholder="Search programs, licensing, workforce, grants..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button aria-label="View matching solutions" type="submit">
                →
              </button>
            </form>

            <div className="shuic-actions">
              <a className="shuic-primary" href="#solutions">
                Explore Solutions →
              </a>
              <a className="shuic-secondary" href="#readiness">
                Grant Readiness →
              </a>
            </div>


          </div>

          <div className="shuic-cosmic-placeholder" aria-hidden="true" />
        </section>

        <section
          id="solutions"
          className="shuic-solutions"
          aria-labelledby="shuic-solutions-title"
        >
          <p className="shuic-eyebrow" id="shuic-solutions-title">
            EXPLORE INSTITUTIONAL SOLUTIONS
          </p>

          <p className="shuic-preview-label shuic-preview-in-solutions">Institutional Catalog · Development Preview</p>

          <div className="shuic-card-grid">
            {filtered.map((item) => (
              <article
                key={item.id}
                id={item.id}
                className={`shuic-card ${
                  item.id === "readiness" ? "shuic-card-featured" : ""
                }`}
              >
                <span className="shuic-card-icon" aria-hidden="true">
                  {item.symbol}
                </span>
                <div>
                  <h2>{item.title}</h2>
                  <p>{item.description}</p>
                  <small>Experience preview</small>
                </div>
                <span className="shuic-card-arrow" aria-hidden="true">→</span>
              </article>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="shuic-no-results" role="status">
              No matching solutions. Try a different search.
            </p>
          )}
        </section>


        {/* SHUIC_INSTITUTIONAL_LOWER_V1 */}
        <section className="shuic-journey" id="institutional-path">
          <div className="shuic-journey-left">
            <div className="shuic-section-heading">
              <p className="shuic-eyebrow">YOUR INSTITUTIONAL PATH</p>
              <p>Follow a guided path to plan, build, implement, and grow.</p>
            </div>

            <div className="shuic-journey-diagram">
              <div className="shuic-journey-stages">
                {[
                  ["01", "Plan", "Assess needs and set goals."],
                  ["02", "Build", "Select programs and resources."],
                  ["03", "Implement", "Launch, train, and deliver."],
                ].map(([n, label, desc]) => (
                  <div className="shuic-journey-stage" key={n}>
                    <span className="shuic-stage-number">{n}</span>
                    <div>
                      <strong>{label}</strong>
                      <p>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="shuic-success-sun">
                <span>Institutional</span>
                <strong>Success Path</strong>
              </div>

              <div className="shuic-journey-stages">
                {[
                  ["04", "Measure", "Track outcomes and impact."],
                  ["05", "Expand", "Add programs and partnerships."],
                  ["06", "Sustain", "Grow long-term opportunity."],
                ].map(([n, label, desc]) => (
                  <div className="shuic-journey-stage" key={n}>
                    <span className="shuic-stage-number">{n}</span>
                    <div>
                      <strong>{label}</strong>
                      <p>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <a className="shuic-journey-action" href="#solutions">
              Start Your Institutional Path <span aria-hidden="true">→</span>
            </a>
          </div>

          <div className="shuic-resources" id="institutional-resources">
            <div className="shuic-section-heading">
              <p className="shuic-eyebrow">INSTITUTIONAL RESOURCES</p>
              <p>Tools and guidance from planning to measurable impact.</p>
            </div>

            {[
              ["▤", "Implementation Guide",
               "Plan organizational onboarding and delivery.", "#implementation"],
              ["◈", "Funding & Grant Readiness",
               "Explore pre-award funding alignment and evidence.", "#readiness"],
              ["⚖", "Compare Solutions",
               "Evaluate curriculum, licensing, and delivery options.", "#compare"],
              ["◎", "Institutional Partnerships",
               "Explore collaboration and support pathways.", "#partnerships"],
            ].map(([symbol, title, description, href]) => (
              <a className="shuic-resource" href={href} key={title}>
                <span className="shuic-resource-icon" aria-hidden="true">
                  {symbol}
                </span>
                <span className="shuic-resource-text">
                  <strong>{title}</strong>
                  <small>{description}</small>
                </span>
                <span className="shuic-resource-arrow" aria-hidden="true">→</span>
              </a>
            ))}
          </div>
        </section>

<section className="shuic-highlights" aria-label="Platform highlights">
          <div className="shuic-highlights-title">
            <p className="shuic-eyebrow">PLATFORM HIGHLIGHTS</p>
            <p>Tools for institutional planning and decision-making.</p>
          </div>
          {highlights.map(([symbol, title]) => (
            <div className="shuic-highlight" key={title}>
              <span aria-hidden="true">{symbol}</span>
              <strong>{title}</strong>
            </div>
          ))}
        </section>


        <footer className="shuic-footer shuic-universe-footer">
          <a
            className="shuic-universe-brand"
            href="/universe"
            aria-label="Silicon Heartland Universe home"
          >
            <span className="ugw-brandMark" aria-hidden="true"><span /></span>
            <span className="shuic-universe-brand-text">
              SILICON HEARTLAND
              <strong>UNIVERSE</strong>
            </span>
          </a>

          <p>A Stronger Region. A Brighter Tomorrow.</p>

          <nav aria-label="Universe footer navigation">
            <a href="/universe">Universe</a>
            <a href="#solutions">Explore</a>
            <a href="#readiness">Grant Readiness</a>
            <a href="/universe/directory">Directory</a>
          </nav>
        </footer>
      </main>
    </div>
  );
}
