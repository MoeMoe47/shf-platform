import React from "react";
import shfLogo from "@/assets/brand/shf-logo-stacked.svg";
import heroImage from "@/assets/brand/catalog-hero-2x1-1920.jpg";
import card1 from "@/assets/brand/catalog-hero-16x9-1280.jpg";
import card2 from "@/assets/brand/catalog-hero-2x1-1280.jpg";
import card3 from "@/assets/brand/catalog-hero-16x9-1920.jpg";
import skyline from "@/assets/brand/hero-bg-ohio.png";
import "@/styles/shf-about.css";

function ProgramCard({ title, image, meta }) {
  return (
    <article className="shfa-card">
      <h3>{title}</h3>
      <div
        className="shfa-card__image"
        style={{ backgroundImage: `url(${image})` }}
        aria-hidden="true"
      />
      <div className="shfa-card__meta">{meta}</div>
      <button className="shfa-linkBtn" type="button">
        Learn More <span aria-hidden="true">›</span>
      </button>
    </article>
  );
}

export default function About() {
  return (
    <div className="shfa-page">
      <header className="shfa-topbar">
        <div className="shfa-shell shfa-topbar__inner">
          <a href="#/top" className="shfa-brand" aria-label="Silicon Heartland Foundation home">
            <img src={shfLogo} alt="Silicon Heartland Foundation" />
          </a>

          <nav className="shfa-nav" aria-label="Primary">
            <a href="#/about">About</a>
            <a href="#/programs">Programs</a>
            <a href="#/impact">Impact</a>
            <a href="#/careers">Careers</a>
            <a href="#/get-involved">Get Involved</a>
            <a href="#/donate" className="shfa-btn shfa-btn--navy">Donate</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="shfa-hero">
          <div className="shfa-shell shfa-hero__inner">
            <div className="shfa-hero__copy">
              <h1>Launching Programs That Create Real Opportunity Across Ohio</h1>
              <p>
                We design and operate education, workforce, and recovery programs
                that help individuals build stronger futures across Ohio communities.
              </p>
              <div className="shfa-hero__actions">
                <button className="shfa-btn shfa-btn--copper" type="button">
                  Explore Programs
                </button>
                <button className="shfa-btn shfa-btn--navy" type="button">
                  Support the Mission
                </button>
              </div>
            </div>

            <div className="shfa-hero__media">
              <div
                className="shfa-hero__image"
                style={{ backgroundImage: `url(${heroImage})` }}
                aria-hidden="true"
              />
            </div>
          </div>
        </section>

        <section className="shfa-kpis">
          <div className="shfa-shell shfa-kpis__inner">
            <div className="shfa-kpi">
              <strong>12,500+</strong>
              <span>Lives Reached</span>
            </div>
            <div className="shfa-kpi">
              <strong>4,200+</strong>
              <span>Certifications Earned</span>
            </div>
            <div className="shfa-kpi">
              <strong>85%</strong>
              <span>Job Placement Rate</span>
            </div>
          </div>
        </section>

        <section className="shfa-section shfa-mission">
          <div className="shfa-shell">
            <div className="shfa-headingWrap">
              <h2>Our Mission</h2>
            </div>
            <h3>Expanding Access to Education, Workforce and Recovery Pathways</h3>
            <p className="shfa-centerCopy">
              Silicon Heartland Foundation launches programs that support individuals,
              strengthen communities, and create long-term opportunity through real
              support, real training, and real pathways.
            </p>
          </div>
        </section>

        <section className="shfa-section shfa-programs">
          <div className="shfa-shell">
            <div className="shfa-headingWrap">
              <h2>Programs That</h2>
            </div>

            <div className="shfa-cardGrid">
              <ProgramCard
                title="Education Pathways"
                image={card1}
                meta="4,200+ Certifications Earned"
              />
              <ProgramCard
                title="Workforce Training"
                image={card2}
                meta="85% Job Placement Rate"
              />
              <ProgramCard
                title="Recovery Support"
                image={card3}
                meta="Measured progress across active programs"
              />
            </div>
          </div>
        </section>

        <section className="shfa-section shfa-information">
          <div className="shfa-shell shfa-information__inner">
            <div className="shfa-headingWrap">
              <h2>Programs Backed by Better Information</h2>
            </div>
            <p className="shfa-centerCopy">
              Our programs are strengthened by connected tools that help track progress,
              improve performance, and guide smarter decisions over time.
            </p>
            <div className="shfa-centerActions">
              <button className="shfa-btn shfa-btn--navy" type="button">
                See How It Works
              </button>
            </div>
          </div>
        </section>

        <section className="shfa-section shfa-support">
          <div className="shfa-shell shfa-support__inner">
            <div className="shfa-support__copy">
              <div className="shfa-headingWrap">
                <h2>Support the Mission</h2>
              </div>
              <h3>Invest in Programs That Change Lives</h3>
              <p className="shfa-centerCopy">
                Your support helps expand access to education, opportunity, and progress
                across Ohio.
              </p>

              <div className="shfa-support__actions">
                <button className="shfa-btn shfa-btn--copper" type="button">
                  Donate Today
                </button>
                <button className="shfa-btn shfa-btn--navy" type="button">
                  Become a Partner
                </button>
              </div>
            </div>

            <div className="shfa-support__media">
              <div
                className="shfa-support__image"
                style={{ backgroundImage: `url(${skyline})` }}
                aria-hidden="true"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="shfa-footer">
        <div className="shfa-shell">
          <div className="shfa-footer__socials">
            <span>Privacy</span>
            <span>🐦</span>
            <span>f</span>
            <span>◔</span>
            <span>Silicon Heartland</span>
          </div>
          <div className="shfa-footer__email">info@siliconheartland.org</div>
        </div>
      </footer>
    </div>
  );
}
