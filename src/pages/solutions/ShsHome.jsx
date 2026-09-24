import React, { useMemo, useState } from "react";
import ShsHeader from "@/components/solutions/ShsHeader.jsx";
import ShsFooter from "@/components/solutions/ShsFooter.jsx";
import ShsImageTile from "@/components/solutions/ShsImageTile.jsx";
// Neutral infrastructure photography (server room / welding) — no people, no
// nonprofit/education/community subject matter, independently verified as
// generic stock content rather than SHF-specific branding or programming.
import dataCenterPhoto from "@/assets/store/catalog/data-center.webp";
import industrialPhoto from "@/assets/brand/hero-welder.png";
import "./shs-home.css";

// SHS-specific imagery cropped directly from the approved SHS mock
// (see docs/SHS_HOME_AND_BOS_MIGRATION.md for the full derivation log).
// Served from /public so no bundler import is needed.
const heroPhoto = "/assets/shs/home/shs-home-hero.jpg";
const finalCtaPhoto = "/assets/shs/home/shs-final-cta.jpg";
const solutionPhotos = {
  bos: "/assets/shs/home/shs-bos.jpg",
  civicsure: "/assets/shs/home/shs-civicsure.jpg",
  aiWorkforce: "/assets/shs/home/shs-ai-workforce.jpg",
  studio: "/assets/shs/home/shs-studio.jpg",
  govern: "/assets/shs/home/shs-govern.jpg",
};
const industryPhotos = {
  government: "/assets/shs/home/shs-industry-government.jpg",
  education: "/assets/shs/home/shs-industry-education.jpg",
  nonprofits: "/assets/shs/home/shs-industry-nonprofits.jpg",
  healthcare: "/assets/shs/home/shs-industry-healthcare.jpg",
  workforce: "/assets/shs/home/shs-industry-workforce.jpg",
  community: "/assets/shs/home/shs-industry-community.jpg",
};
const successStoryPhoto = "/assets/shs/home/shs-success-story.jpg";

const CAPABILITIES = [
  { icon: "⚙", title: "Operational Systems", text: "BOS, process design, organizational transformation." },
  { icon: "◈", title: "AI & Automation", text: "Governed AI workforce, agents and intelligent operations." },
  { icon: "⛨", title: "Public Assurance", text: "CivicSure, verification infrastructure and program accountability." },
  { icon: "≡", title: "Digital Infrastructure", text: "Data, cloud, network and systems architecture." },
  { icon: "⚒", title: "Build & Implementation", text: "Studio, applications, integrations and custom operational solutions." },
  { icon: "◉", title: "Governance & Trust", text: "Policy, evidence, security, controls and institutional compliance." },
];

const REGION_STATES = ["OH", "MI", "PA", "WV", "IN"];

const REGION_CATEGORIES = [
  "Data Centers",
  "Energy & Power",
  "Broadband & Fiber",
  "Industrial & Manufacturing",
  "Education & Workforce",
  "Government & Civic",
  "Community Development",
];

const ENGAGEMENT_AREAS = [
  { icon: "\u{1F3E2}", label: "Projects & Engagements" },
  { icon: "\u{1F465}", label: "Public & Private Partners" },
  { icon: "\u{1F4F6}", label: "Infrastructure Capacity Supported" },
];

const SOLUTIONS = [
  {
    name: "BOS",
    tile: "operations",
    photo: solutionPhotos.bos,
    icon: "⚙",
    category: "Business Operating System",
    text: "Assess, design and operate more efficient, resilient organizations.",
    cta: "Explore BOS",
    href: "/solutions.html#/bos",
  },
  {
    name: "CivicSure",
    tile: "civic",
    photo: solutionPhotos.civicsure,
    icon: "\u{1F3DB}",
    category: "Public Program Assurance",
    text: "Verify programs, providers, and outcomes for government and public funding.",
    cta: "Explore CivicSure",
    href: "/civicsure",
  },
  {
    name: "AI Workforce",
    tile: "ai",
    photo: solutionPhotos.aiWorkforce,
    icon: "◈",
    category: "Governed AI & Agents",
    text: "Deploy AI workforce solutions with institutional controls and oversight.",
    cta: "Explore AI Workforce",
    href: "/solutions.html#/ai-workforce",
  },
  {
    name: "Studio",
    tile: "build",
    photo: solutionPhotos.studio,
    icon: "⚒",
    category: "Build & Implement",
    text: "Create operational applications, workflows, and solutions with governance.",
    cta: "Explore Studio",
    href: "/curriculum.html#/studio",
  },
  {
    name: "Infrastructure",
    tile: "infra",
    photo: dataCenterPhoto,
    icon: "≡",
    category: "Architecture & Implementation",
    text: "Design and implement data, cloud, network, and physical infrastructure.",
    cta: "Explore Infrastructure",
    href: "/solutions.html#/infrastructure",
  },
  {
    name: "Govern",
    tile: "govern",
    photo: solutionPhotos.govern,
    icon: "◉",
    category: "Policy, Evidence & Security",
    text: "Ensure alignment, compliance, and verified institutional outcomes.",
    cta: "Explore Govern",
    href: "/solutions.html#/govern",
  },
];

const INDUSTRIES = [
  { name: "Government", tile: "civic", photo: industryPhotos.government, icon: "\u{1F3DB}" },
  { name: "Education", tile: "education", photo: industryPhotos.education, icon: "\u{1F393}" },
  { name: "Nonprofits", tile: "nonprofit", photo: industryPhotos.nonprofits, icon: "\u{1F91D}" },
  { name: "Healthcare", tile: "health", photo: industryPhotos.healthcare, icon: "⚕" },
  { name: "Workforce Development", tile: "workforce", photo: industryPhotos.workforce, icon: "\u{1F477}" },
  { name: "Data Centers & Technology", tile: "infra", photo: dataCenterPhoto, icon: "≡" },
  { name: "Industrial & Manufacturing", tile: "industrial", photo: industrialPhoto, icon: "⚒" },
  { name: "Community Development", tile: "community", photo: industryPhotos.community, icon: "\u{1F3E0}" },
];

const APPROACH = [
  ["Assess", "Understand needs, opportunities and current systems."],
  ["Design", "Create the target operational and technical architecture."],
  ["Build", "Develop, configure and integrate systems and solutions."],
  ["Govern", "Apply policy, security, and institutional controls."],
  ["Operate", "Support, manage and optimize real-world performance."],
  ["Verify", "Measure outcomes, preserve evidence, and drive continuous improvement."],
];

const PARTNER_CATEGORIES = [
  { label: "Schools & CTE", icon: "\u{1F393}" },
  { label: "Community Colleges", icon: "\u{1F3EB}" },
  { label: "Nonprofits", icon: "\u{1F91D}" },
  { label: "Employers", icon: "\u{1F4BC}" },
  { label: "Workforce Boards", icon: "\u{1F477}" },
  { label: "Industry Partners", icon: "⚒" },
  { label: "Public Sector", icon: "\u{1F3DB}" },
  { label: "Community Organizations", icon: "\u{1F3E0}" },
];

function matches(query, ...fields) {
  if (!query.trim()) return true;
  const needle = query.trim().toLowerCase();
  return fields.some((field) => String(field || "").toLowerCase().includes(needle));
}

export default function ShsHome() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSolutions = useMemo(
    () => SOLUTIONS.filter((item) => matches(searchQuery, item.name, item.category, item.text)),
    [searchQuery]
  );
  const filteredIndustries = useMemo(
    () => INDUSTRIES.filter((item) => matches(searchQuery, item.name)),
    [searchQuery]
  );
  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="shs-home">
      <ShsHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main>
        <section className="shs-home-hero">
          <img className="shs-hero-photo" src={heroPhoto} alt="" aria-hidden="true" />
          <div className="shs-hero-scrim" aria-hidden="true" />

          <div className="shs-hero-inner">
            <p className="shs-eyebrow shs-hero-eyebrow">Technology &bull; Infrastructure &bull; People &bull; Real Results</p>
            <h1 className="shs-hero-title">
              Real Systems.
              <br />
              <span>Real Opportunity.</span>
            </h1>
            <p className="shs-hero-sub">
              Silicon Heartland Systems (SHS) delivers technology, infrastructure and operational
              solutions that help government, education, nonprofits, and businesses work smarter,
              operate more efficiently, and create lasting impact across the Midwest.
            </p>
            <div className="shs-hero-actions">
              <a className="shs-home-btn shs-home-btn-primary" href="#solutions">
                Our Solutions <span aria-hidden="true">&rarr;</span>
              </a>
              <button
                type="button"
                className="shs-home-btn shs-home-btn-outline"
                aria-disabled="true"
                title="Our Story video is not yet published — this destination is pending."
                onClick={(event) => event.preventDefault()}
              >
                <span aria-hidden="true">&#9658;</span> Watch Our Story
              </button>
            </div>
          </div>

          <aside className="shs-hero-panel" aria-label="SHS capability areas">
            <ul>
              {CAPABILITIES.map((cap) => (
                <li key={cap.title}>
                  <span aria-hidden="true">{cap.icon}</span> {cap.title.toUpperCase()}
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="shs-capabilities" id="capabilities" aria-label="Core capabilities">
          <div className="shs-capability-grid">
            {CAPABILITIES.map((cap) => (
              <article className="shs-capability-card" key={cap.title}>
                <div className="shs-capability-icon" aria-hidden="true">
                  {cap.icon}
                </div>
                <h3>{cap.title}</h3>
                <p>{cap.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="shs-mission" id="mission">
          <div className="shs-mission-grid">
            <div className="shs-mission-copy">
              <p className="shs-eyebrow">Our Mission</p>
              <h2>Systems for a Stronger Midwest.</h2>
              <p>
                We help institutions design, build and operate the systems they need to serve
                people, improve efficiency, and create real opportunity in their communities.
              </p>
              <a className="shs-home-btn shs-home-btn-outline" href="/solutions.html#/team">
                Learn More About SHS <span aria-hidden="true">&rarr;</span>
              </a>
            </div>

            <div className="shs-mission-metrics">
              {ENGAGEMENT_AREAS.map((area) => (
                <div className="shs-metric-chip" key={area.label}>
                  <span aria-hidden="true">{area.icon}</span>
                  <p>{area.label}</p>
                </div>
              ))}
              <div className="shs-mission-region-line">
                <span aria-hidden="true">&#128205;</span>
                <div>
                  <strong>{REGION_STATES.length} States</strong>
                  <p>Serving {REGION_STATES.join(", ")}</p>
                </div>
              </div>
            </div>

            <div className="shs-mission-region">
              <p className="shs-region-label">A Stronger Region</p>
              <div className="shs-region-map" aria-hidden="true">
                <svg viewBox="0 0 220 150" role="presentation">
                  <polygon points="18,20 90,14 96,50 70,58 60,90 30,96 12,60" fill="rgba(88,199,255,0.08)" stroke="rgba(88,199,255,0.35)" strokeWidth="1.2" />
                  <polygon points="90,14 150,10 158,46 100,52 96,50" fill="rgba(88,199,255,0.08)" stroke="rgba(88,199,255,0.35)" strokeWidth="1.2" />
                  <polygon points="60,90 100,86 112,120 66,128" fill="rgba(88,199,255,0.08)" stroke="rgba(88,199,255,0.35)" strokeWidth="1.2" />
                  <polygon points="100,52 158,46 172,84 112,90" fill="rgba(88,199,255,0.08)" stroke="rgba(88,199,255,0.35)" strokeWidth="1.2" />
                  {[[40, 40], [120, 30], [80, 100], [140, 70], [180, 60]].map(([cx, cy], i) => (
                    <circle key={i} cx={cx} cy={cy} r="3.5" fill="var(--shs-cyan)" opacity="0.9" />
                  ))}
                </svg>
              </div>
              <ul className="shs-region-list">
                {REGION_CATEGORIES.map((cat) => (
                  <li key={cat}>{cat}</li>
                ))}
              </ul>
              <a className="shs-region-link" href="#industries">
                Explore the Region <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>
        </section>

        <section className="shs-section shs-light" id="solutions">
          <div className="shs-section-heading">
            <div>
              <p className="shs-eyebrow shs-eyebrow-dark">Our Solutions</p>
              <h2 className="shs-heading-dark">Integrated systems for real-world impact.</h2>
            </div>
            <a className="shs-view-all" href="#solutions">
              View All Solutions <span aria-hidden="true">&rarr;</span>
            </a>
          </div>

          {isSearching && filteredSolutions.length === 0 ? (
            <p className="shs-empty-state">No solutions match &ldquo;{searchQuery}&rdquo;.</p>
          ) : (
            <div className="shs-solutions-grid">
              {filteredSolutions.map((sol) => (
                <article className="shs-solution-card" key={sol.name}>
                  <ShsImageTile variant={sol.tile} icon={sol.icon} label={sol.name} src={sol.photo} className="shs-solution-image" />
                  <div className="shs-solution-body">
                    <p className="shs-solution-category">{sol.category}</p>
                    <h3>{sol.name}</h3>
                    <p className="shs-solution-text">{sol.text}</p>
                    <a className="shs-solution-cta" href={sol.href}>
                      {sol.cta} <span aria-hidden="true">&rarr;</span>
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="shs-section shs-light" id="industries">
          <div className="shs-section-heading">
            <div>
              <p className="shs-eyebrow shs-eyebrow-dark">Industries We Serve</p>
              <h2 className="shs-heading-dark">Tailored solutions for the unique needs of each sector.</h2>
            </div>
            <a className="shs-view-all" href="#industries">
              View All Industries <span aria-hidden="true">&rarr;</span>
            </a>
          </div>

          {isSearching && filteredIndustries.length === 0 ? (
            <p className="shs-empty-state">No industries match &ldquo;{searchQuery}&rdquo;.</p>
          ) : (
            <div className="shs-industries-grid">
              {filteredIndustries.map((industry) => (
                <div className="shs-industry-card" key={industry.name}>
                  <ShsImageTile variant={industry.tile} icon={industry.icon} label={industry.name} src={industry.photo} className="shs-industry-image" />
                  <span>{industry.name}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="shs-section shs-light" id="approach">
          <div className="shs-section-heading">
            <div>
              <p className="shs-eyebrow shs-eyebrow-dark">Our Approach</p>
              <h2 className="shs-heading-dark">From strategy to real-world results.</h2>
            </div>
            <a className="shs-view-all" href="#approach">
              Learn More About Our Approach <span aria-hidden="true">&rarr;</span>
            </a>
          </div>

          <ol className="shs-approach-track">
            {APPROACH.map(([title, text], index) => (
              <li key={title}>
                <div className="shs-approach-step">
                  <span className="shs-approach-index">{index + 1}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
                {index < APPROACH.length - 1 ? (
                  <span className="shs-approach-arrow" aria-hidden="true">
                    &rarr;
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </section>

        <section className="shs-section shs-light shs-lowerband" id="our-work">
          <div className="shs-lowerband-grid">
            <article className="shs-featured-project">
              <p className="shs-eyebrow shs-eyebrow-dark">Featured Project</p>
              <ShsImageTile variant="infra" icon="≡" label="Midwest Data Center Initiative" src={dataCenterPhoto} className="shs-featured-image" />
              <span className="shs-illustrative-tag">Illustrative example</span>
              <h3>Midwest Data Center Initiative</h3>
              <p>
                A representative example of the infrastructure engagements SHS is built to
                support — a next-generation data center campus that creates jobs and expands
                opportunity in the region.
              </p>
              <a className="shs-solution-cta" href="/solutions.html#/infrastructure">
                View Project <span aria-hidden="true">&rarr;</span>
              </a>
            </article>

            <article className="shs-success-story">
              <p className="shs-eyebrow shs-eyebrow-dark">Success Stories</p>
              <div className="shs-story-body">
                <ShsImageTile label="Representative city partner" src={successStoryPhoto} className="shs-story-image" />
                <div>
                  <span className="shs-illustrative-tag">Illustrative example</span>
                  <p className="shs-story-quote">
                    &ldquo;SHS helped us modernize our systems, improve efficiency, and better
                    serve our community.&rdquo;
                  </p>
                  <p className="shs-story-attrib">Representative government &amp; civic engagement</p>
                </div>
              </div>
            </article>

            <article className="shs-partners">
              <div className="shs-section-heading shs-partners-heading">
                <div>
                  <p className="shs-eyebrow shs-eyebrow-dark">Our Partners</p>
                  <h3 className="shs-heading-dark">Working together for a stronger Midwest.</h3>
                </div>
                <a className="shs-view-all" href="#resources">
                  View All Partners <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
              <div className="shs-partners-grid">
                {PARTNER_CATEGORIES.map((cat) => (
                  <div className="shs-partner-chip" key={cat.label}>
                    <span aria-hidden="true">{cat.icon}</span>
                    {cat.label}
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="shs-final-cta" id="resources">
          <img className="shs-final-photo" src={finalCtaPhoto} alt="" aria-hidden="true" />
          <div className="shs-final-scrim" aria-hidden="true" />
          <div className="shs-final-inner">
            <div className="shs-final-copy">
              <h2>Let&rsquo;s Build What&rsquo;s Next.</h2>
              <p>
                Partner with Silicon Heartland Systems to create real infrastructure and real
                opportunity across the Midwest.
              </p>
            </div>
            <div className="shs-final-actions">
              <a className="shs-home-btn shs-home-btn-primary" href="/solutions.html#/contact">
                Work With SHS <span aria-hidden="true">&rarr;</span>
              </a>
              <a className="shs-home-btn shs-home-btn-outline" href="/solutions.html#/contact">
                Contact Us <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <ShsFooter />
    </div>
  );
}
