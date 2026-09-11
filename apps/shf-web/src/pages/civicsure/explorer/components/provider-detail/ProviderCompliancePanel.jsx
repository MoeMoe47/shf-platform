// ProviderCompliancePanel.jsx — Compliance tab: reporting currency,
// reconciliation status, open exceptions, corrective actions, audit
// findings, and documentation status. DEMO / FRAME DATA (see
// ../../providerDetailMockData.js). Wording is restricted to the
// status vocabulary in ../StatusBadge.jsx (Verified / Current /
// Pending Review / Open Exception / Corrective Action) — this page
// never asserts real legal compliance, only what this demo frame's
// mock assurance checks show.
import React from "react";
import StatusBadge from "../StatusBadge.jsx";

function ComplianceRow({ label, state, note }) {
  return (
    <div className="cse-pvd-compliance-row">
      <span className="cse-pvd-compliance-row__label">{label}</span>
      <StatusBadge state={state} />
      {note ? <span className="cse-pvd-compliance-row__note">{note}</span> : null}
    </div>
  );
}

export default function ProviderCompliancePanel({ provider }) {
  const { compliance } = provider;

  return (
    <div className="cse-pvd-panel" role="tabpanel" id="cse-pvd-tabpanel-compliance" aria-labelledby="cse-pvd-tab-compliance">
      <section className="cse-card cse-pvd-compliance-section">
        <h3>Reporting &amp; Reconciliation</h3>
        <ComplianceRow label={compliance.reportingCurrent.label} state={compliance.reportingCurrent.state} />
        <ComplianceRow label={compliance.reconciliation.label} state={compliance.reconciliation.state} note={compliance.reconciliation.note} />
      </section>

      <section className="cse-card cse-pvd-compliance-section">
        <h3>Open Exceptions</h3>
        {compliance.openExceptions.length === 0 ? (
          <p className="cse-pvd-compliance-empty">No open exceptions.</p>
        ) : (
          compliance.openExceptions.map((ex) => <ComplianceRow key={ex.key} label={ex.label} state={ex.state} />)
        )}
      </section>

      <section className="cse-card cse-pvd-compliance-section">
        <h3>Corrective Actions</h3>
        {compliance.correctiveActions.length === 0 ? (
          <p className="cse-pvd-compliance-empty">No corrective actions in progress.</p>
        ) : (
          compliance.correctiveActions.map((ca) => <ComplianceRow key={ca.key} label={ca.label} state={ca.state} />)
        )}
      </section>

      <section className="cse-card cse-pvd-compliance-section">
        <h3>Audit &amp; Documentation</h3>
        <ComplianceRow label={compliance.auditFindings.label} state={compliance.auditFindings.state} note={compliance.auditFindings.note} />
        <ComplianceRow label={compliance.documentation.label} state={compliance.documentation.state} />
      </section>
    </div>
  );
}
