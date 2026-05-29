import React from "react";

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

export function getReconciliationSignal(status, priority = "medium", confidenceScore = null) {
  const normalized = normalize(status);
  const priorityValue = normalize(priority);
  const confidence = Number(confidenceScore || 0);

  if (normalized === "accepted" || normalized === "completed") {
    return { label: "Ready", tone: "ready", description: "Conflict review is complete." };
  }

  if (normalized === "blocked") {
    return { label: "Conflict", tone: "conflict", description: "Conflict is blocking downstream use." };
  }

  if (priorityValue === "high") {
    return { label: "Escalate", tone: "blocked", description: "High-priority reconciliation needs operator attention." };
  }

  if (normalized === "queued" || normalized === "in_progress") {
    return { label: "Needs Review", tone: "review", description: "Reconciliation is still in review." };
  }

  if (confidence >= 90) {
    return { label: "Review", tone: "review", description: "High confidence but not yet completed." };
  }

  return { label: "Not Oracle Ready", tone: "neutral", description: "Reconciliation state is not ready for Oracle use." };
}

export default function ReconciliationStatusPill({ status, priority, confidenceScore, compact = false }) {
  const signal = getReconciliationSignal(status, priority, confidenceScore);

  return (
    <span
      className={[
        "admin-aggregation-signal-pill",
        `admin-aggregation-signal-pill--${signal.tone}`,
        compact ? "is-compact" : "",
      ].join(" ")}
      title={signal.description}
    >
      {signal.label}
    </span>
  );
}
