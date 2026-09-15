import React from "react";

export default function EnterpriseOpportunityPanel({ opportunities }) {
  const eligible = (opportunities || []).filter((opportunity) => opportunity.sourceType === "STUDENT_ENTERPRISE");
  return (
    <section className="met-enterprise__opportunities" aria-label="Eligible enterprise opportunities">
      <h3>Enterprise opportunities</h3>
      <p>Bids are submitted through the Student Opportunity Exchange as a canonical team bid — no separate enterprise bid exists.</p>
      {eligible.length === 0 ? <p>No enterprise-sourced opportunities are currently open.</p> : null}
      <ul>
        {eligible.map((opportunity) => (
          <li key={opportunity.opportunityId}>
            <strong>{opportunity.title}</strong>
            <p>{opportunity.summary}</p>
            <p className="met-enterprise__meta">{opportunity.status} · closes {opportunity.applicationCloseAt}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
