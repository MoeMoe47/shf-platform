// AgencyFundingSourcesPanel.jsx — major funding sources at a glance.
// DEMO / FRAME DATA (see ../../agencyDetailMockData.js). The Funding
// tab shows this same list again in more detail — this is the
// quick-glance version, same precedent as summary metrics repeating
// in more depth on their own tab elsewhere in this suite.
import React from "react";

export default function AgencyFundingSourcesPanel({ sources }) {
  return (
    <section className="cse-card cse-agy-funding-sources" aria-labelledby="cse-agy-funding-sources-heading">
      <h3 id="cse-agy-funding-sources-heading" className="cse-agy-funding-sources__heading">
        Major Funding Sources
      </h3>
      <ul className="cse-agy-funding-sources__list">
        {sources.map((s) => (
          <li key={s.key}>
            <span>{s.label}</span>
            <strong>{s.amount}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
