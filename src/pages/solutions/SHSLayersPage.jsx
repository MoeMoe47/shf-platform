import React from "react";
import "./shs-layers-page.css";

const LOGO_SRC = "/assets/hub/shs-hub-logo.png";

const layers = [
  {
    num: "08",
    title: "Analyst Layer",
    text: "AI and human analysts turn data into insights, identify trends, and recommend actions.",
    icon: "✣",
    tone: "purple",
  },
  {
    num: "07",
    title: "AI Governance Layer",
    text: "Policy controls, human oversight, explainability, auditability, and safety guardrails for AI.",
    icon: "♜",
    tone: "violet",
  },
  {
    num: "06",
    title: "Oracle Layer",
    text: "The truth engine that unifies and verifies data across all sources. One trusted view of reality.",
    icon: "⬡",
    tone: "violet",
  },
  {
    num: "05",
    title: "Operational Command Surface",
    text: "Real-time dashboards and controls for leaders and operators to monitor, manage, and act with confidence.",
    icon: "▣",
    tone: "blue",
  },
  {
    num: "04",
    title: "Reporting & Audit Layer",
    text: "Automated reports, audit packs, and trust envelopes that prove outcomes and ensure accountability.",
    icon: "◇",
    tone: "cyan",
  },
  {
    num: "03",
    title: "Integration Layer",
    text: "Secure connections to the systems you use today—HHS, SIS, CRM, finance, case management, and more.",
    icon: "∞",
    tone: "teal",
  },
  {
    num: "02",
    title: "Security & Trust Layer",
    text: "Identity, access, permissions, encryption, and audit trails protect data and ensure compliance.",
    icon: "▨",
    tone: "green",
  },
  {
    num: "01",
    title: "Data Ingestion Layer",
    text: "Collects data from multiple sources in real time and batch. Clean, standardize, and prepare for truth.",
    icon: "◉",
    tone: "gold",
  },
];

const principles = [
  ["◇", "Built for trust", "Security, privacy, and governance are built into every layer."],
  ["⌬", "Built for scale", "Modular by design to grow with your mission, partners, and communities."],
  ["◎", "Built for impact", "From data to decisions—every layer works together to drive real outcomes."],
  ["✣", "AI governance by design", "Responsible, explainable, and controlled use of AI—built into the platform."],
];

const flow = [
  ["01", "Ingest", "Data flows in from multiple sources—clean, standardized, and structured.", "gold"],
  ["02", "Secure", "Data is protected with enterprise-grade security, access controls, and audit trails.", "green"],
  ["03", "Integrate", "Connected systems share data seamlessly through secure integrations.", "teal"],
  ["04", "Report & Audit", "Outcomes are measured and documented with automated reports and audit-ready outputs.", "cyan"],
  ["05", "Operate", "Leaders and teams use real-time dashboards and workflows to act with clarity.", "blue"],
  ["07", "Govern & Explain AI", "AI is governed with policy controls, human oversight, explainability, and safety guardrails.", "violet"],
  ["08", "Get Insights", "Analysts and AI turn data into insights and recommendations that drive better decisions.", "purple"],
];

const overview = [
  ["01", "Data Ingestion Layer", "Captures data from programs, partners, agencies, and systems in real time or batch.", ["Multi-source intake", "Data validation & cleansing", "Standardization & mapping"], "gold"],
  ["02", "Security & Trust Layer", "Ensures data is secure, private, and used only as intended.", ["Identity & access management", "Role-based permissions", "Encryption & audit trails"], "green"],
  ["03", "Integration Layer", "Connects SHS with the tools and systems you already use.", ["Pre-built connectors", "APIs & webhooks", "Bi-directional sync"], "teal"],
  ["04", "Reporting & Audit Layer", "Creates reports and audit packs that prove results and maintain accountability.", ["Executive dashboards", "Audit-ready exports", "Trust envelopes"], "cyan"],
  ["05", "Operational Command Surface", "Gives leaders and operators real-time visibility and control.", ["Live dashboards", "Alerts & notifications", "Workflow management"], "blue"],
  ["06", "Oracle Layer", "The single source of truth that unifies, deduplicates, and verifies data.", ["Data unification", "De-duplication", "Continuity & accuracy"], "violet"],
  ["07", "AI Governance Layer", "Ensures AI use is responsible, explainable, and aligned to policy.", ["Policy controls", "Human oversight", "Explainability & transparency", "Auditability", "Safety guardrails"], "violet"],
  ["08", "Analyst Layer", "Transforms trusted data into intelligence and recommended actions.", ["Trend analysis", "Risk & opportunity detection", "Action recommendations"], "purple"],
];

function Header() {
  return (
    <header className="shl-header">
      <a className="shl-brand" href="#/home" aria-label="Silicon Heartland Solutions">
        <span className="shl-brandTextLogo">SHS</span>
        <span className="shl-brandDivider" />
        <span className="shl-brandWords">Silicon Heartland<br />Solutions</span>
      </a>

      <nav className="shl-nav" aria-label="Primary navigation">
        <a href="#/home">Solutions</a>
        <a href="#/infrastructure">Infrastructure</a>
        <a className="is-active" href="#/layers">Platform</a>
        <a href="#/about/team">About</a>
        <a href="#/resources">Resources</a>
        <a href="#/request-demo">Contact</a>
      </nav>

      <a className="shl-demoBtn" href="#/request-demo">Request Demo</a>
    </header>
  );
}

function LayerStack() {
  return (
    <section className="shl-stack">
      <div className="shl-groupRail">
        <span>Intelligence</span>
        <span>Operations</span>
        <span>Foundation</span>
      </div>

      <div className="shl-layerList">
        {layers.map((layer) => (
          <article className={`shl-layer shl-tone--${layer.tone}`} key={layer.num}>
            <div className="shl-layerIcon">{layer.icon}</div>
            <div className="shl-layerCopy">
              <h3>{layer.title}</h3>
              <p>{layer.text}</p>
            </div>
            <strong>{layer.num}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function SHSLayersPage() {
  return (
    <main className="shl-page">
      <Header />

      <section className="shl-hero">
        <aside className="shl-intro">
          <p className="shl-kicker">Layers</p>
          <h1>All the Layers. Working Together.</h1>
          <p className="shl-lead">
            SHS is built on a layered platform that turns scattered activity into verified outcomes and actionable intelligence. Each layer has a distinct role—together they create a trusted system of record, insight, and action.
          </p>

          <div className="shl-principles">
            {principles.map(([icon, title, text]) => (
              <article key={title}>
                <div>{icon}</div>
                <span>
                  <strong>{title}</strong>
                  <small>{text}</small>
                </span>
              </article>
            ))}
          </div>

          <div className="shl-aiNotice">
            <div>◇</div>
            <p>
              SHS includes AI governance to ensure the analyst and AI-assisted layers are trusted, accountable, and aligned with policy.
            </p>
          </div>
        </aside>

        <LayerStack />
      </section>

      <section className="shl-flow">
        <h2>How the Layers Work Together</h2>
        <div className="shl-flowGrid">
          {flow.map(([num, title, text, tone], index) => (
            <React.Fragment key={title}>
              <article className={`shl-flowStep shl-tone--${tone}`}>
                <div className="shl-flowIcon">{num}</div>
                <h3>{index + 1}. {title}</h3>
                <p>{text}</p>
              </article>
              {index < flow.length - 1 ? <span className="shl-arrow">→</span> : null}
            </React.Fragment>
          ))}
        </div>
      </section>

      <section className="shl-overview">
        <h2>Layer-by-Layer Overview</h2>
        <div className="shl-overviewGrid">
          {overview.map(([num, title, text, bullets, tone]) => (
            <article className={`shl-overviewCard shl-tone--${tone}`} key={num}>
              <header>
                <span>{num}</span>
                <h3>{title}</h3>
              </header>
              <p>{text}</p>
              <ul>
                {bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
              </ul>
            </article>
          ))}

          <article className="shl-scaleCard">
            <h3>Built as One. Designed to Scale.</h3>
            <p>
              Each layer is powerful on its own. Together, they create a system that turns data into verified outcomes—and outcomes into lasting community impact.
            </p>
            <div className="shl-cube" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </article>
        </div>
      </section>

      <section className="shl-cta">
        <div className="shl-ctaIcon">
          <img src={LOGO_SRC} alt="" />
        </div>
        <div>
          <h2>A platform you can trust. Results you can prove.</h2>
          <p>
            SHS brings all the right layers together to help organizations make smarter decisions and build stronger communities.
          </p>
        </div>
        <a href="#/request-demo">Request a Demo</a>
        <a className="ghost" href="#/contact">Talk to Our Team →</a>
      </section>

      <footer className="shl-footer">
        <div className="shl-footerBrand">
          <span>SHS</span>
          <small>Silicon Heartland<br />Solutions</small>
        </div>
        <p>© 2025 Silicon Heartland Solutions. All rights reserved.</p>
        <div className="shl-socials">
          <span>in</span>
          <span>𝕏</span>
          <span>▶</span>
          <span>✉</span>
        </div>
      </footer>
    </main>
  );
}
