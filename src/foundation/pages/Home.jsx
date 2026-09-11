import React, { useEffect, useState } from "react";
import { fetchPublicCurriculumLessonCompletions } from "@/shared/reporting/publicImpactReportingClient.js";

const missionCards = [
  {
    icon: "🎓",
    title: "Education & Skills Training",
    text: "Expanding access to career education, digital skills, and practical learning pathways."
  },
  {
    icon: "→",
    title: "Workforce Pathways",
    text: "Connecting learning, preparation, and career exploration to the next useful step."
  },
  {
    icon: "+",
    title: "Community Programs",
    text: "Supporting community initiatives, accessibility, inclusion, and local opportunity."
  }
];

const featuredPrograms = [
  {
    title: "Career Education",
    image: "/assets/foundation/hero-main.jpg"
  },
  {
    title: "Workforce Training",
    image: "/assets/foundation/hero-main.jpg"
  },
  {
    title: "Community Programs",
    image: "/assets/foundation/hero-main.jpg"
  }
];

export default function Home() {
  const [lessonCompletions, setLessonCompletions] = useState({ status: "LOADING", value: "Unavailable" });

  useEffect(() => {
    let active = true;
    fetchPublicCurriculumLessonCompletions()
      .then((projection) => {
        if (!active) return;
        setLessonCompletions(projection ? { status: projection.representationType === "SUPPRESSED_LT_10" ? "SUPPRESSED" : projection.displayValue === "0" ? "ZERO" : "CANONICAL_VALUE", value: projection.displayValue } : { status: "UNAVAILABLE", value: "Unavailable" });
      })
      .catch(() => {
        if (active) setLessonCompletions({ status: "UNAVAILABLE", value: "Unavailable" });
      });
    return () => { active = false; };
  }, []);

  return (
    <>
      <section className="shf-mock-hero" id="about">
        <div className="shf-mock-hero__bg" />
        <div className="shf-mock-hero__shade" />

        <div className="shf-shell shf-mock-hero__inner">
          <div className="shf-mock-hero__copy">
            <h1>Empowering Pathways to Success</h1>
            <p>
              Connecting education, workforce pathways, technology access, and community opportunity.
            </p>
            <a className="shf-blue-btn" href="#programs">Learn More</a>
          </div>

          <div className="shf-mock-hero__people" aria-hidden="true">
            <div className="shf-person shf-person--graduate">
              <span>🎓</span>
            </div>
            <div className="shf-person shf-person--worker">
              <span>👷</span>
            </div>
            <div className="shf-person shf-person--nurse">
              <span>🩺</span>
            </div>
          </div>
        </div>
      </section>

      <section className="shf-top-impact">
        <div className="shf-shell shf-top-impact__grid">
          <div className="shf-impact-stat">
            <div className="shf-impact-icon">🏠</div>
            <div>
              <strong>Education</strong>
              <span>Learning pathways</span>
            </div>
          </div>

          <div className="shf-impact-stat">
            <div className="shf-impact-icon">🎓</div>
            <div>
              <strong aria-live="polite">{lessonCompletions.value}</strong>
              <span>Verified Lesson Completions</span>
            </div>
          </div>

          <div className="shf-impact-stat">
            <div className="shf-impact-icon">✓</div>
            <div>
              <strong>Careers</strong>
              <span>Workforce direction</span>
            </div>
          </div>
        </div>
      </section>

      <section className="shf-mission-section">
        <div className="shf-shell">
          <div className="shf-section-heading">
            <h2>Our Mission</h2>
            <p>
              Building practical pathways through education, workforce preparation,
              technology access, and community programs.
            </p>
          </div>

          <div className="shf-mission-grid">
            {missionCards.map((card) => (
              <article className="shf-mission-card" key={card.title}>
                <div className="shf-mission-card__icon">{card.icon}</div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>

          <div className="shf-center-action">
            <a className="shf-blue-btn shf-blue-btn--arrow" href="#programs">
              View All Programs <span>›</span>
            </a>
          </div>
        </div>
      </section>

      <section className="shf-featured-section" id="programs">
        <div className="shf-shell">
          <div className="shf-section-heading shf-section-heading--compact">
            <h2>Featured Programs</h2>
          </div>

          <div className="shf-program-grid">
            {featuredPrograms.map((program, index) => (
              <article className={`shf-program-card shf-program-card--${index + 1}`} key={program.title}>
                <img src={program.image} alt="" />
                <div className="shf-program-card__overlay">
                  <h3>{program.title}</h3>
                  <span>›</span>
                </div>
              </article>
            ))}
          </div>

          <div className="shf-center-action">
            <a className="shf-outline-btn" href="#programs">
              View All Programs <span>›</span>
            </a>
          </div>
        </div>
      </section>

      <section className="shf-partners-section" id="partners">
        <div className="shf-shell">
          <h2>Trusted by Our Partners</h2>

          <div className="shf-partner-row">
            <p className="shf-partners-copy">SHF works with schools, nonprofits, counties, employers, and community organizations. Public partner details are shared when a relationship is ready for public use.</p>
          </div>
        </div>
      </section>

      <section className="shf-impact-glance" id="impact">
        <div className="shf-shell">
          <h2>Impact at a Glance</h2>

          <div className="shf-glance-grid">
            <div className="shf-glance-stat">
              <span>🎓</span>
              <strong>Learning</strong>
              <small>Public pathway information</small>
            </div>
            <div className="shf-glance-stat">
              <span>✓</span>
              <strong>Reporting</strong>
              <small>Public-approved information</small>
            </div>
            <div className="shf-glance-stat">
              <span>👥</span>
              <strong>Community</strong>
              <small>Partners and local pathways</small>
            </div>
          </div>
        </div>
      </section>

      <section className="shf-donate-section" id="donate">
        <div className="shf-shell">
          <h2>Help build a useful pathway.</h2>
          <a className="shf-orange-btn" href="#/get-involved">
            Get Involved <span>›</span>
          </a>
        </div>
      </section>

      <section className="shf-report-anchor" id="reports" aria-label="Impact reports" />
    </>
  );
}
