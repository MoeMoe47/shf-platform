// CompareDataQualityNotice.jsx — "Comparison limitations" section.
// Locked UX principle: transparency about gaps increases trust, same
// pattern as every other detail page's Data Quality Notice in this
// suite. Always visible, never hidden behind an expand. Built from
// buildComparisonLimitations in compareViewMockData.js. DEMO / FRAME
// DATA.
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function CompareDataQualityNotice({ limitations }) {
  return (
    <section className="cse-card cse-cmp-dqn" aria-labelledby="cse-cmp-dqn-heading">
      <h2 id="cse-cmp-dqn-heading" className="cse-cmp-dqn__heading">
        Comparison limitations
      </h2>
      <ul className="cse-cmp-dqn__list">
        {limitations.map((item, i) => (
          <li key={i}>
            <ExplorerIcon name="infoCircle" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
