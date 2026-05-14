import React from "react";
import "../styles/foundation-mission-page.css";

const values = [
  {
    icon: "✦",
    title: "Innovation",
    text: "Driving forward-thinking solutions",
  },
  {
    icon: "盾",
    title: "Integrity",
    text: "Commitment to transparency and trust",
  },
  {
    icon: "🤝",
    title: "Collaboration",
    text: "Partnering for greater impact",
  },
  {
    icon: "●●●",
    title: "Inclusion",
    text: "Opportunities for all to succeed",
  },
];

function Header() {
  return (
    <header className="shf-mission-header">
      <a className="shf-mission-brand" href="#/top" aria-label="Silicon Heartland Foundation">
        <span className="shf-mission-mark">
          <span />
        </span>
        <span className="shf-mission-brand-text">
          <strong>Silicon Heartland</strong>
          <small>Foundation</small>
        </span>
      </a>

      <nav className="shf-mission-nav" aria-label="Foundation navigation">
        <a href="#/top">Home</a>
        <a href="#/programs">Programs</a>
        <a href="#/impact">Impact</a>
        <a href="#/partners">Partners</a>
        <a href="#/get-involved">Get Involved</a>
        <a className="shf-mission-donate" href="#/donate">Donate</a>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="shf-mission-footer">
      <div className="shf-mission-socials">
        <span>f</span>
        <span>𝕏</span>
        <span>◉</span>
        <span>in</span>
      </div>

      <a href="mailto:info@siliconheartland.org">info@siliconheartland.org</a>

      <div className="shf-mission-footer-bottom">
        <a href="#/privacy">Privacy Policy</a>
        <span />
        <a href="#/careers">Careers</a>
        <span />
        <strong>Silicon Heartland</strong>
      </div>
    </footer>
  );
}

export default function FoundationMissionPage() {
  return (
    <main className="shf-mission-page">
      <Header />

      <section className="shf-mission-hero">
        <div className="shf-mission-hero-copy">
          <h1>
            Building the Heartland
            <br />
            of Tomorrow
          </h1>
          <p>Empowering People, Transforming Communities.</p>
          <a href="#/programs">Learn More</a>
        </div>

        <div className="shf-mission-hero-image" aria-hidden="true">
          <div className="shf-mission-photo shf-mission-photo-hero" />
        </div>
      </section>

      <section className="shf-mission-center">
        <div className="shf-mission-flourish" />
        <h2>Our Mission</h2>
        <p>
          To create pathways to education, careers, and technology that uplift
          individuals and strengthen Ohio’s communities.
        </p>
        <a href="#/programs">Learn More</a>
      </section>

      <section className="shf-mission-story">
        <div className="shf-mission-story-copy">
          <h2>Our Story</h2>
          <p>
            Founded to bridge the gap between innovation and opportunity, the
            Silicon Heartland Foundation is dedicated to fostering growth and
            resilience across Ohio. We believe in the potential of every
            individual to thrive in the digital age.
          </p>
          <a href="#/leadership">Leadership</a>
        </div>

        <div className="shf-mission-story-image">
          <div className="shf-mission-photo shf-mission-photo-story" />
        </div>
      </section>

      <section className="shf-mission-values">
        <div className="shf-mission-section-title">
          <span />
          <h2>Our Values</h2>
          <span />
        </div>

        <div className="shf-mission-value-grid">
          {values.map((item) => (
            <article className="shf-mission-value-card" key={item.title}>
              <div className="shf-mission-value-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="shf-mission-ohio">
        <div className="shf-mission-section-title">
          <span />
          <h2>In the Heart of Ohio</h2>
          <span />
        </div>

        <div className="shf-mission-ohio-panel">
          <div className="shf-mission-map" aria-label="Ohio service map">
            <div className="shf-mission-ohio-shape">
              <span className="pin pin-cincinnati" />
              <span className="pin pin-columbus" />
              <span className="pin pin-dayton" />
              <span className="pin pin-east" />
              <strong className="label label-cincinnati">Cincinnati</strong>
              <strong className="label label-columbus">Columbus</strong>
              <strong className="label label-dayton">Dayton</strong>
            </div>
          </div>

          <div className="shf-mission-ohio-copy">
            <p>
              Headquartered in Columbus, with programs impacting communities
              across the state of Ohio.
            </p>
            <strong>Together, we’re making a difference.</strong>
          </div>

          <div className="shf-mission-city" aria-hidden="true" />
        </div>
      </section>

      <Footer />
    </main>
  );
}
