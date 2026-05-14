import React from "react";
import FoundationLayout from "../layout/FoundationLayout";
import "../styles/foundation.css";

export default function Home() {
  return (
    <FoundationLayout>
      <section className="shf-hero">
        <div className="shf-shell shf-hero__grid">
          <div className="shf-hero__content">
            <div className="shf-eyebrow">Silicon Heartland Foundation</div>

            <h1 className="shf-hero__title">
              Launching Programs That Create Real Opportunity Across Ohio
            </h1>

            <p className="shf-hero__text">
              We design and operate education, workforce, and recovery programs
              that help individuals build stronger futures across Ohio communities.
            </p>

            <div className="shf-hero__actions">
              <a className="shf-btn shf-btn--primary" href="/foundation/programs">
                Explore Programs
              </a>
              <a className="shf-btn shf-btn--secondary" href="/foundation/donate">
                Support the Mission
              </a>
            </div>
          </div>

          <div className="shf-hero__visual">
            <div className="shf-hero__imageWrap">
              <img
                className="shf-hero__image"
                src="/assets/foundation/hero/home-hero.jpg"
                alt=""
              />
              <div className="shf-hero__imageFade" aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      <section className="shf-kpi-band">
        <div className="shf-shell shf-kpi-band__grid">
          <div className="shf-kpi">
            <span className="shf-kpi__value">12,500+</span>
            <span className="shf-kpi__label">Lives Reached</span>
          </div>

          <div className="shf-kpi">
            <span className="shf-kpi__value">4,200+</span>
            <span className="shf-kpi__label">Certifications Earned</span>
          </div>

          <div className="shf-kpi">
            <span className="shf-kpi__value">85%</span>
            <span className="shf-kpi__label">Job Placement Rate</span>
          </div>
        </div>
      </section>
    </FoundationLayout>
  );
}
