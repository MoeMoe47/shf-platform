// StatusBadge.jsx — shared status vocabulary used across Provider
// Detail, County Detail, and Geography Explorer (Outcomes, Evidence,
// Compliance/Assurance rows): Verified / Current / On Track / Pending
// Review / Evidence Pending / Open Exception / Corrective Action /
// Not Yet Evaluated. Text label always renders (never color-only
// meaning) — color is a restrained accent, not the carrier of
// information. Verified/Current/On Track are the only green states;
// Open Exception and Corrective Action are the only amber states, per
// the locked visual system's "restrained amber/red for exceptions
// only" rule. Styled by .cse-status-badge in civicsure-explorer.css,
// which every public Explorer/detail page already imports for shared
// primitives (cse-btn, cse-pill, cse-card, cse-metric-card).
import React from "react";

const STATUS_CONFIG = {
  verified: { label: "Verified", tone: "green" },
  current: { label: "Current", tone: "green" },
  "on-track": { label: "On Track", tone: "green" },
  "pending-review": { label: "Pending Review", tone: "blue" },
  "evidence-pending": { label: "Evidence Pending", tone: "blue" },
  "not-yet-evaluated": { label: "Not Yet Evaluated", tone: "blue" },
  "open-exception": { label: "Open Exception", tone: "amber" },
  "corrective-action": { label: "Corrective Action", tone: "amber" },
};

export default function StatusBadge({ state, children }) {
  const config = STATUS_CONFIG[state] || { label: state, tone: "blue" };
  return <span className={`cse-status-badge cse-status-badge--${config.tone}`}>{children || config.label}</span>;
}
