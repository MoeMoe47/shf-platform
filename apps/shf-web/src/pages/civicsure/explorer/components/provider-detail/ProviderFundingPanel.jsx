// ProviderFundingPanel.jsx — Funding tab: totals, sources, and
// program allocation breakdown. DEMO / FRAME DATA (see
// ../../providerDetailMockData.js). Reuses the existing
// FollowTheMoneyCard component (already built for the Explorer main
// page) for the "Follow the Money" action rather than re-implementing
// the 7-step lineage flow here.
import React from "react";
import FollowTheMoneyCard from "../FollowTheMoneyCard.jsx";

export default function ProviderFundingPanel({ provider }) {
  const { funding } = provider;

  const stats = [
    { key: "totalReceived", label: "Total Received", value: funding.totalReceived },
    { key: "activeAwards", label: "Active Awards", value: funding.activeAwards },
    { key: "obligated", label: "Obligated Amount", value: funding.obligated },
    { key: "expended", label: "Expended Amount", value: funding.expended },
  ];

  return (
    <div className="cse-pvd-panel" role="tabpanel" id="cse-pvd-tabpanel-funding" aria-labelledby="cse-pvd-tab-funding">
      <div className="cse-pvd-funding-stats" role="list" aria-label={`Funding summary for ${provider.name} (demo data)`}>
        {stats.map((s) => (
          <div className="cse-metric-card" role="listitem" key={s.key}>
            <div>
              <p className="cse-metric-card__value">{s.value}</p>
              <p className="cse-metric-card__label">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="cse-pvd-funding-grid">
        <section className="cse-card">
          <h3 className="cse-pvd-funding-section__heading">Funding Sources</h3>
          <p className="cse-pvd-funding-section__period">Reporting period: {funding.reportingPeriod}</p>
          <ul className="cse-pvd-funding-list">
            {funding.sources.map((s) => (
              <li key={s.key}>
                <span>{s.label}</span>
                <strong>{s.amount}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="cse-card">
          <h3 className="cse-pvd-funding-section__heading">Program Allocation Breakdown</h3>
          <ul className="cse-pvd-funding-list">
            {funding.allocations.map((a) => (
              <li key={a.key}>
                <span>{a.label}</span>
                <strong>{a.amount}</strong>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <FollowTheMoneyCard />
    </div>
  );
}
