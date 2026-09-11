// EvidenceClaimChain.jsx — compact "Source → Evidence Set → Decision
// → Outcome → Program → Funding" connection, reusing the shared
// .cse-ftm__* visual classes already shared in civicsure-explorer.css
// (same primitive Funding Detail's FundingMoneyFlowPanel.jsx, Agency
// Detail's AgencyFundingPanel.jsx, and Outcome Detail's
// OutcomeRelatedFundingPanel.jsx lineages reused) with this evidence
// record's own 6-node chain. Understandable without technical
// provenance terminology — every node is a plain-English label, never
// a raw record id. DEMO / FRAME DATA (see
// ../../evidenceSummaryMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function EvidenceClaimChain({ chain, heading, description }) {
  return (
    <section className="cse-card cse-evs-chain" aria-labelledby="cse-evs-chain-heading">
      <div className="cse-ftm__head">
        <span className="cse-ftm__head-icon" aria-hidden="true">
          <ExplorerIcon name="userCheck" />
        </span>
        <div className="cse-ftm__head-text">
          <h3 id="cse-evs-chain-heading">{heading}</h3>
          <p>{description}</p>
        </div>
      </div>

      <ol className="cse-ftm__flow" aria-label="Evidence-to-claim chain (illustrative)">
        {chain.map((step, i) => (
          <React.Fragment key={step.key}>
            <li className={`cse-ftm__step${step.tone === "green" ? " cse-ftm__step--green" : ""}`}>
              <span className="cse-ftm__step-icon" aria-hidden="true">
                <ExplorerIcon name={step.icon} />
              </span>
              <span className="cse-ftm__step-label">{step.label}</span>
            </li>
            {i < chain.length - 1 ? (
              <li className="cse-ftm__arrow" aria-hidden="true">
                <ExplorerIcon name="arrowRight" />
              </li>
            ) : null}
          </React.Fragment>
        ))}
      </ol>
    </section>
  );
}
