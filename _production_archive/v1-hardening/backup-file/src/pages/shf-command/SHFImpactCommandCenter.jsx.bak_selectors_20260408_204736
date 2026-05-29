import React, { useMemo, useState } from "react";
import "./shf-impact-command-center.css";
import TourProvider from "@/system/tour/TourProvider";

const KPIS = [
  { key: "people", label: "People Served", value: "12,482", delta: "+ 8.2%", sublabel: "Last 30 Days" },
  { key: "programs", label: "Programs Active", value: "18", delta: "+ 1", sublabel: "System Wide" },
  { key: "verified", label: "Verified Outcomes", value: "8,217", delta: "+ 6.4%", sublabel: "Last 30 Days" },
  { key: "funding", label: "Funding Deployed", value: "$29.5M", delta: "+ $1.2M", sublabel: "Last 30 Days" },
  { key: "risk", label: "Risk Alerts", value: "3", delta: "", sublabel: "Priority Watchlist" },
  { key: "readiness", label: "Grant Readiness", value: "91%", delta: "Readiness", sublabel: "Institutional Score" },
];

const COUNTIES = [
  { id: "franklin", name: "Franklin County", x: 58, y: 33, shade: "high", programs: 5, people: "3,824", funding: "$4.5M", topOutcome: "82%", risk: "Stable" },
  { id: "cuyahoga", name: "Cuyahoga County", x: 66, y: 18, shade: "high", programs: 4, people: "2,406", funding: "$3.2M", topOutcome: "79%", risk: "Watch" },
  { id: "hamilton", name: "Hamilton County", x: 34, y: 66, shade: "mid", programs: 3, people: "1,955", funding: "$2.1M", topOutcome: "74%", risk: "Stable" },
  { id: "summit", name: "Summit County", x: 63, y: 28, shade: "mid", programs: 2, people: "1,240", funding: "$1.4M", topOutcome: "71%", risk: "Opportunity" },
  { id: "montgomery", name: "Montgomery County", x: 40, y: 52, shade: "mid", programs: 2, people: "1,112", funding: "$1.1M", topOutcome: "69%", risk: "Stable" },
  { id: "lucas", name: "Lucas County", x: 52, y: 8, shade: "mid", programs: 2, people: "913", funding: "$940K", topOutcome: "67%", risk: "Stable" },
  { id: "delaware", name: "Delaware County", x: 58, y: 27, shade: "low", programs: 1, people: "622", funding: "$610K", topOutcome: "73%", risk: "Stable" },
  { id: "licking", name: "Licking County", x: 65, y: 37, shade: "low", programs: 1, people: "508", funding: "$525K", topOutcome: "66%", risk: "Watch" },
];

const PROGRAMS = [
  {
    id: "career-launchpad",
    name: "Career Launchpad",
    status: "Expanding",
    locations: 20,
    funding: "$5.45M",
    trend: "+4.6M",
    risk: "Low",
    served: "5,450",
    note: "Strong placement momentum and high grant narrative value.",
  },
  {
    id: "recovery-housing",
    name: "Recovery Housing Pilot",
    status: "Intervene",
    locations: 8,
    funding: "$1,208",
    trend: "+3.8M",
    risk: "Elevated",
    served: "1,280",
    note: "Retention dip requires operator review and client-flow analysis.",
  },
  {
    id: "barber-pathway",
    name: "Barber Licensure Pathway",
    status: "In Progress",
    locations: 12,
    funding: "$1,434",
    trend: "+5.3M",
    risk: "Moderate",
    served: "980",
    note: "Healthy demand and certification path appeal.",
  },
  {
    id: "autism-awareness",
    name: "Autism Awareness Initiative",
    status: "Growing",
    locations: 9,
    funding: "$338",
    trend: "+2.6M",
    risk: "Low",
    served: "742",
    note: "Strong public narrative value and sponsor alignment potential.",
  },
];

const ACTIONS = [
  "Expand Career Launchpad to Summit County",
  "Intervene at the Columbus Recovery Housing site due to declining client retention rates.",
  "Prepare grant summary for Autism Awareness Initiative.",
  "Verify missing placement reports submitted by one workforce network.",
  "Generate donor brief for Barber Licensure Pathway program.",
];

const TRUST_ITEMS = [
  { key: "coverage", label: "Reporting Coverage", value: "92%" },
  { key: "audit", label: "Audit Integrity", value: "PASS" },
  { key: "ledger", label: "Ledger Sync", value: "ACTIVE" },
  { key: "missing", label: "Missing Reports", value: "2" },
  { key: "memo", label: "Program Health Memo", value: "READY" },
];

const EXPORT_ITEMS = [
  { label: "Board Brief", value: "92%" },
  { label: "Grant Narrative", value: "PASS" },
  { label: "Donor Summary", value: "ACTIVE" },
  { label: "Public Impact Snapshot", value: "" },
  { label: "Program Health Memo", value: "" },
];

const WHEEL_SEGMENTS = [
  { label: "Outcome Verification", value: "18%", tone: "seg-1" },
  { label: "Funding", value: "17%", tone: "seg-2" },
  { label: "Funding", value: "17%", tone: "seg-3" },
  { label: "Funding", value: "10%", tone: "seg-4" },
  { label: "Community Impact", value: "9%", tone: "seg-5" },
  { label: "Community Impact", value: "9%", tone: "seg-6" },
  { label: "Community Impact", value: "10%", tone: "seg-7" },
  { label: "Funding Engine", value: "11%", tone: "seg-8" },
  { label: "Reporting", value: "10%", tone: "seg-9" },
  { label: "Governance", value: "10%", tone: "seg-10" },
  { label: "Outcome Verification", value: "14%", tone: "seg-11" },
];

function DetailDrawer({ selected, onClose }) {
  if (!selected) return null;

  return (
    <TourProvider>
<div className="shf-drawer-backdrop" onClick={onClose}>
      <aside className="shf-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="shf-drawer__header">
          <div>
            <div className="shf-eyebrow">Command Detail</div>
            <h3>{selected.title}</h3>
          </div>
          <button className="shf-icon-btn" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <div className="shf-drawer__body">
          <div className="shf-drawer-card">
            <div className="shf-drawer-card__label">Summary</div>
            <p>{selected.summary}</p>
          </div>

          {selected.metrics?.length ? (
            <div className="shf-drawer-card">
              <div className="shf-drawer-card__label">Key Metrics</div>
              <div className="shf-drawer-metrics">
                {selected.metrics.map((item) => (
                  <div key={item.label} className="shf-drawer-metric">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {selected.actions?.length ? (
            <div className="shf-drawer-card">
              <div className="shf-drawer-card__label">Recommended Actions</div>
              <ul className="shf-drawer-list">
                {selected.actions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="shf-drawer-card">
            <div className="shf-drawer-card__label">Why It Matters</div>
            <p>{selected.reason}</p>
          </div>
        </div>
      </aside>
    </div>
    </TourProvider>
  );
}

export default function SHFImpactCommandCenter() {
  const [selectedCounty, setSelectedCounty] = useState(COUNTIES[0]);
  const [selected, setSelected] = useState(null);

  const trendPoints = useMemo(
    () => [8, 12, 10, 14, 18, 16, 20, 24, 22, 28, 26, 30, 34, 33, 38, 42],
    []
  );

  const openDrawer = (title, summary, metrics = [], actions = [], reason = "") => {
    setSelected({ title, summary, metrics, actions, reason });
  };

  const onKpiClick = (kpi) => {
    openDrawer(
      kpi.label,
      `${kpi.label} is being tracked at the institutional layer for SHF command visibility.`,
      [
        { label: "Current Value", value: kpi.value },
        { label: "Change", value: kpi.delta || "—" },
        { label: "Reporting Window", value: kpi.sublabel },
      ],
      ["Open metric history", "Review county contributors", "Generate briefing note"],
      "This metric influences leadership visibility, operational prioritization, and report readiness."
    );
  };

  const onCountyClick = (county) => {
    setSelectedCounty(county);
    openDrawer(
      county.name,
      `${county.name} is one of the active SHF command regions with measurable program and funding activity.`,
      [
        { label: "Programs Active", value: String(county.programs) },
        { label: "People Served", value: county.people },
        { label: "Funding Deployed", value: county.funding },
        { label: "Top Outcome", value: county.topOutcome },
        { label: "Risk Signal", value: county.risk },
      ],
      ["Open county profile", "Review site operators", "Generate county brief"],
      "County drilldowns help leadership see where to expand, intervene, verify, or report."
    );
  };

  const onProgramClick = (program) => {
    openDrawer(
      program.name,
      program.note,
      [
        { label: "Status", value: program.status },
        { label: "Locations", value: String(program.locations) },
        { label: "Funding", value: program.funding },
        { label: "Trend", value: program.trend },
        { label: "Risk", value: program.risk },
        { label: "Served", value: program.served },
      ],
      ["Open program command view", "Generate donor brief", "Review reporting completeness"],
      "Program health drives expansion, intervention, and funding narrative quality."
    );
  };

  const onTrustClick = (item) => {
    openDrawer(
      item.label,
      `${item.label} is part of the SHF proof and trust layer.`,
      [
        { label: "Status", value: item.value },
        { label: "Last Refresh", value: "Today" },
      ],
      ["Open verification detail", "Review exceptions", "Generate trust memo"],
      "This layer separates SHF from ordinary dashboards by proving integrity, not just claiming it."
    );
  };

  const onExportClick = (item) => {
    openDrawer(
      item.label,
      `${item.label} can be generated from the command center export system.`,
      [
        { label: "Status", value: item.value || "Available" },
        { label: "Format", value: item.label.includes("Snapshot") ? "PDF / Share" : "PDF" },
      ],
      ["Generate now", "Preview content", "Send to leadership"],
      "Exports turn command-center intelligence into board, donor, and grant-ready materials."
    );
  };

  return (
    <div className="shf-page">
      <div className="shf-shell">
        <header className="shf-topbar">
          <div className="shf-brand">
            <div className="shf-brand__mark">
              <span className="shf-brand__mark-top" />
              <span className="shf-brand__mark-bottom" />
            </div>
            <div className="shf-brand__text">Silicon Heartland</div>
            <div className="shf-brand__divider" />
            <h1>SHF Impact Command Center</h1>
          </div>

          <div className="shf-topbar__controls">
            <select className="shf-select" defaultValue="reporting">
              <option value="reporting">Reporting Period</option>
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
              <option>Last 12 Months</option>
            </select>

            <select className="shf-select" defaultValue="ohio">
              <option value="ohio">Ohio : Statewide</option>
              <option>Franklin County</option>
              <option>Cuyahoga County</option>
              <option>Hamilton County</option>
            </select>

            <button
              className="shf-export-btn"
              type="button"
              onClick={() =>
                openDrawer(
                  "Export Report",
                  "Generate executive, donor, grant, and public-facing report outputs from this command surface.",
                  [
                    { label: "Exports Ready", value: "5" },
                    { label: "PDF Engine", value: "Connected" },
                  ],
                  ["Generate Executive Brief", "Generate Donor Summary", "Generate Grant Narrative"],
                  "This is where command-center insight becomes a real funding and reporting asset."
                )
              }
            >
              Export Report
            </button>
          </div>
        </header>

        <section className="shf-kpi-row">
          {KPIS.map((kpi) => (
            <button
              key={kpi.key}
              className={`shf-kpi-card shf-kpi-card--${kpi.key}`}
              onClick={() => onKpiClick(kpi)}
              type="button"
            >
              <div className="shf-kpi-card__label">{kpi.label}</div>
              <div className="shf-kpi-card__value-row">
                <strong>{kpi.value}</strong>
                {kpi.delta ? <span>{kpi.delta}</span> : null}
              </div>
              <div className="shf-kpi-card__sub">{kpi.sublabel}</div>
              <div className="shf-kpi-card__ghost" />
            </button>
          ))}
        </section>

        <main className="shf-main-grid">
          <section className="shf-left-col">
            <div className="shf-panel shf-map-panel">
              <div className="shf-panel__header">
                <h2>Ohio Impact</h2>
                <button
                  type="button"
                  className="shf-mini-filter"
                  onClick={() =>
                    openDrawer(
                      "Ohio Impact Map",
                      "The Ohio impact map shows where SHF activity, funding, and outcomes are concentrated.",
                      [
                        { label: "Active Counties", value: "18" },
                        { label: "Hot Counties", value: "4" },
                        { label: "Priority Interventions", value: "3" },
                      ],
                      ["Open statewide view", "Filter by program", "Open county overlays"],
                      "Geographic command surfaces help leadership see distribution, opportunity, and risk."
                    )
                  }
                >
                  TODO AM
                </button>
              </div>

              <div className="shf-map-stage">
                <div className="shf-map-toolbar">
                  <button type="button">＋</button>
                  <button type="button">－</button>
                </div>

                <div className="shf-map-canvas">
                  <div className="shf-map-state">
                    <div className="shf-map-state__lake" />
                    {COUNTIES.map((county) => (
                      <button
                        key={county.id}
                        type="button"
                        className={`shf-county shf-county--${county.shade} ${selectedCounty.id === county.id ? "is-selected" : ""}`}
                        style={{ left: `${county.x}%`, top: `${county.y}%` }}
                        onClick={() => onCountyClick(county)}
                        title={county.name}
                      >
                        <span className="shf-county__dot" />
                      </button>
                    ))}
                  </div>

                  <div className="shf-map-card">
                    <div className="shf-map-card__title-row">
                      <strong>{selectedCounty.name}</strong>
                      <span>⌁</span>
                    </div>
                    <div className="shf-map-card__grid">
                      <span>Programs Active:</span>
                      <strong>{selectedCounty.programs}</strong>

                      <span>People Served:</span>
                      <strong>{selectedCounty.people}</strong>

                      <span>Funding Deployed:</span>
                      <strong>{selectedCounty.funding}</strong>

                      <span>Top Outcome:</span>
                      <strong>{selectedCounty.topOutcome}</strong>

                      <span>Risk Signal:</span>
                      <strong>{selectedCounty.risk}</strong>
                    </div>
                  </div>
                </div>

                <div className="shf-map-footer">
                  <span>ZOOMIN</span>
                </div>
              </div>
            </div>

            <div className="shf-panel shf-program-table-panel">
              <div className="shf-panel__header">
                <h2>Program Health</h2>
                <div className="shf-table-filters">
                  <button type="button" className="shf-mini-filter">STAGE</button>
                  <button type="button" className="shf-mini-filter">LOCATIONS</button>
                  <button type="button" className="shf-mini-filter">FUNDING</button>
                </div>
              </div>

              <div className="shf-program-table">
                {PROGRAMS.map((program) => (
                  <button
                    key={program.id}
                    type="button"
                    className="shf-program-row"
                    onClick={() => onProgramClick(program)}
                  >
                    <div className="shf-program-row__name">
                      <strong>{program.name}</strong>
                      <span>{program.served} served</span>
                    </div>

                    <div className={`shf-status-pill shf-status-pill--${program.status.toLowerCase().replace(/\s+/g, "-")}`}>
                      {program.status}
                    </div>

                    <div className="shf-program-row__metric">
                      <span>Locations</span>
                      <strong>{program.locations}</strong>
                    </div>

                    <div className="shf-program-row__metric">
                      <span>Funding</span>
                      <strong>{program.funding}</strong>
                    </div>

                    <div className="shf-program-row__metric">
                      <span>Trend</span>
                      <strong>{program.trend}</strong>
                    </div>

                    <div className="shf-program-row__metric shf-program-row__metric--risk">
                      <span>Risk Level</span>
                      <strong>{program.risk}</strong>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="shf-middle-col">
            <div className="shf-panel">
              <div className="shf-panel__header">
                <h2>Impact Overview</h2>
              </div>

              <div className="shf-wheel-card">
                <button
                  type="button"
                  className="shf-wheel"
                  onClick={() =>
                    openDrawer(
                      "Impact Overview Wheel",
                      "The outcome wheel visualizes the SHF operating balance across verification, funding, reporting, governance, and community impact.",
                      WHEEL_SEGMENTS.map((seg) => ({ label: seg.label, value: seg.value })),
                      ["Open segment breakdown", "Compare weighting model", "Generate strategic summary"],
                      "This signature visual helps leadership understand how the institutional ecosystem is weighted and performing."
                    )
                  }
                >
                  <div className="shf-wheel__outer">
                    {WHEEL_SEGMENTS.map((seg, idx) => (
                      <div
                        key={`${seg.label}-${idx}`}
                        className={`shf-wheel-segment ${seg.tone}`}
                        style={{ "--segment-index": idx }}
                      >
                        <span>{seg.value}</span>
                      </div>
                    ))}
                    <div className="shf-wheel__center">
                      <div className="shf-wheel__center-globe" />
                      <strong>Silicon Heartland</strong>
                      <span>INSTITUTIONAL ECOSYSTEM</span>
                    </div>
                  </div>
                </button>
              </div>

              <div className="shf-trend-block">
                <div className="shf-trend-block__header">
                  <h3>Outcome Trends</h3>
                  <span>Last 12 Months</span>
                </div>
                <div className="shf-trend-block__value-row">
                  <strong>12,482</strong>
                  <span>+ 8.2% ↑</span>
                </div>
                <svg viewBox="0 0 320 80" className="shf-trend-svg" aria-hidden="true">
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    points={trendPoints.map((p, i) => `${10 + i * 19},${70 - p}`).join(" ")}
                  />
                </svg>
              </div>
            </div>

            <div className="shf-panel">
              <div className="shf-panel__header">
                <h2>Program Health</h2>
                <span className="shf-panel__small-label">Last 12 Months</span>
              </div>
              <div className="shf-export-list">
                {EXPORT_ITEMS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className="shf-export-row"
                    onClick={() => onExportClick(item)}
                  >
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <aside className="shf-right-col">
            <div className="shf-panel shf-analyst-panel">
              <div className="shf-panel__header">
                <h2>AI Analyst</h2>
                <span className="shf-bulb">💡</span>
              </div>

              <div className="shf-analyst-panel__section-title">Upcoming Actions</div>
              <ul className="shf-action-list">
                {ACTIONS.map((action) => (
                  <li key={action}>
                    <button
                      type="button"
                      onClick={() =>
                        openDrawer(
                          "AI Recommended Action",
                          action,
                          [
                            { label: "Priority", value: "High" },
                            { label: "Confidence", value: "87%" },
                          ],
                          ["Open affected record", "Generate memo", "Assign review"],
                          "The analyst layer explains what changed, why it matters, and what should happen next."
                        )
                      }
                    >
                      {action}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="shf-panel shf-trust-panel">
              <div className="shf-panel__header">
                <h2>Trust &amp; Verification</h2>
              </div>

              <div className="shf-trust-list">
                {TRUST_ITEMS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className="shf-trust-row"
                    onClick={() => onTrustClick(item)}
                  >
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </main>
      </div>

      <DetailDrawer selected={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
