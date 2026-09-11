// FundingDataQualityNotice.jsx — openly displays incomplete data
// rather than hiding it. Locked UX principle: transparency about gaps
// increases trust. DEMO / FRAME DATA (see ../../fundingDetailMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function FundingDataQualityNotice({ notice }) {
  return (
    <section className="cse-card cse-fnd-dqn" aria-labelledby="cse-fnd-dqn-heading">
      <h3 id="cse-fnd-dqn-heading" className="cse-fnd-dqn__heading">
        {notice.heading}
      </h3>
      <ul className="cse-fnd-dqn__list">
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
