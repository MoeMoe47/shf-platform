import React from "react";

const LABELS = {
  REQUIRED_NOW: "Required now",
  WAITING_ON_YOU: "Waiting on you",
  WAITING_ON_SOMEONE_ELSE: "Waiting on someone else",
  BLOCKED: "Blocked",
  REFERENCE: "Reference",
  OPTIONAL: "Optional",
  COMPLETED: "Completed",
};

function statusMessage(state) {
  if (state.loading) return "Loading your next steps...";
  if (state.error) return state.error;
  if (state.data?.status === "UNKNOWN") return "Some required context is unavailable. Your next steps cannot be determined yet.";
  if (state.data?.status === "SOURCE_UNAVAILABLE") return "A required service source is unavailable. Try again when it is available.";
  if (state.data?.status === "CONFLICT") return "Conflicting requirements need authorized review before next steps can be shown.";
  if (state.data?.status === "NO_ACTIONS") return "No next steps are currently resolved for this service.";
  return "";
}

export default function DgalNextStepsPanel({ state, onRetry }) {
  const message = statusMessage(state);
  const items = state.data?.items || [];
  const openItem = (item) => {
    if (typeof window === "undefined" || !item.returnTarget) return;
    try { window.sessionStorage.setItem("dgal:return-target", JSON.stringify(item.returnTarget)); } catch { /* navigation remains authoritative */ }
  };

  return (
    <section className="dgal-next-steps" aria-labelledby="dgal-next-steps-title">
      <div className="dgal-next-steps-heading">
        <div>
          <p className="dgal-eyebrow">Contextual guidance</p>
          <h2 id="dgal-next-steps-title">Your next steps</h2>
        </div>
        {state.error || ["UNKNOWN", "SOURCE_UNAVAILABLE", "CONFLICT"].includes(state.data?.status) ? (
          <button type="button" onClick={onRetry}>Retry</button>
        ) : null}
      </div>
      {state.loading ? <p role="status">{message}</p> : null}
      {!state.loading && message ? <p role={state.error || state.data?.status !== "NO_ACTIONS" ? "alert" : "status"}>{message}</p> : null}
      {!state.loading && !message && items.length ? (
        <ol className="dgal-next-steps-list">
          {items.map((item) => (
            <li key={item.guidanceId} className={`dgal-next-step dgal-next-step--${String(item.category || "reference").toLowerCase()}`}>
              <div className="dgal-next-step-copy">
                <p className="dgal-next-step-status">{LABELS[item.category] || item.category}</p>
                <h3>{item.title}</h3>
                <p>{item.explanation}</p>
                {item.waitingOn ? <p className="dgal-next-step-waiting">Waiting on: {item.waitingOn}</p> : null}
                {item.sourceDomain ? <p className="dgal-next-step-source">Required by {item.sourceDomain}</p> : null}
              </div>
              {item.actionTarget?.route ? <a className="civicsure-canonical-link" href={item.actionTarget.route} onClick={() => openItem(item)}>{item.category === "COMPLETED" ? "Review" : "Open next step"}</a> : null}
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
