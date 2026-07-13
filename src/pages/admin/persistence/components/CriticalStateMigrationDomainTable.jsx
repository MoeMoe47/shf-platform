import React from "react";

export default function CriticalStateMigrationDomainTable({ domains, selectedDomain, onSelectDomain }) {
  return (
    <section className="persistence-panel critical-state-domain-table">
      <div className="panel-heading">
        <p>Six Primary Domains</p>
        <h2>Repository Mapping</h2>
      </div>
      <div className="critical-domain-list">
        {domains.map((domain) => (
          <button
            key={domain.domain}
            type="button"
            className={selectedDomain === domain.domain ? "selected-domain" : ""}
            onClick={() => onSelectDomain(domain.domain)}
          >
            <strong>{domain.label}</strong>
            <span>{domain.source_keys.join(" | ")}</span>
            <small>{domain.target_repository} - {domain.stage}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
