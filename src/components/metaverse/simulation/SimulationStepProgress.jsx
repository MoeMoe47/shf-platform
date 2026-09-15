import React from "react";

// MET-13 §9 — status is always conveyed with text, not color alone.
export default function SimulationStepProgress({ taskSteps, completedStepIds }) {
  const steps = taskSteps || [];
  const completed = new Set(completedStepIds || []);
  return (
    <ol className="met-simulation__steps" aria-label="Simulation step progress">
      {steps.map((step, index) => {
        const isDone = completed.has(step.stepId);
        const statusLabel = isDone ? "Completed" : "Not yet completed";
        return (
          <li key={step.stepId} className={isDone ? "met-simulation__step met-simulation__step--done" : "met-simulation__step"}>
            <span className="met-simulation__step-index">{index + 1}.</span>{" "}
            <span className="met-simulation__step-title">{step.title}</span>{" "}
            <span className="met-simulation__step-status">({statusLabel})</span>
            {step.isOptional ? <span className="met-simulation__step-optional"> — optional</span> : null}
          </li>
        );
      })}
    </ol>
  );
}
