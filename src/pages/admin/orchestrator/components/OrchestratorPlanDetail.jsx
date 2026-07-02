import React from "react";

function List({ items = [] }) {
  return items.length ? (
    <ul>
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  ) : <p className="orch-muted">None recorded.</p>;
}

export default function OrchestratorPlanDetail({ plan }) {
  if (!plan) {
    return (
      <section className="orch-card">
        <div className="orch-section-head"><div><span>Plan</span><h2>No Plan Selected</h2></div></div>
      </section>
    );
  }

  return (
    <section className="orch-card orch-plan-detail">
      <div className="orch-section-head">
        <div>
          <span>Selected Plan</span>
          <h2>{plan.title}</h2>
        </div>
        <strong>{plan.readiness_score}%</strong>
      </div>
      <p>{plan.summary}</p>
      <div className="orch-grid-two">
        <div>
          <h3>Governance Gates</h3>
          <List items={plan.required_governance_gates} />
        </div>
        <div>
          <h3>Required Approvals</h3>
          <List items={plan.required_approvals} />
        </div>
        <div>
          <h3>Direct Connect Proofs</h3>
          <List items={plan.required_direct_source_proofs} />
        </div>
        <div>
          <h3>Reports</h3>
          <List items={plan.required_reports} />
        </div>
      </div>
    </section>
  );
}
