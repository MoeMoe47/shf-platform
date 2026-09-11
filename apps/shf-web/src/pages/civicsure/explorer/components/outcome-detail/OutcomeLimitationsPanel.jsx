// OutcomeLimitationsPanel.jsx — openly displays known limitations
// rather than hiding uncertainty (locked UX principle, same as Agency
// Detail's AgencyDataQualityNotice.jsx), plus the Comparability
// Notice: outcome comparisons are only valid when definitions,
// populations, reporting periods, and methodologies match. "Compare
// compatible outcomes" has no wired destination yet, so it renders as
// an inert, clearly labeled demo placeholder. DEMO / FRAME DATA (see
// ../../outcomeDetailMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function OutcomeLimitationsPanel({ limitations, comparability }) {
  return (
    <>
      <section className="cse-card cse-otc-limitations" aria-labelledby="cse-otc-limitations-heading">
        <h3 id="cse-otc-limitations-heading" className="cse-otc-limitations__heading">
          Limitations
        </h3>
        <ul className="cse-otc-limitations__list">
          {limitations.map((item, i) => (
            <li key={i}>
              <ExplorerIcon name="infoCircle" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="cse-card cse-otc-comparability" aria-labelledby="cse-otc-comparability-heading">
        <h3 id="cse-otc-comparability-heading" className="cse-otc-comparability__heading">
          {comparability.question}
        </h3>
        <p className="cse-otc-comparability__answer">{comparability.answer}</p>
        <button
          type="button"
          className="cse-btn cse-btn--outline"
          aria-disabled="true"
          aria-label={`${comparability.actionLabel} (coming soon)`}
          title="Coming soon"
        >
          <ExplorerIcon name="sliders" />
          {comparability.actionLabel}
        </button>
      </section>
    </>
  );
}
