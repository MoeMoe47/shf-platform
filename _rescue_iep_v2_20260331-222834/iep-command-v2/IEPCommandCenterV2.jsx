import React from "react";
import "./iep-command-v2.css";
import OhioCountyNeutralBase from "./OhioCountyNeutralBase";
import { getCountyProfile } from "./countyProfiles";

function SectionCard({ title, children, className = "" }) {
  return (
    <section className={`v2-card ${className}`}>
      <div className="v2-card-title">{title}</div>
      <div className="v2-card-body">{children}</div>
    </section>
  );
}

function MetricTile({ label, value, tone = "" }) {
  return (
    <div className={`v2-metric-tile ${tone}`}>
      <div className="v2-metric-label">{label}</div>
      <div className="v2-metric-value">{value}</div>
    </div>
  );
}

export default function IEPCommandCenterV2() {
  const [viewMode, setViewMode] = React.useState("field");
  const [activeCountyState, setActiveCountyState] = React.useState("Franklin");

  const profile = React.useMemo(
    () => getCountyProfile(activeCountyState),
    [activeCountyState]
  );

  const primaryCase = profile.priorityCases?.[0]?.name || profile.label;
  const toneClass = profile.statusTone || "neutral";
  const actionHeadline = `${String(profile.recommendedAction || "Assign intervention").toUpperCase()} → ${String(primaryCase).toUpperCase()}`;

  const handleGenerateReport = React.useCallback(() => {
    const timestamp = new Date();
    const safeCounty = String(profile.label || activeCountyState || "county")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const payload = {
      type: "iep_county_report",
      county: profile.label,
      title: profile.title,
      subtitle: profile.subtitle,
      generatedAt: timestamp.toISOString(),
      viewMode,
      riskStatus: profile.riskStatus,
      statusTone: profile.statusTone,
      interventions: profile.interventions,
      funding: profile.funding,
      priority: profile.priority,
      confidence: profile.confidence,
      analystSummary: profile.analystSummary,
      recommendedAction: profile.recommendedAction,
      recommendedReason: profile.recommendedReason,
      statusStrip: profile.statusStrip,
      mapMetrics: profile.mapMetrics,
      systemView: profile.systemView,
      compliance: profile.compliance,
      alerts: profile.alerts,
      priorityCases: profile.priorityCases
    };

    const blob = new Blob(
      [JSON.stringify(payload, null, 2)],
      { type: "application/json;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeCounty || "county"}-report-${timestamp
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, "-")}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [activeCountyState, profile, viewMode]);

  const handleExportAnalystMemo = React.useCallback(() => {
    const timestamp = new Date();
    const safeCounty = String(profile.label || activeCountyState || "county")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const lines = [
      `SHS EXCHANGE COMMAND — ANALYST MEMO`,
      `County: ${profile.label}`,
      `Title: ${profile.title}`,
      `Generated: ${timestamp.toISOString()}`,
      ``,
      `SUMMARY`,
      `${profile.analystSummary || ""}`,
      ``,
      `RECOMMENDED ACTION`,
      `${profile.recommendedAction || ""}`,
      `Reason: ${profile.recommendedReason || ""}`,
      `Confidence: ${profile.confidence || ""}`,
      ``,
      `STATUS`,
      `Risk Status: ${profile.riskStatus || ""}`,
      `Interventions: ${profile.interventions || ""}`,
      `Funding: ${profile.funding || ""}`,
      `Priority: ${profile.priority || ""}`,
      ``,
      `SYSTEM VIEW`,
      `Students: ${profile.systemView?.students || ""}`,
      `High Risk: ${profile.systemView?.highRisk || ""}`,
      `Verified: ${profile.systemView?.verified || ""}`,
      `Funding: ${profile.systemView?.funding || ""}`,
      `Readiness: ${profile.systemView?.readiness || ""}`,
      ``,
      `ALERTS`,
      ...(profile.alerts || []).map((item) => `- ${item}`),
      ``,
      `PRIORITY CASES`,
      ...(profile.priorityCases || []).map((item) => `- ${item.name}: ${item.status}`),
      ``,
      `COMPLIANCE`,
      `Verification: ${profile.compliance?.verification || ""}`,
      `Audit: ${profile.compliance?.audit || ""}`,
      `Docs Needed: ${profile.compliance?.docs || ""}`,
      ``
    ];

    const blob = new Blob(
      [lines.join("\n")],
      { type: "text/plain;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeCounty || "county"}-analyst-memo-${timestamp
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, "-")}.txt`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [activeCountyState, profile]);

  return (
    <div className="v2-page">
      <header className="v2-topbar">
        <div className="v2-brand-block">
          <div className="v2-logo-mark" aria-hidden="true">
            <div className="v2-logo-core" />
          </div>

          <div className="v2-brand-text">
            <div className="v2-brand-title">SHS EXCHANGE COMMAND</div>
            <div className="v2-brand-subtitle">
              County Intelligence · Education Response Surface
            </div>
          </div>
        </div>

        <div className="v2-status-strip">
          <span className="v2-pill ok">{profile.statusStrip.system}</span>
          <span className={`v2-pill tone-${toneClass}`}>
            {profile.statusStrip.risk}
          </span>
          <span className="v2-pill neutral">{profile.statusStrip.verification}</span>
        </div>

        <div className="v2-context-block">
          <div className="v2-context-line">Riverside School District</div>
          <div className="v2-context-line muted">Live Snapshot · 10:45 AM</div>
        </div>
      </header>

      <main className="v2-main">
        <aside className="v2-left-rail">
          <SectionCard title="Education Lane" className="v2-lane-identity">
            <div className="v2-stack-sm">
              <div className="v2-inline-pill">IEP RESPONSE LANE</div>
              <div className="v2-muted">District: Riverside</div>
              <div className="v2-muted">Mode: County Operations</div>
            </div>
          </SectionCard>

          <SectionCard title="Program Health">
            <div className="v2-mini-grid">
              <MetricTile label="Students" value={profile.systemView.students} />
              <MetricTile label="Verified" value={profile.systemView.verified} />
              <MetricTile label="Queue" value="8" />
              <MetricTile label="Funding" value={profile.systemView.funding} />
            </div>
          </SectionCard>

          <SectionCard title="Risk Summary">
            <div className="v2-list tight">
              <div className="v2-list-row"><span>High Risk</span><span className="danger">{profile.systemView.highRisk}</span></div>
              <div className="v2-list-row"><span>Needs Attention</span><span className="caution">28</span></div>
              <div className="v2-list-row"><span>On Track</span><span className="success">288</span></div>
              <div className="v2-list-row"><span>Top Risk Type</span><span>Low Engagement</span></div>
            </div>
          </SectionCard>

          <SectionCard title="Recommended Action" className={`v2-action-card tone-card-${toneClass}`}>
            <div className="v2-action-title">{actionHeadline}</div>
            <div className="v2-action-sub">
              {profile.recommendedReason} · confidence {profile.confidence}
            </div>
            <button className="v2-primary-btn" type="button">
              EXECUTE INTERVENTION
            </button>
          </SectionCard>
        </aside>

        <section className="v2-center-stage">
          <div className="v2-center-header">
            <div className="v2-center-title">County Command Surface</div>

            <div className="v2-view-toggle">
              <button
                type="button"
                className={viewMode === "field" ? "active" : ""}
                onClick={() => setViewMode("field")}
              >
                FIELD VIEW
              </button>
              <button
                type="button"
                className={viewMode === "system" ? "active" : ""}
                onClick={() => setViewMode("system")}
              >
                SYSTEM VIEW
              </button>
            </div>
          </div>

          <div className="v2-center-chips">
            <span className="v2-chip">Selected: {profile.label}</span>
            <span className="v2-chip">Next: {profile.recommendedAction}</span>
            <span className={`v2-chip tone-${toneClass}`}>Risk: {profile.riskStatus}</span>
            <span className="v2-chip">Funding: {profile.funding}</span>
            <span className="v2-chip">Confidence: {profile.confidence}</span>
          </div>

          <div className="v2-hero-board">
            {viewMode === "field" ? (
              <div className="v2-field-view">
                <div className="v2-grid-overlay" />

                <div className="v2-map-top-metrics">
                  <div className="v2-map-metric">
                    <span className="metric-top-label">MODE</span>
                    <span className="metric-top-value">OHIO FIELD VIEW</span>
                  </div>
                  <div className="v2-map-metric">
                    <span className="metric-top-label">COUNTIES</span>
                    <span className="metric-top-value">88</span>
                  </div>
                  <div className="v2-map-metric">
                    <span className="metric-top-label">SELECTED</span>
                    <span className="metric-top-value">{profile.label}</span>
                  </div>
                  <div className="v2-map-metric">
                    <span className="metric-top-label">STATUS</span>
                    <span className={`metric-top-value tone-${toneClass}`}>{profile.mapMetrics.status}</span>
                  </div>
                </div>

                <div className="v2-map-surface">
                  <OhioCountyNeutralBase
                    activeCounty={activeCountyState}
                    onCountyClick={setActiveCountyState}
                  />
                </div>

                <div className="v2-map-legend">
                  <div className="legend-title">Legend</div>
                  <div className="legend-row"><span className="dot high" /> High Risk</div>
                  <div className="legend-row"><span className="dot warn" /> Needs Attention</div>
                  <div className="legend-row"><span className="dot ok" /> On Track</div>
                  <div className="legend-row"><span className="dot active" /> Selected County</div>
                </div>

                <div className={`v2-county-card tone-card-${toneClass}`}>
                  <div className="county-title">{profile.title}</div>
                  <div className="county-sub">{profile.subtitle}</div>

                  <div className="county-stats">
                    <div className="stat-row"><span>Risk Status</span><span>{profile.riskStatus}</span></div>
                    <div className="stat-row"><span>Interventions</span><span>{profile.interventions}</span></div>
                    <div className="stat-row"><span>Funding</span><span>{profile.funding}</span></div>
                    <div className="stat-row"><span>Priority</span><span>{profile.priority}</span></div>
                  </div>

                  <button className="v2-primary-btn" type="button">
                    OPEN COUNTY DETAIL
                  </button>
                </div>
              </div>
            ) : (
              <div className="v2-system-view">
                <div className="v2-grid-overlay" />

                <div className="v2-system-kpis">
                  <MetricTile label="Students" value={profile.systemView.students} />
                  <MetricTile label="High Risk" value={profile.systemView.highRisk} />
                  <MetricTile label="Verified" value={profile.systemView.verified} />
                  <MetricTile label="Funding" value={profile.systemView.funding} />
                </div>

                <div className="v2-system-network">
                  <div className="sys-node a" />
                  <div className="sys-node b" />
                  <div className="sys-node c" />
                  <div className="sys-node d" />
                  <div className="sys-node e" />
                  <div className="sys-line l1" />
                  <div className="sys-line l2" />
                  <div className="sys-line l3" />
                </div>

                <div className={`v2-system-panel sys-p1 tone-panel-${toneClass}`}>{profile.systemView.p1}</div>
                <div className={`v2-system-panel sys-p2 tone-panel-${toneClass}`}>{profile.systemView.p2}</div>
                <div className={`v2-system-panel sys-p3 tone-panel-${toneClass}`}>{profile.systemView.p3}</div>
                <div className={`v2-system-panel sys-p4 tone-panel-${toneClass}`}>{profile.systemView.p4}</div>

                <div className={`v2-readiness-ring tone-ring-${toneClass}`}>
                  <div className="v2-readiness-inner">
                    <div className="score">{profile.systemView.readiness}</div>
                    <div className="label">READINESS</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="v2-right-rail">
          <SectionCard title="AI Analyst" className="v2-analyst-card">
            <div className="v2-analyst-text">
              {profile.analystSummary}
            </div>
            <div className="v2-analyst-actions">
              <button className="v2-secondary-btn" type="button">EXPLAIN</button>
              <button className="v2-secondary-btn" type="button">CASE DETAIL</button>
            </div>
          </SectionCard>

          <SectionCard title="Priority Cases">
            <div className="v2-list">
              {profile.priorityCases.map((item, idx) => (
                <div className="v2-list-row" key={`${item.name}-${idx}`}>
                  <span>{item.name}</span>
                  <span>{item.status}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Active Alerts">
            <div className="v2-list">
              {profile.alerts.map((alert, idx) => (
                <div className="v2-list-row" key={`${alert}-${idx}`}>
                  <span>{alert}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Compliance & Verification">
            <div className="v2-list">
              <div className="v2-list-row"><span>Verification</span><span>{profile.compliance.verification}</span></div>
              <div className="v2-list-row"><span>Audit Status</span><span>{profile.compliance.audit}</span></div>
              <div className="v2-list-row"><span>Docs Needed</span><span>{profile.compliance.docs}</span></div>
            </div>
          </SectionCard>
        </aside>
      </main>

      <section className="v2-bottom-band">
        <SectionCard title="Intervention Queue" className="v2-bottom-card">
          <div className="v2-bottom-metric">8</div>
          <div className="v2-card-sublabel">Pending Actions</div>
        </SectionCard>

        <SectionCard title="Outcome Pipeline" className="v2-bottom-card">
          <div className="v2-bottom-metric success">{profile.systemView.verified}</div>
          <div className="v2-card-sublabel">Verified Improvements</div>
        </SectionCard>

        <SectionCard title="Funding Pipeline" className="v2-bottom-card">
          <div className="v2-bottom-metric">{profile.systemView.funding}</div>
          <div className="v2-card-sublabel">Projected IDEA Funding</div>
        </SectionCard>

        <SectionCard title="Export Actions" className="v2-bottom-card">
          <button className="v2-primary-btn" type="button" onClick={handleGenerateReport}>
            GENERATE REPORT
          </button>
        </SectionCard>
      </section>
    </div>
  );
}
