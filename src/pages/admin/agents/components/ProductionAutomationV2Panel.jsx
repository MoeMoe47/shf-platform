import React from "react";
import { PRODUCTION_AUTOMATION_V2_SAFETY_COPY } from "@/data/agents/productionAutomationV2Safety";

export default function ProductionAutomationV2Panel({ runs = [], metrics, agentsById = {}, selectedRunId, onSelectRun }) {
  return (
    <section className="agent-workbench-panel production-automation-panel" aria-label="Production Automation V2 Panel">
      <div className="agent-workbench-panel__head">
        <div>
          <span>Production Automation V2</span>
          <strong>{metrics.run_count} local runs</strong>
        </div>
      </div>
      <p className="agent-memory-boundary">{PRODUCTION_AUTOMATION_V2_SAFETY_COPY}</p>
      <div className="agent-workbench-metrics">
        <article><span>Recipes</span><strong>{metrics.recipe_count}</strong></article>
        <article><span>Ready</span><strong>{metrics.ready_runs}</strong></article>
        <article><span>Blocked</span><strong>{metrics.blocked_runs}</strong></article>
        <article><span>Avg Readiness</span><strong>{metrics.average_readiness_score}%</strong></article>
      </div>
      <div className="agent-workflow-list production-automation-run-list">
        {runs.length ? runs.map((run) => (
          <button
            key={run.automation_run_id}
            type="button"
            className={run.automation_run_id === selectedRunId ? "is-active" : ""}
            onClick={() => onSelectRun(run.automation_run_id)}
          >
            <span>{run.status} · {run.risk_level}</span>
            <strong>{run.title}</strong>
            <small>Owner: {agentsById[run.owner_agent_id]?.name || run.owner_agent_id} · Readiness: {run.readiness_score}%</small>
          </button>
        )) : (
          <article className="agent-workbench-empty">No Production Automation V2 runs yet.</article>
        )}
      </div>
    </section>
  );
}
