// FundingGeographyPanel.jsx — small geographic distribution summary
// with a real link to Geography Explorer. DEMO / FRAME DATA (see
// ../../fundingDetailMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function FundingGeographyPanel({ geography }) {
  return (
    <section className="cse-card cse-fnd-geography" aria-labelledby="cse-fnd-geography-heading">
      <h3 id="cse-fnd-geography-heading" className="cse-fnd-geography__heading">
        Geographic Distribution
      </h3>

      <ul className="cse-fnd-geography__list">
        {geography.distribution.map((d) => (
          <li key={d.key}>
            <span>{d.label}</span>
            <strong>{d.amount}</strong>
          </li>
        ))}
      </ul>

      <a href="#/explorer/geography" className="cse-fnd-geography__action">
        Explore on map
        <ExplorerIcon name="arrowRight" />
      </a>
    </section>
  );
}
