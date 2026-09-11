// ProviderAssuranceStatus.jsx — "Assurance Status" panel with a real
// path to explanation. Locked UX principle (see task brief): never
// show a status like "Verified" without a way to see why — "View
// compliance details" performs a real local tab switch to the
// Compliance tab (no backend), same pattern as Program Detail's
// ProgramQuickLinks. DEMO / FRAME DATA (see
// ../../providerDetailMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import StatusBadge from "../StatusBadge.jsx";

export default function ProviderAssuranceStatus({ provider, onNavigateTab }) {
  return (
    <section className="cse-card cse-pvd-assurance" aria-labelledby="cse-pvd-assurance-heading">
      <h3 id="cse-pvd-assurance-heading" className="cse-pvd-assurance__heading">
        Assurance Status
      </h3>

      <div className="cse-pvd-assurance__status-row">
        <StatusBadge state="verified">
          <ExplorerIcon name="shieldCheck" />
          {provider.assurance.status}
        </StatusBadge>
      </div>

      <p className="cse-pvd-assurance__summary">{provider.assurance.summary}</p>

      <button type="button" className="cse-pvd-assurance__action" onClick={() => onNavigateTab("compliance")}>
        View compliance details
        <ExplorerIcon name="arrowRight" />
      </button>
    </section>
  );
}
