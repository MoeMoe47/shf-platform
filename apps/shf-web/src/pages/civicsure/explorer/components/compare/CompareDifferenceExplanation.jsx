// CompareDifferenceExplanation.jsx — "What explains the differences?"
// plain-language section. Built from the same DEMO comparability
// fields the Compatibility panel uses (buildDifferenceExplanations in
// compareViewMockData.js), so the two panels never contradict each
// other. Describes correlated factors, never causation. DEMO / FRAME
// DATA (see ../../compareViewMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function CompareDifferenceExplanation({ reasons }) {
  return (
    <section className="cse-card cse-cmp-differences" aria-labelledby="cse-cmp-differences-heading">
      <h2 id="cse-cmp-differences-heading">What explains the differences?</h2>
      <ul className="cse-cmp-differences__list">
        {reasons.map((reason, i) => (
          <li key={i}>
            <ExplorerIcon name="infoCircle" aria-hidden="true" />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
