import React from "react";
import shfLogo from "@/assets/brand/shf-logo-stacked.svg";
import "@/styles/shf-home.css";

import heroImg from "@/assets/brand/catalog-hero-2x1-1920.jpg";
import feature1 from "@/assets/brand/catalog-hero-16x9-1280.jpg";
import feature2 from "@/assets/brand/catalog-hero-2x1-1280.jpg";
import feature3 from "@/assets/brand/catalog-hero-16x9-1920.jpg";
import skylineImg from "@/assets/brand/hero-bg-ohio.png";

const supportCards = [
  {
    title: "For Students",
    text: "Expand access to career-focused education.",
    icon: "📖",
  },
  {
    title: "For Workforce",
    text: "Equip workers with skills for in-demand jobs.",
    icon: "💼",
  },
  {
    title: "For Technology",
    text: "Engage in robotics, drone ops, and AI programs.",
    icon: "⌘",
  },
  {
    title: "For Partners",
    text: "Support all programs and needs as they arise.",
    icon: "❤",
  },
];

const opportunities = [
  {
    title: "Summer STEM Camps",
    text: "Expand access to career-focused education.",
    image: feature1,
  },
  {
    title: "In Demand Workforce Tracks",
    text: "Equip workers with skills for in-demand jobs.",
    image: feature2,
  },
  {
    title: "Tech Education Pathways",
    text: "Set students on a path to success with advanced technology programs.",
    image: feature3,
  },
];

function SupportCard({ icon, title, text }) {
  return (
    <article className="shf-home-card">
      <div className="shf-home-card__icon" aria-hidden="true">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      <button className="shf-home-btn shf-home-btn--small shf-home-btn--copper" type="button">
        Learn More <span aria-hidden="true">›</span>
      </button>
    </article>
  );
}

function OpportunityCard({ title, text, image }) {
  return (
    <article className="shf-opportunity-card">
      <div
        className="shf-opportunity-card__image"
        style={{ backgroundImage: `url(${image})` }}
        aria-hidden="true"
      />
      <div className="shf-opportunity-card__body">
        <h3>{title}</h3>
        <p>{text}</p>
        <button className="shf-home-btn shf-home-btn--small shf-home-btn--copper" type="button">
          Donate Now <span aria-hidden="true">›</span>
        </button>
      </div>
    </article>
  );
}

export default function Top() {
  return (
    <div className="shf-homepage">
      <header className="shf-home-topbar">
        <div className="shf-home-shell shf-home-topbar__inner">
          <a href="#/top" className="shf-home-brand" aria-label="Silicon Heartland Foundation home">
            <img src={shfLogo} alt="Silicon Heartland Foundation" />
          </a>

          <nav className="shf-home-nav" aria-label="Primary">
            <a href="#/top">Home</a>
            <a href="#/programs">Programs</a>
            <a href="#/impact">Impact</a>
            <a href="#/partners">Partners</a>
            <a href="#/get-involved" className="shf-home-btn shf-home-btn--soft">
              Get Involved
            </a>
            <a href="#/donate" className="shf-home-btn shf-home-btn--copper">
              Donate
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="shf-hero">
          <div className="shf-home-shell shf-hero__inner">
            <div className="shf-hero__copy">
              <h1>Fueling Opportunity Across Ohio</h1>
              <h2>Investing in Futures, Strengthening Communities</h2>
              <p>
                Your contribution to the Silicon Heartland Foundation supports
                education, workforce development, and community growth across Ohio.
                Join us in building brighter futures.
              </p>
              <button className="shf-home-btn shf-home-btn--copper" type="button">
                Get Involved Today <span aria-hidden="true">›</span>
              </button>
            </div>

            <div className="shf-hero__art">
              <div
                className="shf-hero__image"
                style={{ backgroundImage: `url(${heroImg})` }}
                aria-hidden="true"
              />
            </div>
          </div>
        </section>

        <section className="shf-section shf-section--intro">
          <div className="shf-home-shell">
            <div className="shf-section-title">
              <h2>Make a Difference Today</h2>
              <p>
                By donating today, you help create local opportunity, support workforce
                training, and empower the next generation of innovators in Ohio.
              </p>
            </div>
          </div>
        </section>

        <section className="shf-section shf-section--support-cards">
          <div className="shf-home-shell">
            <div className="shf-home-card-grid">
              {supportCards.map((card) => (
                <SupportCard key={card.title} {...card} />
              ))}
            </div>
          </div>
        </section>

        <section className="shf-section shf-section--featured">
          <div className="shf-home-shell">
            <div className="shf-section-title">
              <h2>Featured Opportunities to Get Involved</h2>
              <p>
                Join the Silicon Heartland Foundation in empowering Ohio’s future.
                Together, we can make a difference that matters and lasts.
              </p>
            </div>

            <div className="shf-opportunity-grid">
              {opportunities.map((item) => (
                <OpportunityCard key={item.title} {...item} />
              ))}
            </div>
          </div>
        </section>

        <section className="shf-section shf-section--cta">
          <div className="shf-home-shell shf-bottom-cta">
            <div
              className="shf-bottom-cta__image"
              style={{ backgroundImage: `url(${skylineImg})` }}
              aria-hidden="true"
            />
            <div className="shf-bottom-cta__copy">
              <h2>Ready to Fuel Opportunity?</h2>
              <p>
                Find your way to contribute, learn, and grow with Silicon Heartland
                Foundation. Dive into learning, participate in workforce training,
                partner for community development, or support our mission.
              </p>
              <button className="shf-home-btn shf-home-btn--copper" type="button">
                Donate Now <span aria-hidden="true">›</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="shf-footer">
        <div className="shf-home-shell shf-footer__inner">
          <div className="shf-footer__socials" aria-label="Social links">
            <span>f</span>
            <span>t</span>
            <span>◔</span>
            <span>in</span>
          </div>

          <div className="shf-footer__links">
            <a href="#/privacy">Privacy Policy</a>
            <a href="#/careers">Careers</a>
          </div>

          <div className="shf-footer__brand">
            <img src={shfLogo} alt="Silicon Heartland" />
          </div>
        </div>
      </footer>
    </div>
  );
}
