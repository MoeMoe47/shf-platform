import React from "react";

export default function AgentWorkflowProgress({ run, steps }) {
  if (!run) return null;
  const completed = steps.filter((step) => step.status === "completed").length;
  const skipped = steps.filter((step) => step.status === "skipped").length;
  const blocked = steps.filter((step) => step.status === "blocked" || step.blockers?.length).length;

  return (
    <section className="agent-workbench-panel agent-workflow-progress" aria-label="Workflow Progress">
      <div className="agent-workbench-panel__head">
        <div>
          <span>Workflow Progress</span>
          <strong>{run.progress_percent}%</strong>
        </div>
      </div>
      <div className="agent-workflow-progress-bar" aria-label="Workflow progress percent">
        <span style={{ width: `${Math.max(0, Math.min(100, run.progress_percent || 0))}%` }} />
      </div>
      <div className="agent-workbench-metrics">
        <article><span>Total Steps</span><strong>{steps.length}</strong></article>
        <article><span>Completed</span><strong>{completed}</strong></article>
        <article><span>Skipped</span><strong>{skipped}</strong></article>
        <article><span>Blocked</span><strong>{blocked}</strong></article>
      </div>
    </section>
  );
}
