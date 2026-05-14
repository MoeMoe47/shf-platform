import React from "react";
import "./shs-solutions-home.css";

const benefits = [
  ["Command Center Clarity", "See operations, outcomes, partners, reports, and risks in one place."],
  ["Verified Outcomes", "Track what happened, collect evidence, and prove the work."],
  ["Easier Reporting", "Turn daily activity into board-ready, funder-ready, and audit-ready reports."],
  ["Partner Coordination", "Align referrals, tasks, handoffs, updates, and shared accountability."],
  ["AI Analyst Support", "Surface risks, explain patterns, and recommend the next best move."],
  ["Built to Scale", "Start with one program and grow into teams, partners, and service lanes."]
];

const metrics = [
  ["235+", "Programs Powered"],
  ["12,540+", "Reports Generated"],
  ["85,000+", "Outcomes Verified"],
  ["1,250+", "Partners Connected"],
  ["18,600+", "Hours Saved in Reporting"],
  ["$48M+", "Funding Supported"]
];

const audiences = [
  ["Nonprofits", "Run programs, track outcomes, and prove impact."],
  ["Workforce Programs", "Manage participants, services, placements, and results."],
  ["Healthcare Services", "Coordinate care programs and track verified outcomes."],
  ["Education Providers", "Manage students, programs, and reporting in one place."],
  ["Government Partners", "Improve visibility, compliance, and service delivery."],
  ["Logistics Operators", "Track operations, assets, and performance in real time."],
  ["Service Businesses", "Streamline operations and scale with clarity."],
  ["Funders & Foundations", "See proof, reduce risk, and increase confidence."]
];

export default function Home() {
  return (
    <main className="shs-solutions-home">
      <section className="shs-hero">
        <div className="hero-base-layer" />
        <img
          className="hero-geo-image"
          src="/assets/solutions/solutions-infrastructure-globe.png"
          alt=""
          aria-hidden="true"
        />
        <div className="hero-dark-overlay" />
        <div className="hero-blue-glow" />
        <div className="hero-grid-overlay" />
        <div className="hero-particle-layer" />

        <div className="hero-safe">
          <div className="hero-copy">
            <p className="eyebrow">Silicon Heartland Solutions</p>

            <h1>
              Run your entire organization from{" "}
              <span>one command center.</span>
            </h1>

            <p className="hero-subtext">
              SHS helps your team manage operations, verify outcomes,
              coordinate partners, and report results from one trusted
              infrastructure layer.
            </p>

            <div className="hero-actions">
              <a className="shs-btn shs-btn-primary" href="#/join">
                Join Now <span>→</span>
              </a>
              <a className="shs-btn shs-btn-outline" href="#/commercial">
                Watch Commercial
              </a>
              <a className="shs-btn shs-btn-outline" href="#/request-demo">
                Request Demo
              </a>
            </div>

            <div className="trust-strip">
              <span>Secure & Compliant</span>
              <span>Built for Outcomes</span>
              <span>Trusted by Organizations</span>
            </div>
          </div>

          <div className="command-wrap">
            <div className="command-card">
              <div className="command-top">
                <strong>SHS Command Center</strong>
                <span>● ● ●</span>
              </div>

              <div className="command-body">
                <aside className="command-rail">
                  <b>Overview</b>
                  <span>Operations</span>
                  <span>Programs</span>
                  <span>Partners</span>
                  <span>Outcomes</span>
                  <span>Reports</span>
                  <span>AI Analyst</span>
                </aside>

                <section className="command-main">
                  <div className="command-mini">
                    <small>Active Programs</small>
                    <strong>23</strong>
                    <em>+12% last month</em>
                  </div>

                  <div className="command-mini">
                    <small>Outcomes Verified</small>
                    <strong>1,248</strong>
                    <em>This month</em>
                  </div>

                  <div className="command-mini">
                    <small>Reports Ready</small>
                    <strong>24</strong>
                    <em>Ready to export</em>
                  </div>

                  <div className="command-mini command-alert">
                    <small>Alerts</small>
                    <strong>8</strong>
                    <em>Needs attention</em>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="dark-to-white-fade" />

      <section className="white-section">
        <div className="section-heading">
          <h2>Why Organizations Choose SHS</h2>
          <p>
            Everything needed to operate, prove, and grow — built into one
            infrastructure.
          </p>
        </div>

        <div className="benefit-grid">
          {benefits.map(([title, text]) => (
            <article className="benefit-card" key={title}>
              <div className="card-icon">✦</div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="metrics-band">
        <h2>Proven Impact. Real Results.</h2>

        <div className="metrics-grid">
          {metrics.map(([number, label]) => (
            <div className="metric-card" key={label}>
              <strong>{number}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="white-section">
        <div className="section-heading">
          <h2>Who SHS Is Built For</h2>
          <p>One command infrastructure for many kinds of organizations.</p>
        </div>

        <div className="audience-grid">
          {audiences.map(([title, text]) => (
            <article className="audience-card" key={title}>
              <div className="card-icon">◎</div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="method-section">
        <div className="section-heading dark">
          <h2>The SHS Command Method</h2>
          <p>Operate clearly. Verify outcomes. Report with confidence.</p>
        </div>

        <div className="method-grid">
          <article>
            <span>1</span>
            <h3>Operate</h3>
            <p>
              Manage workflows, tasks, people, cases, and partners from one
              command center.
            </p>
          </article>

          <article>
            <span>2</span>
            <h3>Verify</h3>
            <p>
              Track outcomes, collect evidence, and ensure quality, readiness,
              and accountability.
            </p>
          </article>

          <article>
            <span>3</span>
            <h3>Report</h3>
            <p>
              Generate dashboards, proof packets, and reports for leaders,
              funders, partners, and boards.
            </p>
          </article>
        </div>
      </section>

      <section className="conversion-section">
        <article className="built-card">
          <div>
            <p className="eyebrow light">Built on SHS</p>
            <h2>Have a business that needs more than a website?</h2>
            <p>
              SHS helps selected founders and organizations build
              command-center businesses with workflows, verified data, AI
              support, reporting, and scalable infrastructure built in from day
              one.
            </p>

            <ul>
              <li>Full infrastructure and technology</li>
              <li>Operations and workflow design</li>
              <li>AI analyst and reporting</li>
              <li>Growth and scale support</li>
              <li>Equity or revenue share options</li>
            </ul>

            <a className="shs-btn shs-btn-gold" href="#/built-on-shs">
              Apply to Build on SHS
            </a>
          </div>

          <div className="laptop-visual" aria-hidden="true">
            <div className="laptop-screen">
              <div />
              <div />
              <div />
              <div />
            </div>
            <div className="laptop-base" />
          </div>
        </article>

        <article className="commercial-card" id="commercial">
          <p className="eyebrow light">Commercial Story</p>
          <h2>See the SHS Command Center Story</h2>
          <p>
            In 60 seconds, see how SHS turns scattered operations into verified
            infrastructure for action, proof, reporting, and growth.
          </p>

          <div className="video-shell">
            <button aria-label="Play commercial">▶</button>
          </div>

          <a href="#/commercial">Watch Commercial</a>
        </article>
      </section>

      <section className="final-cta">
        <h2>
          Your organization is already doing the work.
          <span> Now give it the infrastructure to prove it.</span>
        </h2>

        <div className="final-actions">
          <a className="shs-btn shs-btn-primary" href="#/join">Join Now</a>
          <a className="shs-btn shs-btn-outline" href="#/request-demo">
            Request Demo
          </a>
        </div>
      </section>
    </main>
  );
}
