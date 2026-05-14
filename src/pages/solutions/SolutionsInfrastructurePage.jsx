import React from "react";
import "./solutions-infrastructure.css";

import "./solutions-infrastructure-footer.css";
import SolutionsInfrastructureLogicPanel from "./SolutionsInfrastructureLogicPanel.jsx";
const LOGO_SRC = "/assets/branding/shs-hub-logo.png";
const GLOBE_SRC = "/assets/solutions/solutions-infrastructure-globe.png";

const pipeline = [
  "Source Intake",
  "Aggregation",
  "Verification",
  "Reconciliation",
  "Oracle",
  "Analyst Layer",
  "Reports",
  "Action Loop",
];

const cards = [
  ["Integration Fabric", "Connect existing systems with APIs, webhooks, imports, and normalized event flows."],
  ["Oracle Truth Package", "Package verified claims with source lineage, confidence, contradiction state, and readiness."],
  ["Trust Envelopes", "Attach proof, context, and audit integrity to important outputs."],
  ["Verification-Weighted Reporting", "Generate reports that reflect evidence strength and decision confidence."],
];

const layers = [
  "Identity & Access",
  "API & Integration",
  "Event Layer",
  "Hub Collaboration",
  "Oracle Layer",
  "Analyst Layer",
  "Reporting Layer",
];

export default function SolutionsInfrastructurePage() {
  return (
    <main className="solutionsInfra">

      <div className="shs-infra-official-brand">
        <img src="/assets/shs/shs-logo-mark.svg" alt="Silicon Heartland Solutions" />
        <div>
          <strong>Silicon Heartland Solutions</strong>
          <span>Verified Outcome Infrastructure</span>
        </div>
      </div>

      <header className="solutionsInfra__nav">
        <div className="solutionsInfra__brand">
          <span className="solutionsInfra__logo">
            <img src={LOGO_SRC} alt="Silicon Heartland Solutions logo" />
          </span>
          <div>
            <strong>Silicon Heartland</strong>
            <small>Solutions</small>
          </div>
        </div>

        <nav>
          <a className="active">Infrastructure</a>
          <a>Solutions</a>
          <a>Trust</a>
          <a>About</a>
          <a>Contact</a>
        </nav>

        <button type="button">Request a Demo →</button>
      </header>

      <section className="solutionsInfra__hero">
        <div className="solutionsInfra__copy">
          <h1>Solutions Infrastructure</h1>
          <h2>The Infrastructure Layer for Verified Outcomes.</h2>
          <p>
            We connect systems, verify truth, and turn activity into trusted reporting and action across the Heartland.
          </p>

          <div className="solutionsInfra__chips">
            <span>🛡 Verified Truth</span>
            <span>✣ Interoperable</span>
            <span>🔒 Secure by Design</span>
          </div>
        </div>

        <div className="solutionsInfra__core">
          <div className="solutionsInfra__map" />
          <div className="solutionsInfra__ring ring1" />
          <div className="solutionsInfra__ring ring2" />
          <div className="solutionsInfra__globe">
            <img src={GLOBE_SRC} alt="Holographic global infrastructure sphere" />
          </div>

          <div className="node node1">Data Intake</div>
          <div className="node node2">Aggregation</div>
          <div className="node node3">Verification</div>
          <div className="node node4">Reconciliation</div>
          <div className="node node5">Oracle Truth Package</div>
          <div className="node node6">Analyst Intelligence</div>
          <div className="node node7">Reporting</div>
          <div className="node node8">Action Loop</div>
        </div>
      </section>

      <section className="solutionsInfra__pipeline">
        <h3>The Verified Truth Pipeline</h3>
        <div>
          {pipeline.map((item, index) => (
            <article key={item}>
              <b>{String(index + 1).padStart(2, "0")}</b>
              <strong>{item}</strong>
              <p>{index === 0 ? "Ingest activity and data." : index === 4 ? "Package trusted truth." : "Move the system forward."}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="solutionsInfra__two">
        <div className="solutionsInfra__panel">
          <h3>Infrastructure That Proves What Happened</h3>
          <div className="solutionsInfra__cardGrid">
            {cards.map(([title, body]) => (
              <article key={title}>
                <span>◇</span>
                <h4>{title}</h4>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="solutionsInfra__panel">
          <h3>Why It Matters</h3>
          <div className="solutionsInfra__matter">
            <article>Connect existing systems</article>
            <article>Resolve contradictions</article>
            <article>Produce funder-grade evidence</article>
            <article>Turn verified outcomes into decisions</article>
          </div>
        </div>
      </section>

      <section className="solutionsInfra__layers">
        <h3>SHS Infrastructure Layers</h3>
        <div>
          {layers.map((layer) => (
            <article key={layer}>
              <span>▣</span>
              <strong>{layer}</strong>
            </article>
          ))}
        </div>
        <footer>Verified Truth. Stronger Communities. Smarter Systems.</footer>
      </section>
    
      
      <SolutionsInfrastructureLogicPanel />

      <section className="shs-infra-cta-band shs-infra-cta-band--official">
        <div className="shs-infra-cta-brand">
          <img src="/assets/shs/shs-logo-mark.svg" alt="Silicon Heartland Solutions" />
          <div>
            <h2>A platform you can trust. Results you can prove.</h2>
            <p>
              SHS brings identity, integration, verification, reporting, AI analysis,
              and audit-ready trust infrastructure together for organizations that need
              dependable outcomes and institutional-grade clarity.
            </p>
          </div>
        </div>

        <div className="shs-infra-cta-actions">
          <a href="/solutions.html#/request-demo" className="shs-infra-primary-link">
            Request a Demo
          </a>
          <a href="/solutions.html#/contact" className="shs-infra-secondary-link">
            Talk to Our Team →
          </a>
        </div>
      </section>

      <footer className="shs-infra-institutional-footer">
        <div className="shs-infra-footer-glow" />

        <div className="shs-infra-footer-inner">
          <div className="shs-infra-footer-brand">
            <div className="shs-infra-footer-brand-row">
              <img src="/assets/shs/shs-logo-mark.svg" alt="Silicon Heartland Solutions logo" />
              <div>
                <h3>Silicon Heartland Solutions</h3>
                <p>
                  Verified infrastructure for coordination, outcome proof, reporting,
                  audit readiness, and trusted institutional operations.
                </p>
              </div>
            </div>

            <div className="shs-infra-footer-badges">
              <span>Secure Infrastructure</span>
              <span>Audit Ready</span>
              <span>Trust Envelopes</span>
              <span>Adaptive Analyst Layer</span>
            </div>
          </div>

          <nav className="shs-infra-footer-links" aria-label="Silicon Heartland Solutions footer links">
            <div>
              <h4>Solutions</h4>
              <a href="/solutions.html#/solutions/infrastructure">Infrastructure</a>
              <a href="/solutions.html#/solutions/reporting">Reporting</a>
              <a href="/solutions.html#/solutions/verification">Verification</a>
              <a href="/solutions.html#/solutions/hub">Hub Collaboration</a>
            </div>

            <div>
              <h4>Platform</h4>
              <a href="/capital.html#/exchange/command">Command Surface</a>
              <a href="/admin.html#/aggregation">Aggregation</a>
              <a href="/admin.html#/verification-audit">Audit Ledger</a>
              <a href="/admin.html#/growth">Partner Growth Engine</a>
            </div>

            <div>
              <h4>Company</h4>
              <a href="/solutions.html#/request-demo">Request a Demo</a>
              <a href="/solutions.html#/contact">Contact</a>
              <a href="/solutions.html#/security">Security</a>
              <a href="/solutions.html#/about">About SHS</a>
            </div>
          </nav>

          <div className="shs-infra-footer-meta">
            <div>
              <span>System Status</span>
              <strong>Operational</strong>
            </div>
            <div>
              <span>Surface</span>
              <strong>Infrastructure Page</strong>
            </div>
            <div>
              <span>Brand</span>
              <strong>SHS</strong>
            </div>
          </div>
        </div>

        <div className="shs-infra-footer-bottom">
          <div className="shs-infra-footer-wordmark">
            <strong>SHS</strong>
            <span>Silicon Heartland Solutions</span>
          </div>

          <p>© 2026 Silicon Heartland Solutions. All rights reserved.</p>

          <div className="shs-infra-footer-social">
            <span>in</span>
            <span>𝕏</span>
            <span>▶</span>
            <span>✉</span>
          </div>
        </div>
      </footer>

</main>
  );
}

