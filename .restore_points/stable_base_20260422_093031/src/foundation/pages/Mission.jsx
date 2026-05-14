import React from "react";
import "../styles/mission.css";
import heroImg from "../assets/foundation/hero-main.jpg";
import skylineImg from "../assets/foundation/hero-main.jpg";

function MissionCard({ title, metric, desc }) {
  return (
    <article className="mission-card">
      <div className="mission-card__image" aria-hidden="true" />
      <h3>{title}</h3>
      <div className="mission-card__metric">{metric}</div>
      <p>{desc}</p>
      <button className="mission-link" type="button">
        Learn More <span aria-hidden="true">›</span>
      </button>
    </article>
  );
}

export default function Mission() {
  return (
    <div className="mission-page">
      <header className="mission-topbar">
        <div className="mission-shell mission-topbar__inner">
          <a href="#/top" className="mission-brand" aria-label="Silicon Heartland Foundation home">
            <div className="mission-brand__mark" aria-hidden="true">SHF</div>
            <div className="mission-brand__text">
              <div>Silicon Heartland</div>
              <div>Foundation</div>
            </div>
          </a>

          <nav className="mission-nav" aria-label="Primary">
            <a href="#/about">About</a>
            <a href="#/programs">Programs</a>
            <a href="#/impact">Impact</a>
            <a href="#/careers">Careers</a>
            <a href="#/get-involved">Get Involved</a>
            <a href="#/mission" className="mission-btn mission-btn--navy">Donate</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="mission-hero">
          <div className="mission-shell mission-hero__inner">
            <div className="mission-hero__copy">
              <h1>Launching Programs That Create Real Opportunity Across Ohio</h1>
              <p>
                We design and operate education, workforce, and recovery programs
                that help individuals build stronger futures across Ohio communities.
              </p>
              <div className="mission-hero__actions">
                <button className="mission-btn mission-btn--copper" type="button">
                  Explore Programs
                </button>
                <button className="mission-btn mission-btn--navy" type="button">
                  Support the Mission
                </button>
              </div>
            </div>

            <div className="mission-hero__media">
              <div
                className="mission-hero__image"
                style={{ backgroundImage: `url(${heroImg})` }}
                aria-hidden="true"
              />
            </div>
          </div>
        </section>

        <section className="mission-kpis">
          <div className="mission-shell mission-kpis__inner">
            <div className="mission-kpi">
              <strong>12,500+</strong>
              <span>Lives Reached</span>
            </div>
            <div className="mission-kpi">
              <strong>4,200+</strong>
              <span>Certifications Earned</span>
            </div>
            <div className="mission-kpi">
              <strong>85%</strong>
              <span>Job Placement Rate</span>
            </div>
          </div>
        </section>

        <section className="mission-section">
          <div className="mission-shell centered">
            <div className="mission-heading">
              <span>Our Mission</span>
            </div>
            <h2>Expanding Access to Education, Workforce and Recovery Pathways</h2>
            <p className="mission-center-copy mission-center-copy--narrow">
              Silicon Heartland Foundation launches programs that support individuals,
              strengthen communities, and create long-term opportunity through real
              support, real training, and real pathways.
            </p>
          </div>
        </section>

        <section className="mission-section">
          <div className="mission-shell">
            <div className="mission-heading">
              <span>Programs That</span>
            </div>

            <div className="mission-card-grid">
              <MissionCard
                title="Education Pathways"
                metric="4,200+ Certifications Earned"
                desc=""
              />
              <MissionCard
                title="Workforce Training"
                metric="85% Job Placement Rate"
                desc=""
              />
              <MissionCard
                title="Recovery Support"
                metric="Measured progress across active programs"
                desc=""
              />
            </div>
          </div>
        </section>

        <section className="mission-section">
          <div className="mission-shell centered">
            <div className="mission-heading">
              <span>Programs Backed by Better Information</span>
            </div>
            <p className="mission-center-copy">
              Our programs are strengthened by connected tools that help track progress,
              improve performance, and guide smarter decisions over time.
            </p>
            <div className="mission-actions-centered">
              <button className="mission-btn mission-btn--navy" type="button">
                See How It Works
              </button>
            </div>
          </div>
        </section>

        <section className="mission-section">
          <div className="mission-shell centered">
            <div className="mission-heading">
              <span>Support the Mission</span>
            </div>
            <h2>Invest in Programs That Change Lives</h2>
            <p className="mission-center-copy">
              Your support helps expand access to education, opportunity, and progress Ohio.
            </p>
            <div className="mission-support-actions">
              <button className="mission-btn mission-btn--copper" type="button">
                Donate Today
              </button>
              <button className="mission-btn mission-btn--navy" type="button">
                Become a Partner
              </button>
            </div>

            <div className="mission-support-image-wrap">
              <div
                className="mission-support-image"
                style={{ backgroundImage: `url(${skylineImg})` }}
                aria-hidden="true"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="mission-footer">
        <div className="mission-shell">
          <div className="mission-footer__top">
            <span>Privacy</span>
            <span>🐦</span>
            <span>f</span>
            <span>◔</span>
            <span>Silicon Heartland</span>
          </div>
          <div className="mission-footer__email">info@siliconheartland.org</div>
        </div>
      </footer>
    </div>
  );
}
