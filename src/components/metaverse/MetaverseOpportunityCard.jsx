import React from "react";

const ELIGIBILITY_LABEL = {
  ELIGIBLE: "Eligible",
  NOT_ELIGIBLE: "Not eligible",
  CONDITIONALLY_ELIGIBLE: "Some requirements remaining",
  CLOSED: "Closed",
  FULL: "Fully awarded",
  RESTRICTED: "Restricted",
};

const TIER_LABEL = {
  BEGINNER: "Beginner — open to everyone",
  DEVELOPING: "Developing",
  ADVANCED: "Advanced",
  VERIFIED_SKILL: "Verified skill",
};

// MET-8 §20/§22 — every field here is real, server-computed data from
// GET /metaverse/opportunity-exchange/opportunities (opportunity-
// service.ts's own eligibility engine). Eligibility is never re-derived
// client-side and never color-only (a text label always accompanies it).
export default function MetaverseOpportunityCard({ opportunity, onSelect }) {
  const deadline = new Date(opportunity.applicationCloseAt);
  const compensationLabel = opportunity.compensationType === "NONE"
    ? "No compensation"
    : opportunity.compensationType === "NON_MONETARY"
      ? "Non-monetary recognition"
      : `${opportunity.compensationAmount ?? "—"} ${opportunity.currencyType || opportunity.compensationType}`;

  return (
    <li className="met-opportunities__item">
      <button
        type="button"
        className={`met-opportunities__card met-opportunities__card--${opportunity.eligibility.result.toLowerCase()}`}
        onClick={() => onSelect(opportunity)}
        aria-describedby={`opportunity-eligibility-${opportunity.opportunityId}`}
      >
        <span className="met-opportunities__title">{opportunity.title}</span>
        <span className="met-opportunities__tier">{TIER_LABEL[opportunity.difficultyTier] || opportunity.difficultyTier}</span>
        <span
          id={`opportunity-eligibility-${opportunity.opportunityId}`}
          className="met-opportunities__eligibility"
          data-result={opportunity.eligibility.result}
        >
          {ELIGIBILITY_LABEL[opportunity.eligibility.result] || opportunity.eligibility.result}
        </span>
        <span className="met-opportunities__meta">
          Applications close {deadline.toLocaleDateString()} · {compensationLabel} (offered, not yet paid)
        </span>
        <span className="met-opportunities__meta">
          {opportunity.bidCount} bid{opportunity.bidCount === 1 ? "" : "s"} so far
        </span>
      </button>
    </li>
  );
}
