// EvidenceDataQualityNotice.jsx — openly displays data quality issues
// rather than hiding them. Locked UX principle: transparency about
// gaps increases trust, same pattern as Agency Detail's
// AgencyDataQualityNotice.jsx. DEMO / FRAME DATA (see
// ../../evidenceSummaryMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function EvidenceDataQualityNotice({ notice }) {
  return (
    <section className="cse-card cse-evs-dqn" aria-labelledby="cse-evs-dqn-heading">
      <h3 id="cse-evs-dqn-heading" className="cse-evs-dqn__heading">
        {notice.heading}
      </h3>
      <ul className="cse-evs-dqn__list">
        {notice.items.map((item, i) => (
          <li key={i}>
            <ExplorerIcon name="infoCircle" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
