import React from "react";
import "../styles/about.css";

import heroImg from "../assets/foundation/hero-main.jpg";

function Card({ title, metric, description }) {
  return (
    <article className="about-card">
      <div className="about-card-image" aria-hidden="true" />
      <h3>{title}</h3>
      <div className="about-card-metric">{metric}</div>
      <p>{description}</p>
      <button className="about-link" type="button">
        Learn More <span aria-hidden="true">›</span>
      </button>
    </article>
  );
}

export default function About() {
  return (
    <div className="about-page">
      <section className="about-hero shell">
        <div className="about-hero-copy">
          <h1>Launching Programs That Create Real Opportunity Across Ohio</h1>
          <p>
            We design and operate education, workforce, and recovery programs
            that help individuals build stronger futures across Ohio communities.
          </p>
          <div className="about-hero-actions">
            <button className="btn-copper" type="button">Explore Programs</button>
            <button className="btn-navy" type="button">Support the Mission</button>
          </div>
        </div>

        <div className="about-hero-media">
          <div
            className="about-hero-image"
            style={{ backgroundImage: `url(${heroImg})` }}
            aria-hidden="true"
          />
        </div>
      </section>

      <section className="about-kpis">
        <div className="shell about-kpis-inner">
          <div><strong>12,500+</strong><span>Lives Reached</span></div>
          <div><strong>4,200+</strong><span>Certifications Earned</span></div>
          <div><strong>85%</strong><span>Job Placement Rate</span></div>
        </div>
      </section>

      <section className="about-section shell">
        <div className="section-title"><span>Our Mission</span></div>
        <h2>Expanding Access to Education, Workforce and Recovery Pathways</h2>
        <p className="center-copy">
          Silicon Heartland Foundation launches programs that support individuals,
          strengthen communities, and create long-term opportunity through real
          support, real training, and real pathways.
        </p>
      </section>

      <section className="about-section shell">
        <div className="section-title"><span>Programs That</span></div>
        <div className="about-card-grid">
          <Card
            title="Education Pathways"
            metric="4,200+ Certifications Earned"
            description=""
          />
          <Card
            title="Workforce Training"
            metric="85% Job Placement Rate"
            description=""
          />
          <Card
            title="Recovery Support"
            metric="Measured progress across active programs"
            description=""
          />
        </div>
      </section>

      <section className="about-section shell centered">
        <div className="section-title"><span>Programs Backed by Better Information</span></div>
        <p className="center-copy">
          Our programs are strengthened by connected tools that help track progress,
          improve performance, and guide smarter decisions over time.
        </p>
        <button className="btn-navy" type="button">See How It Works</button>
      </section>

      <section className="about-section shell centered about-support">
        <div className="section-title"><span>Support the Mission</span></div>
        <h2>Invest in Programs That Change Lives</h2>
        <p className="center-copy">
          Your support helps expand access to education, opportunity, and progress Ohio.
        </p>
        <div className="about-support-actions">
          <button className="btn-copper" type="button">Donate Today</button>
          <button className="btn-navy" type="button">Become a Partner</button>
        </div>
        <div className="about-support-image" aria-hidden="true" />
      </section>

      <footer className="about-footer shell">
        <div className="about-footer-row">
          <span>Privacy</span>
          <span>🐦</span>
          <span>f</span>
          <span>◔</span>
          <span>Silicon Heartland</span>
        </div>
        <div className="about-footer-email">info@siliconheartland.org</div>
      </footer>
    </div>
  );
}
