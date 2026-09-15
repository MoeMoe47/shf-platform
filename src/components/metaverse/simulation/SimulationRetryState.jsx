import React from "react";

const RETRY_LABELS = {
  UNLIMITED_PRACTICE: "You may retry this simulation as many times as you like.",
  LIMITED_ATTEMPTS: "This simulation has a limited number of attempts.",
  INSTRUCTOR_RELEASED_RETRY: "A retry must be released by an instructor before you can try again.",
  REVIEW_REQUIRED: "A reviewer must release another attempt before you can try again.",
  NO_RETRY: "This simulation does not allow a retry.",
};

export default function SimulationRetryState({ retryPolicy, retryCount, onRetry, retrying, retryError }) {
  if (!retryPolicy) return null;
  return (
    <section className="met-simulation__retry" aria-label="Retry status">
      <h3>Retry status</h3>
      <p>{RETRY_LABELS[retryPolicy.policy] || retryPolicy.notes}</p>
      <p>Attempts so far this session: {retryCount ?? 0}</p>
      {retryPolicy.policy !== "NO_RETRY" ? (
        <button type="button" onClick={onRetry} disabled={retrying}>
          {retrying ? "Restarting…" : "Restart this attempt"}
        </button>
      ) : null}
      {retryError ? <p role="alert" className="met-simulation__error">{retryError}</p> : null}
    </section>
  );
}
