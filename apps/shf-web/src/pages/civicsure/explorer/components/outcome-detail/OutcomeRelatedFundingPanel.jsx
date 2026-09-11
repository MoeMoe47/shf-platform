// OutcomeRelatedFundingPanel.jsx — compact "Fund → Program → Outcome"
// connection, reusing the shared .cse-ftm__* visual classes already
// shared in civicsure-explorer.css (same primitive Funding Detail's
// FundingMoneyFlowPanel.jsx and Agency Detail's AgencyFundingPanel.jsx
// lineage reused) with this outcome's own 3-node chain. A real
// "View funding lineage →" link to the already-built Funding Detail
// page. DEMO / FRAME DATA (see ../../outcomeDetailMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function OutcomeRelatedFundingPanel({ relatedFunding }) {
  return (
    <section className="cse-card cse-otc-related-funding" aria-labelledby="cse-otc-related-funding-heading">
      <div className="cse-ftm__head">
        <span className="cse-ftm__head-icon" aria-hidden="true">
          <ExplorerIcon name="bank" />
        </span>
        <div className="cse-ftm__head-text">
          <h3 id="cse-otc-related-funding-heading">Related Funding</h3>
          <p>How this outcome is funded, source to result.</p>
        </div>
      </div>

      <ol className="cse-ftm__flow" aria-label="Related funding lineage (illustrative)">
        {relatedFunding.chain.map((step, i) => (
          <React.Fragment key={step.key}>
            <li className={`cse-ftm__step${step.tone === "green" ? " cse-ftm__step--green" : ""}`}>
              <span className="cse-ftm__step-icon" aria-hidden="true">
                <ExplorerIcon name={step.icon} />
              </span>
              <span className="cse-ftm__step-label">{step.label}</span>
            </li>
            {i < relatedFunding.chain.length - 1 ? (
              <li className="cse-ftm__arrow" aria-hidden="true">
                <ExplorerIcon name="arrowRight" />
              </li>
            ) : null}
          </React.Fragment>
        ))}
      </ol>

      <a className="cse-otc-related-funding__action" href={`#/explorer/funding/${encodeURIComponent(relatedFunding.fundingId)}`}>
        View funding lineage
        <ExplorerIcon name="arrowRight" />
      </a>
    </section>
  );
}
