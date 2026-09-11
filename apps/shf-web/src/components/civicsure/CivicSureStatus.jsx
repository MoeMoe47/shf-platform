import React from "react";

const labels = { VERIFIED: "Verified", ACCEPTED: "Verified", PENDING: "Pending", NEEDS_REVIEW: "Needs review", BLOCKED: "Blocked", RESTRICTED: "Restricted", COMPLETE: "Complete", OPEN: "Open", OVERDUE: "Overdue" };

export default function CivicSureStatus({ value = "UNKNOWN" }) {
  const label = labels[value] || String(value).replaceAll("_", " ").toLowerCase().replace(/^./, (character) => character.toUpperCase());
  return <span className={`civicsure-status civicsure-status--${String(value).toLowerCase()}`}><span aria-hidden="true" className="civicsure-status__dot" />{label}</span>;
}
