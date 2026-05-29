import React from "react";

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

export function getVerificationSignal(value, confidenceScore = null) {
  const status = normalize(value);
  const confidence = Number(confidenceScore || 0);

  if (status === "verified") {
    return { label: "Ready", tone: "ready", description: "Verification passed." };
  }

  if (status === "disputed") {
    return { label: "Conflict", tone: "conflict", description: "Verification has a dispute." };
  }

  if (status === "rejected") {
    return { label: "Not Ready", tone: "blocked", description: "Verification rejected." };
  }

  if (confidence >= 90) {
    return { label: "Review", tone: "review", description: "High confidence, but verification still needs review." };
  }

  if (status === "pending") {
    return { label: "Needs Review", tone: "review", description: "Verification pending." };
  }

  return { label: "Unreviewed", tone: "neutral", description: "Verification state has not been finalized." };
}

export default function VerificationPill({ value, confidenceScore = null, compact = false }) {
  const signal = getVerificationSignal(value, confidenceScore);

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
