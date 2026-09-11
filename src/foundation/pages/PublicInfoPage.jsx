import React from "react";
import "../styles/foundation-public-info.css";

const CONTENT = {
  about: {
    eyebrow: "About SHF",
    title: "Building practical pathways to education, work, and community opportunity.",
    intro: "Silicon Heartland Foundation is a nonprofit education and community-development organization. We connect people and organizations with learning, workforce, technology, and community pathways.",
    sections: [
      ["Our mission", "SHF expands access to education, technology, and workforce opportunity while supporting stronger, more inclusive communities."],
      ["How we work", "We build and support programs with schools, nonprofits, counties, employers, and community organizations. Programs are designed to make the next useful step easier to find and take."],
      ["A clear relationship", "SHF is a nonprofit organization. Silicon Heartland Solutions (SHS) is a separate solutions and services organization. They are not the same legal entity."],
    ],
  },
  mission: {
    eyebrow: "Our mission",
    title: "Opportunity should be easier to reach.",
    intro: "SHF creates pathways that help learners, workers, families, and community organizations move from access to practical progress.",
    sections: [
      ["Education and learning", "Accessible learning resources, projects, and courses help people build knowledge they can carry into school, work, and community life."],
      ["Workforce pathways", "Career exploration, preparation, and employer connection help people understand options and prepare for the next step."],
      ["Technology equity and inclusion", "We support access to technology and learning experiences that welcome Deaf, blind and low-vision, neurodiverse, and otherwise underserved communities."],
    ],
  },
  programs: {
    eyebrow: "Programs",
    title: "Programs designed around the next useful step.",
    intro: "Explore the program areas SHF develops and supports. Availability, eligibility, and participation are defined by each canonical program owner.",
    sections: [
      ["Education pathways", "Course, lesson, and project-based learning that helps learners build durable skills and evidence of progress."],
      ["Career and workforce", "Career exploration and workforce preparation that connect learning to real-world direction and opportunity."],
      ["Technology access", "Practical technology learning and access programs that help communities participate in an increasingly digital economy."],
      ["Community programs", "Community initiatives can be developed with local partners and supported through shared capacity where the governing arrangement allows it."],
    ],
  },
  partners: {
    eyebrow: "Partners",
    title: "Work with SHF on a useful community pathway.",
    intro: "Schools, nonprofits, counties, employers, and community organizations can engage SHF around education, workforce, technology, and community development needs.",
    sections: [
      ["Schools and educators", "Connect learners with accessible education, projects, and career-oriented pathways."],
      ["Community organizations", "Explore program collaboration and optional shared infrastructure while retaining your organization’s own mission and governance."],
      ["Employers and counties", "Discuss workforce pathways, community needs, and responsible ways to connect people with opportunity."],
    ],
  },
  "get-involved": {
    eyebrow: "Get involved",
    title: "Start a conversation about the work that matters locally.",
    intro: "Tell SHF what you are trying to build, learn, or support. We will route inquiries to the appropriate program or partnership conversation.",
    sections: [
      ["Program and school interest", "Ask about education, accessibility, workforce, and community program pathways."],
      ["Nonprofit infrastructure interest", "Learn whether optional shared services could support your independent nonprofit without replacing its identity or governance."],
      ["Funder and reviewer interest", "Request public information about SHF’s mission, program model, and evidence-backed reporting approach."],
    ],
  },
  reports: {
    eyebrow: "Transparency",
    title: "Public information should be clear about what it knows.",
    intro: "SHF distinguishes mission, current public facts, reviewed evidence, and future goals. Public reporting is limited to information approved for public use.",
    sections: [
      ["Evidence before claims", "Operational activity is not automatically verified institutional evidence. Canonical Evidence and Truth authorities govern acceptance."],
      ["Public-safe reporting", "Public projections exclude private records, sensitive details, and unapproved or superseded information."],
      ["When information is unavailable", "A missing public record is shown as unavailable rather than replaced with demonstration data or an unsupported number."],
    ],
  },
};

export default function PublicInfoPage({ page = "about" }) {
  const content = CONTENT[page] || CONTENT.about;
  return (
    <div className="shf-info-page" id={page === "reports" ? "reports" : undefined}>
      <div className="shf-info-shell">
        <header className="shf-info-hero">
          <p className="shf-info-eyebrow">{content.eyebrow}</p>
          <h1>{content.title}</h1>
          <p className="shf-info-intro">{content.intro}</p>
        </header>

        <div className="shf-info-grid">
          {content.sections.map(([title, text]) => (
            <section className="shf-info-section" key={title}>
              <h2>{title}</h2>
              <p>{text}</p>
            </section>
          ))}
        </div>

        <div className="shf-info-actions" aria-label="Continue with Silicon Heartland Foundation">
          <a className="shf-info-action shf-info-action--primary" href="#/programs">Explore programs</a>
          <a className="shf-info-action" href="#/get-involved">Contact SHF</a>
          <a className="shf-info-action" href="/career.html#/">Open Career Center</a>
        </div>
      </div>
    </div>
  );
}
