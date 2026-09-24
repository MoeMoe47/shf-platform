import React, { useEffect, useState } from "react";
import { fetchPublicCurriculumLessonCompletions } from "@/shared/reporting/publicImpactReportingClient.js";
import footerImage from "@/assets/brand/shf-footer-landscape-light.webp";
import peopleImage from "@/assets/brand/hero-people-cutout.png";
import skylineImage from "@/assets/brand/hero-bg-ohio.png";
import educationImage from "@/assets/store/catalog/ai-literacy.webp";
import workforceImage from "@/assets/store/catalog/data-center.webp";
import inclusionImage from "@/assets/store/catalog/educator-pd.webp";
import communityImage from "@/assets/store/catalog/community-incubator.webp";

const ASSETS = {
  hero: "/assets/foundation/hero-main.jpg",
  map: "/assets/shf-command/maps/shf-impact-ohio-board-art.png",
  footer: footerImage,
  people: peopleImage,
  skyline: skylineImage,
  education: educationImage,
  workforce: workforceImage,
  inclusion: inclusionImage,
  community: communityImage,
  career: "/assets/career/pathways/family-technology.jpg",
};

const missionPillars = [
  ["book", "Education & Learning", "Skills, curriculum and real-world experiences"],
  ["people", "Youth & Career Pathways", "Career readiness and future opportunities"],
  ["access", "Disability Inclusion", "Accessible programs and support for all learners"],
  ["home", "Community Development", "Neighborhoods, local projects and economic opportunity"],
  ["screen", "Technology Equity", "Access, tools and digital skills for underserved communities"],
  ["shield", "Transparency & Trust", "Open reporting and measurable public information"],
];

const programCards = [
  ["STEM & Technology Education", "From foundational skills to advanced pathways.", ASSETS.education, "#/programs"],
  ["Youth Career Programs", "Exploration, certification and real-world experience.", ASSETS.workforce, "/career.html#/"],
  ["Learning Arcade & Simulations", "Engaging learning experiences for the next generation.", ASSETS.inclusion, "/arcade.html#/"],
  ["Disability Inclusion", "Accessible tools, curriculum and support for all learners.", ASSETS.people, "#/programs"],
  ["Community Projects", "Local initiatives that strengthen communities.", ASSETS.skyline, "#/partners"],
  ["After-School & Partner Programs", "Support for schools, nonprofits and community organizations.", ASSETS.community, "#/get-involved"],
];

const reportCards = [
  ["chart", "Impact Reports", "Public information approved for disclosure.", "#/reports", "View Reports"],
  ["file", "Program Ledger", "Program information when ready for public use.", "#/reports", "View Ledger"],
  ["database", "Funding & Grants", "Accountability and stewardship boundaries.", "#/reports", "View Details"],
  ["shield", "Trust & Governance", "How SHF protects public trust.", "#/reports", "View Governance"],
];

const partnerCategories = [
  ["cap", "Schools & CTE"],
  ["building", "Community Colleges"],
  ["people", "Nonprofits"],
  ["briefcase", "Employers"],
  ["gear", "Workforce Boards"],
  ["columns", "Local Government"],
];

const safeMetrics = [
  ["Midwest", "Regional Focus", "Ohio, Michigan, Pennsylvania, West Virginia and Indiana"],
  ["Public", "Reporting Boundary", "Approved public records only"],
  ["Pending", "Impact Counts", "Unavailable until public disclosure approval"],
  ["Active", "Program Areas", "Education, workforce, access and community"],
];

function Icon({ name }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };
  const paths = {
    book: <><path d="M4 5.5c2.5-.8 5-.5 8 1.4v12c-3-1.9-5.5-2.2-8-1.4z" /><path d="M20 5.5c-2.5-.8-5-.5-8 1.4v12c3-1.9 5.5-2.2 8-1.4z" /></>,
    people: <><path d="M16 20v-1.5c0-2-1.8-3.5-4-3.5s-4 1.5-4 3.5V20" /><circle cx="12" cy="8" r="3" /><path d="M4 20v-1.1c0-1.5 1-2.8 2.5-3.4" /><path d="M20 20v-1.1c0-1.5-1-2.8-2.5-3.4" /></>,
    access: <><circle cx="12" cy="4.5" r="1.8" /><path d="M6 8h12" /><path d="M12 7.5v5.2" /><path d="m9 21 3-8.3 3 8.3" /><path d="M8.2 13.5h7.6" /></>,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></>,
    screen: <><rect x="3" y="5" width="18" height="12" rx="1.8" /><path d="M9 21h6" /><path d="M12 17v4" /></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6z" /><path d="m9 12 2 2 4-4" /></>,
    search: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    play: <><circle cx="12" cy="12" r="9" /><path d="m10 8 6 4-6 4z" /></>,
    chart: <><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20H2" /></>,
    file: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5" /><path d="M9 13h6" /><path d="M9 17h6" /></>,
    database: <><ellipse cx="12" cy="5" rx="7" ry="3" /><path d="M5 5v10c0 1.7 3.1 3 7 3s7-1.3 7-3V5" /><path d="M5 10c0 1.7 3.1 3 7 3s7-1.3 7-3" /></>,
    cap: <><path d="m3 9 9-4 9 4-9 4z" /><path d="M7 11v4c2.8 2 7.2 2 10 0v-4" /></>,
    building: <><path d="M4 20h16" /><path d="M6 20V8l6-4 6 4v12" /><path d="M9 10h.1M12 10h.1M15 10h.1M9 14h.1M12 14h.1M15 14h.1" /></>,
    briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5h6v2" /><path d="M3 12h18" /></>,
    gear: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" /></>,
    columns: <><path d="M4 20h16" /><path d="M5 8h14" /><path d="M12 3 4 8h16z" /><path d="M7 8v12M12 8v12M17 8v12" /></>,
  };
  return <svg {...common}>{paths[name] || paths.arrow}</svg>;
}

function LessonMetric() {
  const [lessonCompletions, setLessonCompletions] = useState({ status: "LOADING", value: "Unavailable" });

  useEffect(() => {
    let active = true;
    fetchPublicCurriculumLessonCompletions()
      .then((projection) => {
        if (!active) return;
        setLessonCompletions(
          projection
            ? {
                status: projection.representationType === "SUPPRESSED_LT_10" ? "SUPPRESSED" : projection.displayValue === "0" ? "ZERO" : "CANONICAL_VALUE",
                value: projection.displayValue,
              }
            : { status: "UNAVAILABLE", value: "Unavailable" },
        );
      })
      .catch(() => {
        if (active) setLessonCompletions({ status: "UNAVAILABLE", value: "Unavailable" });
      });
    return () => { active = false; };
  }, []);

  return (
    <div className="shf-impact-metric">
      <strong aria-live="polite">{lessonCompletions.value}</strong>
      <span>Verified Lesson Completions</span>
      <small>Public projection</small>
    </div>
  );
}

function ButtonLink({ href, children, variant = "primary" }) {
  return <a className={`shf-btn shf-btn--${variant}`} href={href}>{children}<Icon name="arrow" /></a>;
}

function SectionHeader({ eyebrow, title, copy, action }) {
  return (
    <div className="shf-section-head">
      <div>
        {eyebrow ? <p className="shf-eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {copy ? <p>{copy}</p> : null}
      </div>
      {action ? <a href={action.href}>{action.label}<Icon name="arrow" /></a> : null}
    </div>
  );
}

function ProgramCard({ item }) {
  const [title, text, image, href] = item;
  return (
    <article className="shf-program-card">
      <img src={image} alt="" loading="lazy" />
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
        <a href={href}>Learn More <Icon name="arrow" /></a>
      </div>
    </article>
  );
}

export default function Home() {
  return (
    <>
      <section className="shf-hero" id="about" style={{ "--shf-hero-image": `url(${ASSETS.hero})` }}>
        <div className="shf-hero__content shf-shell">
          <div className="shf-hero__copy">
            <p className="shf-hero__overline">Education - Workforce - Community - Opportunity</p>
            <h1>People First.<br />A Stronger Heartland.</h1>
            <p>
              Silicon Heartland Foundation invests in people, education and community development to create real opportunities across the Midwest through technology, learning and collaboration.
            </p>
            <div className="shf-hero__actions">
              <ButtonLink href="#/programs">Explore Our Programs</ButtonLink>
              <ButtonLink href="#/about" variant="outline"><Icon name="play" />Watch Our Story</ButtonLink>
            </div>
          </div>
          <div className="shf-hero__side" aria-label="Foundation focus areas">
            <span>Learning</span>
            <span>People</span>
            <span>Community</span>
            <span>Opportunity</span>
            <span>A Stronger Tomorrow</span>
          </div>
        </div>
      </section>

      <section className="shf-pillar-band" aria-label="Foundation mission pillars">
        <div className="shf-shell shf-pillar-grid">
          {missionPillars.map(([icon, title, text]) => (
            <a className="shf-pillar" href="#/programs" key={title}>
              <Icon name={icon} />
              <span><strong>{title}</strong><small>{text}</small></span>
            </a>
          ))}
        </div>
      </section>

      <section className="shf-impact-section shf-shell" id="impact">
        <div className="shf-impact-panel">
          <div className="shf-impact-copy">
            <p className="shf-eyebrow">Our Impact In The Midwest</p>
            <h2>Real People. Real Progress.</h2>
            <p>
              Creating opportunities across Ohio, Michigan, Pennsylvania, West Virginia and Indiana through education, technology and community partnerships.
            </p>
            <div className="shf-impact-metrics">
              {safeMetrics.map(([value, label, note]) => (
                <div className="shf-impact-metric" key={label}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                  <small>{note}</small>
                </div>
              ))}
              <LessonMetric />
            </div>
            <ButtonLink href="#/reports">Explore Our Impact</ButtonLink>
          </div>
          <div className="shf-midwest-map" aria-label="Midwest public impact visualization">
            <img src={ASSETS.map} alt="" loading="lazy" />
            {["OH", "MI", "PA", "WV", "IN"].map((state, index) => (
              <span className={`shf-map-state shf-map-state--${index}`} key={state}>{state}</span>
            ))}
          </div>
          <article className="shf-featured-initiative">
            <div>
              <p>Featured Initiative</p>
              <h3>Midwest Workforce Pathways</h3>
              <span>Connecting learners and adults to career opportunities through industry partnerships, hands-on learning and verified credentials.</span>
              <ButtonLink href="/career.html#/" variant="light">Explore Workforce Programs</ButtonLink>
            </div>
            <img src={ASSETS.workforce} alt="" loading="lazy" />
          </article>
        </div>
      </section>

      <section className="shf-programs shf-shell" id="programs">
        <SectionHeader
          title="Key Programs"
          copy="From classrooms to careers, from communities to opportunity - SHF programs create real pathways and lasting impact."
          action={{ href: "#/programs", label: "View All Programs" }}
        />
        <div className="shf-program-grid">
          {programCards.map((item) => <ProgramCard item={item} key={item[0]} />)}
        </div>
      </section>

      <section className="shf-lower-grid shf-shell">
        <article className="shf-live-map" id="impact-map">
          <div>
            <h2>Live Impact Map</h2>
            <p>A public-safe regional view for education, workforce and community partnerships. Public records appear only after disclosure approval.</p>
          </div>
          <div className="shf-live-map__canvas" aria-hidden="true">
            {Array.from({ length: 18 }).map((_, index) => <span key={index} />)}
          </div>
          <ul className="shf-live-map__legend" aria-label="Map categories">
            <li><b />Education</li>
            <li><b />Workforce</li>
            <li><b />Community</li>
            <li><b />Inclusion</li>
            <li><b />Partner Programs</li>
          </ul>
          <ButtonLink href="#/reports" variant="dark">Explore the Impact Map</ButtonLink>
        </article>

        <section className="shf-stories">
          <SectionHeader
            title="Success Stories"
            action={{ href: "#/reports", label: "View All Stories" }}
          />
          <div className="shf-story-grid">
            {[
              ["Technology & Career", "Participant story format", "Public-ready stories will appear after participant and publication approval.", ASSETS.education],
              ["STEM & Innovation", "Learning pathway format", "Approved stories can connect programs, places and learner progress.", ASSETS.inclusion],
              ["Disability Inclusion", "Access story format", "Inclusion stories remain consent-based and public-safe.", ASSETS.people],
            ].map(([tag, title, text, image]) => (
              <article className="shf-story-card" key={tag}>
                <img src={image} alt="" loading="lazy" />
                <p>{title}</p>
                <span>{text}</span>
                <b>{tag}</b>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="shf-report-partner-grid shf-shell">
        <section className="shf-reporting" id="reports">
          <SectionHeader
            title="Transparency & Reporting"
            copy="Open information. Measurable outcomes. A more accountable and stronger region."
            action={{ href: "#/reports", label: "View All Reports" }}
          />
          <div className="shf-report-grid">
            {reportCards.map(([icon, title, text, href, cta]) => (
              <article className="shf-report-card" key={title}>
                <Icon name={icon} />
                <h3>{title}</h3>
                <p>{text}</p>
                <a href={href}>{cta} <Icon name="arrow" /></a>
              </article>
            ))}
          </div>
        </section>

        <section className="shf-partners" id="partners">
          <SectionHeader
            title="Our Partners"
            copy="Working together for a stronger Midwest."
            action={{ href: "#/partners", label: "View All Partners" }}
          />
          <div className="shf-partner-grid">
            {partnerCategories.map(([icon, title]) => (
              <a className="shf-partner-card" href="#/partners" key={title}>
                <Icon name={icon} />
                <span>{title}</span>
              </a>
            ))}
          </div>
        </section>
      </section>

      <section className="shf-final-cta" style={{ "--shf-footer-image": `url(${ASSETS.footer})` }}>
        <div className="shf-shell shf-final-cta__inner">
          <div>
            <h2>Join Us in Building a Stronger Tomorrow.</h2>
            <p>Support education, opportunity and community development across the Midwest. Together, we can create lasting impact.</p>
          </div>
          <div className="shf-final-cta__actions">
            <ButtonLink href="#/get-involved">Support SHF</ButtonLink>
            <ButtonLink href="#/partners" variant="outline-light">Partner With Us</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
