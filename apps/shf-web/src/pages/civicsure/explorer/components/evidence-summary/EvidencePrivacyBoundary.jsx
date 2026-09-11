// EvidencePrivacyBoundary.jsx — "What CivicSure does not show
// publicly" panel. This is the page's core trust boundary: Evidence
// Summary is a public-safe projection only, and this panel makes that
// boundary explicit rather than implicit. DEMO / FRAME DATA (see
// ../../evidenceSummaryMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function EvidencePrivacyBoundary({ privacyBoundary }) {
  return (
    <section className="cse-card cse-evs-privacy" aria-labelledby="cse-evs-privacy-heading">
      <h3 id="cse-evs-privacy-heading" className="cse-evs-privacy__heading">
        {privacyBoundary.heading}
      </h3>
      <ul className="cse-evs-privacy__list">
        {privacyBoundary.items.map((item, i) => (
          <li key={i}>
            <ExplorerIcon name="close" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p className="cse-evs-privacy__supporting">{privacyBoundary.supportingText}</p>
    </section>
  );
}
