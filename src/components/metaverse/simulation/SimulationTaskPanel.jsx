import React from "react";

// MET-13 §9/§37 — plain text form, keyboard-operable, no drag-only or
// mouse-precision-only interaction, no timed-only input.
export default function SimulationTaskPanel({ currentStep, response, onResponseChange, onSubmitStep, submitting, error }) {
  if (!currentStep) {
    return (
      <section className="met-simulation__task" aria-label="Simulation task">
        <p>Every required step has been completed. You may submit an artifact if this simulation requires one, then complete the simulation.</p>
      </section>
    );
  }

  return (
    <section className="met-simulation__task" aria-label={`Current step: ${currentStep.title}`}>
      <h3>{currentStep.title}</h3>
      <p>{currentStep.instructions}</p>
      <label htmlFor="met-simulation-response">Your response</label>
      <textarea
        id="met-simulation-response"
        rows={4}
        value={response}
        onChange={(event) => onResponseChange(event.target.value)}
        aria-describedby="met-simulation-response-hint"
      />
      <p id="met-simulation-response-hint" className="met-simulation__hint">
        There is no single hidden correct answer; this records your reasoning for the step.
      </p>
      <button type="button" onClick={onSubmitStep} disabled={submitting}>
        {submitting ? "Submitting…" : "Submit step"}
      </button>
      {error ? <p role="alert" className="met-simulation__error">{error}</p> : null}
    </section>
  );
}
