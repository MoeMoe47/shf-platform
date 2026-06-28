import React from "react";

function ListBlock({ title, items }) {
  return (
    <div className="agent-workbench-detail-list">
      <h3>{title}</h3>
      {items?.length ? (
        <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
      ) : (
        <p>None</p>
      )}
    </div>
  );
}

export default function ProductionAutomationRunDetail({ run, recipe, onAction, onAttachContext }) {
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    setNote(run?.operator_note || "");
  }, [run?.automation_run_id, run?.operator_note]);

  if (!run) {
    return (
      <section className="agent-workbench-panel agent-workbench-empty" aria-label="Production Automation Run Detail">
        Select or create a Production Automation V2 run.
      </section>
    );
  }

  return (
    <section className="agent-workbench-panel production-automation-detail" aria-label="Production Automation Run Detail">
      <div className="agent-workbench-panel__head">
        <div>
          <span>Automation Run Detail</span>
          <strong>{run.title}</strong>
        </div>
        <span className={`agent-workbench-flag ${run.blockers?.length ? "is-blocked" : "is-safe"}`}>{run.status}</span>
      </div>
      <div className="agent-workbench-detail__body">
        <div className="agent-workbench-kv-grid">
          <div><span>Run ID</span><strong>{run.automation_run_id}</strong></div>
          <div><span>Recipe</span><strong>{recipe?.recipe_type || run.automation_recipe_id}</strong></div>
          <div><span>Readiness</span><strong>{run.readiness_score}%</strong></div>
          <div><span>execution_enabled_v2</span><strong>{String(run.execution_enabled_v2)}</strong></div>
          <div><span>Workflow</span><strong>{run.related_workflow_run_id || "None"}</strong></div>
          <div><span>Coordination</span><strong>{run.related_coordination_plan_id || "None"}</strong></div>
          <div><span>Tasks</span><strong>{run.related_task_ids?.length || 0}</strong></div>
          <div><span>Approvals</span><strong>{run.related_approval_ids?.length || 0}</strong></div>
        </div>
        <label className="production-automation-note">
          Operator Note
          <textarea rows="4" value={note} onChange={(event) => setNote(event.target.value)} />
        </label>
        <div className="agent-workbench-actions production-automation-actions">
          <button type="button" onClick={() => onAction("review", note)}>Mark In Review</button>
          <button type="button" onClick={() => onAction("approve", note)}>Approve Status</button>
          <button type="button" onClick={() => onAction("block", note)}>Block Run</button>
          <button type="button" onClick={() => onAction("complete", note)}>Complete Run</button>
          <button type="button" onClick={() => onAction("note", note)}>Add Note</button>
          <button type="button" onClick={() => onAction("checklist", note)}>Create Checklist Record</button>
          <button type="button" onClick={() => onAction("recommendation", note)}>Create Recommendation Packet</button>
          <button type="button" onClick={onAttachContext}>Attach Context Packet</button>
        </div>
        <div className="agent-workbench-split">
          <ListBlock title="Planned Local Actions" items={run.local_actions_planned} />
          <ListBlock title="Completed Local Actions" items={run.local_actions_completed} />
        </div>
        <div className="agent-workbench-split">
          <ListBlock title="Blockers" items={run.blockers} />
          <ListBlock title="Warnings" items={run.warnings} />
        </div>
        <div className="agent-workbench-split">
          <ListBlock title="Checklist Items" items={run.checklist_items} />
          <ListBlock title="Local Change Log" items={run.local_change_log} />
        </div>
      </div>
    </section>
  );
}
