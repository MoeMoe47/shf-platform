import React from "react";
import "./iep-command.css";

function money(value) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value || 0);
  } catch {
    return `$${value || 0}`;
  }
}

function getEducationSystem() {
  const system = window.__SHS_EDU__ || {};
  const summary = system.summary || {
    totalStudents: 0,
    highRiskCount: 0,
    needsAttentionCount: 0,
    onTrackCount: 0,
    verifiedImprovementCount: 0,
    projectedFunding: 0,
  };

  const riskEvents = system.riskEvents || [];
  const funding = system.fundingSnapshot || {
    eligibleStudents: 0,
    projectedIDEAFunding: 0,
    verificationStatus: "none",
    readinessScore: 0,
  };

  return { summary, riskEvents, funding };
}

function buildPriorityCases(riskEvents = []) {
  return riskEvents.slice(0, 3).map((event) => ({
    id: event.id,
    name: event.studentName,
    status:
      event.severity === "high"
        ? "High Risk"
        : event.severity === "medium"
        ? "Needs Attention"
        : "Monitoring",
    reason: event.type,
    action: event.recommendedAction,
    confidence: Math.round((event.confidence || 0) * 100),
  }));
}

function topRiskLabel(riskEvents = []) {
  if (!riskEvents.length) return "No active risk";
  return riskEvents[0].type.replace(/_/g, " ");
}

export default function IEPCommandCenter() {
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    const id = window.setInterval(() => setTick((v) => v + 1), 1500);
    return () => window.clearInterval(id);
  }, []);

  const { summary, riskEvents, funding } = getEducationSystem();
  const priorityCases = buildPriorityCases(riskEvents);
  const topRisk = riskEvents[0] || null;

  const unresolvedAlerts = riskEvents.length;
  const interventionQueue = riskEvents.filter(
    (r) => String(r.recommendedAction || "").trim().length > 0
  ).length;

  const analystText = topRisk
    ? `${topRisk.studentName} requires intervention due to ${String(topRisk.type || "").replace(/_/g, " ")}. Recommended action: ${topRisk.recommendedAction}.`
    : "No active student risk event detected. System is stable and monitoring continues.";

  return (
    <div className="edu-command-page">

      <header className="edu-command-topbar">
        <div className="topbar-left">
          <span className="brand">SHS</span>
          <span className="crumb">/ Education / IEP System</span>
        </div>

        <div className="topbar-center">
          <span className="pill green">System Active</span>
          <span className="pill orange">
            {summary.highRiskCount || 0} High Risk Case{summary.highRiskCount === 1 ? "" : "s"}
          </span>
          <span className="pill neutral">
            Verification: {funding.verificationStatus || "none"}
          </span>
        </div>

        <div className="topbar-right">
          <span className="district">Riverside School District</span>
          <span className="timestamp">Live snapshot</span>
        </div>
      </header>

      <main className="edu-command-main">

        <aside className="edu-command-left">
          <section className="card lane-card lane-identity">
            <div className="card-title">Education Lane</div>
            <div className="lane-pill">IEP System Active</div>
            <div className="muted">Riverside School District</div>
          </section>

          <section className="card lane-card">
            <div className="card-title">System Overview</div>
            <div className="metric-list">
              <div className="metric-row">
                <span className="metric-value">{summary.totalStudents || 0}</span>
                <span className="metric-label">Active Students</span>
              </div>
              <div className="metric-row">
                <span className="metric-value">{summary.verifiedImprovementCount || 0}</span>
                <span className="metric-label">Verified Improvements</span>
              </div>
              <div className="metric-row">
                <span className="metric-value">{unresolvedAlerts}</span>
                <span className="metric-label">Alerts Unresolved</span>
              </div>
              <div className="metric-row">
                <span className="metric-value">{interventionQueue}</span>
                <span className="metric-label">In Intervention Queue</span>
              </div>
            </div>
          </section>

          <section className="card lane-card">
            <div className="card-title">Risk Summary</div>
            <div className="metric-list">
              <div className="metric-row">
                <span className="metric-value high">{summary.highRiskCount || 0}</span>
                <span className="metric-label">High Risk</span>
              </div>
              <div className="metric-row">
                <span className="metric-value warn">{summary.needsAttentionCount || 0}</span>
                <span className="metric-label">Needs Attention</span>
              </div>
              <div className="metric-row">
                <span className="metric-value ok">{summary.onTrackCount || 0}</span>
                <span className="metric-label">On Track</span>
              </div>
              <div className="metric-row compact">
                <span className="metric-small-label">Top Risk Type</span>
                <span className="metric-small-value">{topRiskLabel(riskEvents)}</span>
              </div>
            </div>
          </section>

          <section className="card lane-card action-card">
            <div className="card-title accent">Recommended Action</div>
            <div className="action-head">
              {topRisk ? `Assign intervention to ${topRisk.studentName}` : "No intervention needed"}
            </div>
            <div className="action-sub">
              {topRisk
                ? `${String(topRisk.type || "").replace(/_/g, " ")} · confidence ${Math.round((topRisk.confidence || 0) * 100)}%`
                : "System stable"}
            </div>
            <button className="action-btn" type="button">
              Execute Intervention
            </button>
          </section>
        </aside>

        <section className="edu-command-center">
          <div className="center-header">
            <div className="center-title">Education System Status</div>
          </div>

          <div className="center-chips">
            <span className="chip">Next: {topRisk?.recommendedAction || "Monitor system"}</span>
            <span className="chip">Risk: {summary.highRiskCount > 0 ? "High" : "Low"}</span>
            <span className="chip">Verification: {funding.verificationStatus || "none"}</span>
            <span className="chip">Funding: {funding.readinessScore >= 70 ? "Ready" : "Building"}</span>
            <span className="chip">Confidence: {topRisk ? `${Math.round((topRisk.confidence || 0) * 100)}%` : "100%"}</span>
          </div>

          <div className="center-board">
            <div className="surface-grid"></div>

            <div className="surface-node node node-a"></div>
            <div className="surface-node node node-b"></div>
            <div className="surface-node node node-c"></div>
            <div className="surface-node node node-d"></div>
            <div className="surface-node node node-e"></div>
            <div className="surface-node node node-f"></div>
            <div className="surface-node node node-g"></div>

            <div className="surface-label label-incoming">Incoming Students</div>
            <div className="surface-label label-interventions">Active Interventions</div>
            <div className="surface-label label-verified">Verified Outcomes</div>
            <div className="surface-label label-funding">Funding Pathway</div>

            <div className="surface-rail rail-1"></div>
            <div className="surface-rail rail-2"></div>
            <div className="surface-rail rail-3"></div>

            <div className="surface-kpi kpi-students">
              <div className="surface-kpi-title">Students</div>
              <div className="surface-kpi-value">{summary.totalStudents || 0}</div>
            </div>

            <div className="surface-kpi kpi-risk">
              <div className="surface-kpi-title">High Risk</div>
              <div className="surface-kpi-value">{summary.highRiskCount || 0}</div>
            </div>

            <div className="surface-kpi kpi-verified">
              <div className="surface-kpi-title">Verified</div>
              <div className="surface-kpi-value">{summary.verifiedImprovementCount || 0}</div>
            </div>

            <div className="surface-kpi kpi-funding">
              <div className="surface-kpi-title">Funding</div>
              <div className="surface-kpi-value">{money(funding.projectedIDEAFunding || summary.projectedFunding || 0)}</div>
            </div>

            <div className="surface-ring">
              <div className="surface-ring-inner">
                <div className="ring-score">{funding.readinessScore || 0}</div>
                <div className="ring-label">Readiness</div>
              </div>
            </div>
          </div>
        </section>

        <aside className="edu-command-right">
          <section className="card intel-card analyst-card">
            <div className="card-title">AI Analyst</div>
            <div className="analyst-text">{analystText}</div>
            <div className="analyst-actions">
              <button type="button" className="ghost-btn">Explain</button>
              <button type="button" className="ghost-btn">Case Details</button>
            </div>
          </section>

          <section className="card intel-card">
            <div className="card-title">Priority Cases</div>
            <div className="case-list">
              {priorityCases.length ? (
                priorityCases.map((item) => (
                  <div className="case-row" key={item.id}>
                    <div className="case-name">{item.name}</div>
                    <div className="case-meta">{item.status}</div>
                  </div>
                ))
              ) : (
                <div className="empty-state">No active cases</div>
              )}
            </div>
          </section>

          <section className="card intel-card">
            <div className="card-title">Active Alerts</div>
            <div className="alert-list">
              {riskEvents.length ? (
                riskEvents.map((item) => (
                  <div className="alert-row" key={item.id}>
                    <span className={`alert-dot ${item.severity === "high" ? "high" : item.severity === "medium" ? "warn" : "ok"}`}></span>
                    <span>{String(item.type || "").replace(/_/g, " ")}</span>
                  </div>
                ))
              ) : (
                <div className="empty-state">No live alerts</div>
              )}
            </div>
          </section>

          <section className="card intel-card">
            <div className="card-title">Compliance & Verification</div>
            <div className="compliance-list">
              <div className="compliance-row">
                <span>Verification</span>
                <span>{funding.verificationStatus || "none"}</span>
              </div>
              <div className="compliance-row">
                <span>Audit Status</span>
                <span>{riskEvents.length ? "Pending" : "Clear"}</span>
              </div>
              <div className="compliance-row">
                <span>Docs Needed</span>
                <span>{riskEvents.length ? "1 Missing Report" : "Complete"}</span>
              </div>
            </div>
          </section>
        </aside>

      </main>

      <section className="edu-command-bottom">
        <div className="card bottom-card">
          <div className="card-title">Intervention Queue</div>
          <div className="bottom-metric">{interventionQueue}</div>
          <div className="bottom-label">Pending Actions</div>
        </div>

        <div className="card bottom-card">
          <div className="card-title">Outcome Pipeline</div>
          <div className="bottom-metric ok">{summary.verifiedImprovementCount || 0}</div>
          <div className="bottom-label">Verified Improvements</div>
        </div>

        <div className="card bottom-card">
          <div className="card-title">Funding Pipeline</div>
          <div className="bottom-metric">{money(funding.projectedIDEAFunding || summary.projectedFunding || 0)}</div>
          <div className="bottom-label">{funding.readinessScore >= 70 ? "Pending Approval" : "Building Readiness"}</div>
        </div>

        <div className="card bottom-card">
          <div className="card-title">Export Actions</div>
          <button type="button" className="export-btn">Generate Report</button>
        </div>
      </section>
    </div>
  );
}
