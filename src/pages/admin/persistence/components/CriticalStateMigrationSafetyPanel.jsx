import React from "react";

export default function CriticalStateMigrationSafetyPanel({ plan }) {
  const findings = plan?.safety_result?.findings || [];
  return (
    <section className="persistence-panel">
      <div className="panel-heading">
        <p>Safety</p>
        <h2>Unsafe Field Scan</h2>
      </div>
      <ul className="status-list">
        <li><span>Unsafe fields</span><strong>{plan?.safety_result?.unsafe_field_count || 0}</strong></li>
        <li><span>Public approval mutation</span><strong>false</strong></li>
        <li><span>SHF Impact mutation</span><strong>false</strong></li>
        <li><span>External effects</span><strong>false</strong></li>
      </ul>
      {findings.length ? (
        <ul className="blocked-list">
          {findings.slice(0, 6).map((finding) => <li key={`${finding.path}-${finding.reason}`}>{finding.path}: {finding.reason}</li>)}
        </ul>
      ) : <p className="empty-state">No unsafe migration fields detected.</p>}
    </section>
  );
}
