import React from "react";

function getPercent(current, target) {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export default function GoalCard({ goal, simpleMode, onRead }) {
  const percent = getPercent(goal.current, goal.target);

  return (
    <article className="goal-card" aria-labelledby={`goal-${goal.id}`}>
      <div className="goal-top">
        <h3 id={`goal-${goal.id}`}>{goal.title}</h3>
        <button type="button" className="inline-action" onClick={onRead}>
          Read
        </button>
      </div>

      <p className="goal-metric">
        Progress: <strong>{goal.current} {goal.unit}</strong>
      </p>
      <p className="goal-metric">
        Target: <strong>{goal.target} {goal.unit}</strong>
      </p>

      <p className={`status-chip status-${goal.status.toLowerCase().replace(/\s+/g, "-")}`}>
        Status: {goal.status}
      </p>

      {!simpleMode && (
        <div
          className="progress-wrap"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${goal.title} progress`}
        >
          <div className="progress-bar" style={{ width: `${percent}%` }} />
        </div>
      )}

      <p className="goal-explainer">{goal.explanation}</p>
      <p className="goal-next">
        <strong>Next Step:</strong> {goal.nextStep}
      </p>
    </article>
  );
}
