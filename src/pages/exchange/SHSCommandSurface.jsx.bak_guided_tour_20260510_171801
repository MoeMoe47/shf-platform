import React, { useMemo } from "react";
import "./command-surface/shs-command-surface.css";
import RecommendationStrip from "./command-center/RecommendationStrip";
import DecisionActionBar from "./command-center/DecisionActionBar";
import TacticalMapStage from "./map-stage/TacticalMapStage";
import AnalystPredictionCard from "./AnalystPredictionCard";
import PredictionLayerPanel from "./PredictionLayerPanel";
import CommandCenterReportActions from "./CommandCenterReportActions";
import SHSCommandHeader from "./components/SHSCommandHeader";

function Panel({ title, children, className = "" }) {
  return (
    <section className={`mock-panel ${className}`.trim()}>
      <div className="mock-panel__title">{title}</div>
      <div className="mock-panel__body">{children}</div>
    </section>
  );
}

function BulletList({ items = [] }) {
  return (
    <div className="mock-list">
      {items.map((item, i) => (
        <div key={`${item}-${i}`} className="mock-list__row">
          <span className="mock-list__dot" />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

function KpiCard({ label, value, sub }) {
  return (
    <div
      style={{
        border: "1px solid rgba(104, 139, 191, 0.18)",
        borderRadius: 10,
        background: "rgba(10, 21, 36, 0.86)",
        padding: "12px 14px",
        minHeight: 92,
      }}
    >
      <div
        style={{
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "rgba(214, 226, 245, 0.74)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 28,
          fontWeight: 900,
          lineHeight: 1,
          color: "#eef4ff",
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 12,
          color: "rgba(214, 226, 245, 0.74)",
        }}
      >
        {sub}
      </div>
    </div>
  );
}

function HeaderChip({ tone = "blue", title, value, sub }) {
  return (
    <div className={`utc-chip utc-chip--${tone}`}>
      <div className="utc-chip__top">
        <span className="utc-chip__dot" />
        <span className="utc-chip__title">{title}</span>
        {value ? <span className="utc-chip__value">{value}</span> : null}
      </div>
      <div className="utc-chip__sub">{sub}</div>
    </div>
  );
}

function reportNoop(label) {
  return () => {
    console.log(`${label} clicked`);
  };
}

export default function SHSCommandSurface({
  loading,
  error,
  onRefresh,
  activeCase,
  activeAction,
  setActiveAction,
  selectedPanel,
  recommendation,
  agentAudience,
  agentContext,
  prediction,
  narrative,
  changeSummary,
}) {
  const confidencePct = Math.round((recommendation?.confidence ?? 0) * 100);

  const timeLabel = useMemo(() => {
    try {
      return new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "10:42 AM";
    }
  }, []);

  return (
    <div className="mock-shell mock-shell--tone-blue">
      <div className="mock-ambient" aria-hidden="true">
        <div className="mock-ambient__drift" />
        <div className="mock-ambient__grid" />
        <div className="mock-ambient__flow" />
        <div className="mock-ambient__pulse" />
      </div>

      <SHSCommandHeader />

      <section
        style={{
          marginTop: 10,
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
          gap: 10,
        }}
      >
        <KpiCard label="Entities Under Watch" value="18" sub="System-wide monitoring" />
        <KpiCard label="Verified Outcomes" value="8,217" sub="Evidence-backed" />
        <KpiCard label="Open Contradictions" value="3" sub="Needs review" />
        <KpiCard label="Trust Coverage" value="91%" sub="Verification-weighted" />
        <KpiCard label="Recommendation Confidence" value={`${confidencePct}%`} sub="Current active case" />
      </section>

      <section
        style={{
          marginTop: 10,
          border: "1px solid rgba(104, 139, 191, 0.18)",
          borderRadius: 10,
          background: "rgba(7,16,27,0.9)",
          padding: "14px 16px",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 220px",
          gap: 14,
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: "rgba(214, 226, 245, 0.74)",
              fontWeight: 900,
            }}
          >
            Live Situation
          </div>
          <div style={{ marginTop: 6, fontSize: 28, fontWeight: 900 }}>
            {activeCase?.label || "Active Case"} • Unified Truth Review
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: "rgba(229,236,249,0.9)" }}>
            {changeSummary?.items?.[0] || "Initial load complete. No prior snapshot available yet."}
          </div>
        </div>

        <div
          style={{
            borderLeft: "1px solid rgba(110, 143, 195, 0.16)",
            paddingLeft: 14,
            display: "grid",
            gap: 8,
          }}
        >
          <div>
            <div className="mock-statBlock__label">Active Case</div>
            <div className="mock-statBlock__value">{activeCase?.label || "—"}</div>
          </div>
          <div>
            <div className="mock-statBlock__label">Selected Panel</div>
            <div className="mock-statBlock__value">{String(selectedPanel || "response_plan").replace(/_/g, " ")}</div>
          </div>
          <div>
            <div className="mock-statBlock__label">Audience</div>
            <div className="mock-statBlock__value">{String(agentAudience || "operator")}</div>
          </div>
        </div>
      </section>

      <section className="mock-main">
        <aside className="mock-rail mock-rail--left">
          <Panel title="Intake & Queue">
            <BulletList
              items={[
                `Active Case: ${activeCase?.label || "Franklin County"}`,
                `Recommendation: ${String(recommendation?.action || "monitor").replace(/_/g, " ")}`,
                "Pending Verification: 4",
                "Flagged Entities: 3",
                "Priority Queue: 7",
              ]}
            />
          </Panel>

          <Panel title="Contradictions & Alerts">
            <BulletList
              items={[
                "Duplicate outcome anomaly detected",
                "Verification delay threshold nearing limit",
                "Operator review advised before publication",
              ]}
            />
          </Panel>

          <Panel title="System Change Summary">
            <BulletList items={changeSummary?.items || ["No material dashboard metric changes detected on refresh."]} />
          </Panel>
        </aside>

        <main className="mock-center">
          <Panel title="Statewide Intelligence Surface">
            <TacticalMapStage />
          </Panel>
        </main>

        <aside className="mock-rail mock-rail--right">
          <Panel title="Oracle Truth Package">
            <div style={{ display: "grid", gap: 8 }}>
              <div><strong>Case:</strong> {prediction?.caseLabel || "Unknown Case"}</div>
              <div><strong>Status:</strong> {prediction?.systemStatus || "—"}</div>
              <div><strong>Risk:</strong> {prediction?.riskScore ?? 0}% • {prediction?.riskBand || "Low"}</div>
              <div><strong>Confidence:</strong> {prediction?.confidence ?? 0}%</div>
              <div><strong>Recommended Action:</strong> {prediction?.recommendedAction || "—"}</div>
              <div><strong>Predicted Next Stage:</strong> {prediction?.predictedNextStage || "—"}</div>
            </div>
          </Panel>

          <Panel title="AI Analyst Narrative">
            <AnalystPredictionCard
              agentContext={agentContext}
              agentAudience={agentAudience}
            />
          </Panel>

          <Panel title="Trust & Verification">
            <PredictionLayerPanel prediction={prediction} narrative={narrative} />
          </Panel>
        </aside>
      </section>

      <section
        style={{
          marginTop: 8,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          gap: 12,
          alignItems: "start",
        }}
      >
        <RecommendationStrip
          recommendation={{
            title: "Recommended Next Move",
            body:
              narrative?.recommendationReason ||
              "System recommendation reason not yet available.",
          }}
        />

        <DecisionActionBar
          activeAction={activeAction}
          setActiveAction={setActiveAction}
        />
      </section>

      <section
        style={{
          marginTop: 10,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 320px",
          gap: 12,
        }}
      >
        <Panel title="Reporting Dock">
          <div style={{ marginBottom: 10, color: "rgba(214, 226, 245, 0.74)" }}>
            Generate or open the latest decision-grade brief tied to the current command state.
          </div>
          <CommandCenterReportActions
            onGenerate={reportNoop("Generate Intelligence Brief")}
            onOpenLatest={reportNoop("Open Latest Brief")}
          />
        </Panel>

        <Panel title="System Status">
          <BulletList
            items={[
              loading ? "Loading live command data…" : "Live command data loaded",
              error ? `Error: ${error}` : "No active load error",
              `Selected action: ${String(activeAction).toUpperCase()}`,
              `Panel mode: ${String(selectedPanel || "response_plan").replace(/_/g, " ")}`,
            ]}
          />
        </Panel>
      </section>
    </div>
  );
}
