import React from "react";
import OperatorIdentityBadge from "./components/OperatorIdentityBadge";
import useOperatorIdentity from "./useOperatorIdentity";
import "./shs-unified-truth-shell.css";

const SHS_LOGO_SRC = "/assets/branding/shs_orbiter_logo.png";

const navItems = [
  { icon: "⌂", label: "Overview", tone: "blue" },
  { icon: "📥", label: "Intake", tone: "cyan" },
  { icon: "🧩", label: "Aggregation", tone: "cyan" },
  { icon: "🛡", label: "Verification", tone: "green" },
  { icon: "⚖", label: "Reconciliation", tone: "gold" },
  { icon: "🔮", label: "Oracle", tone: "violet" },
  { icon: "✦", label: "Analyst", tone: "violet" },
  { icon: "⚡", label: "Actions", tone: "orange" },
  { icon: "▤", label: "Reports", tone: "blue" },
  { icon: "🔗", label: "Audit Ledger", tone: "green" },
  { icon: "⚙", label: "Settings", tone: "muted" },
];

const headerChips = [
  { icon: "◎", label: "Oracle Active", sub: "All Systems Operational", tone: "green" },
  { icon: "⌘", label: "Verification 91%", sub: "↑ 4% vs 7d", tone: "blue" },
  { icon: "◇", label: "Contradictions 3 Open", sub: "↓ 1 vs 7d", tone: "orange" },
  { icon: "✦", label: "Reporting Readiness High", sub: "↑ 5% vs 7d", tone: "green" },
  { icon: "↻", label: "Ledger Sync Live", sub: "Last sync 1m ago", tone: "teal" },
];

const kpis = [
  {
    icon: "👥",
    label: "People Served",
    value: "582,417",
    delta: "↑ 6.3%",
    sub: "Evidence-backed",
    tone: "blue",
  },
  {
    icon: "🛡",
    label: "Verified Outcomes",
    value: "312,894",
    delta: "↑ 8.7%",
    sub: "Evidence-backed",
    tone: "blue",
  },
  {
    icon: "▦",
    label: "Programs Active",
    value: "147",
    delta: "↑ 3",
    sub: "Institutional score",
    tone: "violet",
  },
  {
    icon: "$",
    label: "Funding Deployed",
    value: "$128.7M",
    delta: "↑ 9.4%",
    sub: "Audited & evidence-linked",
    tone: "gold",
  },
  {
    icon: "⚠",
    label: "Risk Alerts",
    value: "7",
    delta: "↑ 1",
    sub: "Requires review",
    tone: "orange",
  },
  {
    icon: "✦",
    label: "Grant Readiness",
    value: "91%",
    delta: "↑ 6%",
    sub: "Institutional score",
    tone: "green",
  },
];

const queueItems = [
  { icon: "▣", label: "Incoming Cases", value: "128", meta: "Newest 10:37 AM", tone: "blue" },
  { icon: "⚑", label: "Flagged Entities", value: "23", meta: "High Risk Review", tone: "orange" },
  { icon: "⌕", label: "Pending Verification", value: "84", meta: "Oldest 2d 14h", tone: "gold" },
  { icon: "⊗", label: "Unresolved Contradictions", value: "3", meta: "Critical Review", tone: "violet" },
  { icon: "☑", label: "Priority Actions", value: "11", meta: "Due Today 4", tone: "teal" },
];

const actions = [
  {
    icon: "📁",
    title: "Request Case Packet",
    body: "Assemble evidence packet for selected program or case.",
    risk: "Low",
    confidence: "92%",
    result: "More Evidence",
    requirement: "Analyst",
    tone: "green",
  },
  {
    icon: "🛡",
    title: "Escalate Provider Verification",
    body: "Route entity or program for enhanced verification.",
    risk: "Moderate",
    confidence: "87%",
    result: "Verify Entity",
    requirement: "Compliance",
    tone: "gold",
  },
  {
    icon: "🔁",
    title: "Trigger Follow-up Review",
    body: "Schedule follow-up on high-risk or high-impact findings.",
    risk: "Moderate",
    confidence: "85%",
    result: "Resolve Gaps",
    requirement: "Analyst",
    tone: "orange",
  },
  {
    icon: "📄",
    title: "Release Board Brief",
    body: "Compile executive summary for board-aligned review.",
    risk: "Low",
    confidence: "93%",
    result: "Board Aligned",
    requirement: "Executive",
    tone: "blue",
  },
];

const reports = [
  {
    icon: "⚖",
    title: "Executive Decision Brief",
    body: "Strategic summary for leadership decisions",
    status: "Ready",
    tone: "green",
  },
  {
    icon: "🏛",
    title: "Institutional Report",
    body: "Comprehensive program and impact report",
    status: "Ready",
    tone: "green",
  },
  {
    icon: "✍",
    title: "Grant Narrative",
    body: "Funder-ready narrative and outcomes",
    status: "Ready",
    tone: "green",
  },
  {
    icon: "🌐",
    title: "Public-safe Snapshot",
    body: "Redacted metrics for public distribution",
    status: "Caution",
    tone: "gold",
  },
  {
    icon: "</>",
    title: "Technical Appendix",
    body: "Methodology, data models, validation",
    status: "Caution",
    tone: "gold",
  },
  {
    icon: "+",
    title: "Custom Report",
    body: "Build a tailored report",
    status: "Build",
    tone: "muted",
  },
];

function SlimRail() {
  return (
    <aside className="utc-rail">
      <div className="utc-rail__mark">
        <img src={SHS_LOGO_SRC} alt="Silicon Heartland Solutions" />
      </div>

      <nav className="utc-rail__nav" aria-label="SHS command navigation">
        {navItems.map((item, index) => (
          <button
            key={item.label}
            className={`utc-rail__item utc-glow--${item.tone} ${index === 0 ? "is-active" : ""}`}
            type="button"
          >
            <span>{item.icon}</span>
            <small>{item.label}</small>
          </button>
        ))}
      </nav>
    </aside>
  );
}

function Header() {
  const operatorIdentity = useOperatorIdentity();

  return (
    <header className="utc-header">
      <div className="utc-header__brand">
        <h1>Silicon Heartland Solutions</h1>
        <p>Command Center</p>
      </div>

      <div className="utc-header__chips">
        {headerChips.map((chip) => (
          <article className={`utc-header-chip utc-glow--${chip.tone}`} key={chip.label}>
            <span>{chip.icon}</span>
            <div>
              <strong>{chip.label}</strong>
              <small>{chip.sub}</small>
            </div>
          </article>
        ))}
      </div>

      <div className="utc-header__controls">
        <button className="utc-publication-mode" type="button">
          <span>Publication Mode</span>
          <strong>Internal Full Fidelity⌄</strong>
        </button>

        <button className="utc-export" type="button">
          Export⌄
        </button>

        <OperatorIdentityBadge operator={operatorIdentity} />
      </div>
    </header>
  );
}

function KpiStrip() {
  return (
    <section className="utc-kpis" aria-label="SHS command KPIs">
      {kpis.map((kpi) => (
        <article className={`utc-kpi utc-glow--${kpi.tone}`} key={kpi.label}>
          <div className="utc-kpi__top">
            <span className="utc-kpi__icon">{kpi.icon}</span>
            <div className="utc-kpi__label">{kpi.label}</div>
          </div>

          <div className="utc-kpi__body">
            <div>
              <strong>{kpi.value}</strong>
              <small>{kpi.sub}</small>
            </div>
            <span className="utc-kpi__delta">{kpi.delta}</span>
          </div>

          <svg className="utc-kpi__sparkline" viewBox="0 0 96 36" aria-hidden="true">
            <polyline points="4,28 18,24 30,26 42,19 54,22 66,13 78,17 92,6" />
          </svg>
        </article>
      ))}
    </section>
  );
}

function IntakeQueue() {
  return (
    <aside className="utc-card utc-intake">
      <div className="utc-card__head">
        <h2>Operational Intake / Queue</h2>
        <button type="button">⌁</button>
      </div>

      <div className="utc-intake__list">
        {queueItems.map((item) => (
          <article className={`utc-intake__row utc-glow--${item.tone}`} key={item.label}>
            <span className="utc-intake__icon">{item.icon}</span>
            <div>
              <small>{item.label}</small>
              <strong>{item.value}</strong>
            </div>
            <em>{item.meta}</em>
          </article>
        ))}
      </div>

      <button className="utc-wide-btn" type="button">View Full Queue →</button>
    </aside>
  );
}

function OhioMap() {
  const nodes = [
    ["blue", 14, 33], ["blue", 24, 45], ["gold", 34, 38], ["blue", 49, 35],
    ["gold", 61, 50], ["blue", 72, 38], ["gold", 82, 47], ["blue", 18, 61],
    ["gold", 32, 70], ["gold", 50, 56], ["blue", 66, 66], ["blue", 76, 70],
    ["gold", 44, 82], ["blue", 58, 82], ["blue", 28, 84], ["gold", 86, 80],
  ];

  return (
    <main className="utc-card utc-map">
      <div className="utc-map__top">
        <div>
          <h2>Ohio Statewide Intelligence Map</h2>
          <p>
            <span>Impact Intensity</span>
            <b>Low</b>
            <i />
            <b>High</b>
            <span>High Impact</span>
            <span>Active Programs</span>
            <span>AI-Risk</span>
            <span>Data Gap</span>
          </p>
        </div>

        <div className="utc-map__tools">
          <button type="button">Layers⌄</button>
          <button type="button">↗</button>
        </div>
      </div>

      <div className="utc-map__canvas">
        <div className="utc-ohio-shape">
          <div className="utc-county-grid" />

          {nodes.map(([tone, x, y], index) => (
            <span
              key={index}
              className={`utc-node utc-node--${tone}`}
              style={{ left: `${x}%`, top: `${y}%` }}
            />
          ))}

          <div className="utc-franklin">
            <span />
            <strong>FRANKLIN</strong>
          </div>

          <article className="utc-county-popup">
            <button type="button">×</button>
            <h3>Franklin County</h3>
            <p>High Impact</p>

            <dl>
              <div><dt>Programs Active</dt><dd>18</dd></div>
              <div><dt>People Served</dt><dd>85,429</dd></div>
              <div><dt>Verified Outcomes</dt><dd>46,231</dd></div>
              <div><dt>Funding Deployed</dt><dd>$18.6M</dd></div>
              <div><dt>Readiness</dt><dd>High</dd></div>
              <div><dt>Risk Posture</dt><dd>Moderate</dd></div>
            </dl>

            <footer>View County Dossier →</footer>
          </article>
        </div>
      </div>
    </main>
  );
}

function OraclePanel() {
  return (
    <aside className="utc-side-stack">
      <section className="utc-card utc-oracle-panel">
        <div className="utc-panel-title utc-glow--gold">
          <span>🔮</span>
          <h2>Oracle Truth Package</h2>
          <b>91%</b>
        </div>

        <div className="utc-oracle-grid">
          <div><span>Contradictions</span><strong>3 Open</strong></div>
          <div><span>Audit Integrity</span><strong>98%</strong></div>
          <div><span>Readiness Judgment</span><strong>High</strong></div>
          <div><span>Source Coverage</span><strong>92%</strong></div>
          <div><span>Publication Safety</span><strong>High</strong></div>
          <div><span>Verification Status</span><strong>Verified</strong></div>
        </div>

        <p className="utc-oracle-copy">
          Strong source coverage with minor data gaps. Low impact contradictions are under review.
        </p>

        <button className="utc-wide-btn" type="button">View Package →</button>
      </section>

      <section className="utc-card utc-analyst-panel">
        <div className="utc-panel-title utc-glow--violet">
          <span>✦</span>
          <h2>AI Analyst Narrative</h2>
          <b>88%</b>
        </div>

        <p>
          Ohio statewide impact continues to strengthen with measurable outcomes across core service areas.
          Franklin, Cuyahoga, and Hamilton counties drive the highest verified outcomes and funding efficiency.
        </p>

        <button className="utc-panel-btn" type="button">View Full Narrative →</button>
      </section>

      <section className="utc-card utc-trust-panel">
        <div className="utc-panel-title utc-glow--blue">
          <span>🛡</span>
          <h2>Trust & Verification</h2>
          <b>91%</b>
        </div>

        <div className="utc-trust-metrics">
          <div><span>Evidence Depth</span><strong>High</strong></div>
          <div><span>Source Diversity</span><strong>High</strong></div>
          <div><span>Recency</span><strong>High</strong></div>
          <div><span>Completeness</span><strong>High</strong></div>
        </div>

        <div className="utc-verification-bar">
          <span />
        </div>
      </section>
    </aside>
  );
}

function ActionRail() {
  return (
    <section className="utc-actions">
      <div className="utc-section-title">
        <span>✦</span>
        <h2>Recommended Next Actions</h2>
        <button type="button">View All Actions →</button>
      </div>

      <div className="utc-actions__grid">
        {actions.map((action) => (
          <article className={`utc-action utc-glow--${action.tone}`} key={action.title}>
            <span className="utc-action__icon">{action.icon}</span>
            <div className="utc-action__body">
              <strong>{action.title}</strong>
              <p>{action.body}</p>
              <dl>
                <div><dt>Risk</dt><dd>{action.risk}</dd></div>
                <div><dt>Confidence</dt><dd>{action.confidence}</dd></div>
                <div><dt>Expected Result</dt><dd>{action.result}</dd></div>
                <div><dt>Requirement</dt><dd>{action.requirement}</dd></div>
              </dl>
            </div>
            <button type="button">→</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function ReportingDock() {
  return (
    <section className="utc-reporting">
      <div className="utc-section-title">
        <span>▤</span>
        <h2>Reporting Dock</h2>
      </div>

      <div className="utc-reporting__grid">
        {reports.map((report) => (
          <article className={`utc-report utc-glow--${report.tone}`} key={report.title}>
            <span>{report.icon}</span>
            <div>
              <strong>{report.title}</strong>
              <p>{report.body}</p>
            </div>
            <em>{report.status}</em>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function SHSUnifiedTruthShell() {
  return (
    <div className="utc-shell">
      <SlimRail />

      <section className="utc-workspace">
        <Header />
        <KpiStrip />

        <section className="utc-main-grid">
          <IntakeQueue />
          <OhioMap />
          <OraclePanel />
        </section>

        <ActionRail />
        <ReportingDock />
      </section>
    </div>
  );
}
