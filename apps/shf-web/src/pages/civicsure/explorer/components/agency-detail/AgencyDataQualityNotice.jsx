// AgencyDataQualityNotice.jsx — openly displays incomplete data
// rather than hiding it. Locked UX principle: transparency about gaps
// increases trust. DEMO / FRAME DATA (see ../../agencyDetailMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function AgencyDataQualityNotice({ notice }) {
  return (
    <section className="cse-card cse-agy-dqn" aria-labelledby="cse-agy-dqn-heading">
      <h3 id="cse-agy-dqn-heading" className="cse-agy-dqn__heading">
        {notice.heading}
      </h3>
      <ul className="cse-agy-dqn__list">
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
