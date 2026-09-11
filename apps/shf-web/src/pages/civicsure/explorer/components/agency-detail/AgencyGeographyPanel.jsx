// AgencyGeographyPanel.jsx — compact geographic distribution summary
// with a real link to Geography Explorer. DEMO / FRAME DATA (see
// ../../agencyDetailMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function AgencyGeographyPanel({ geography }) {
  return (
    <section className="cse-card cse-agy-geography" aria-labelledby="cse-agy-geography-heading">
      <h3 id="cse-agy-geography-heading" className="cse-agy-geography__heading">
        Geographic Distribution
      </h3>

      <ul className="cse-agy-geography__list">
        {geography.distribution.map((d) => (
          <li key={d.key}>
            <span>{d.label}</span>
            <strong>{d.count}</strong>
          </li>
        ))}
      </ul>

      <a href="#/explorer/geography" className="cse-agy-geography__action">
        Explore geography
        <ExplorerIcon name="arrowRight" />
      </a>
    </section>
  );
}
