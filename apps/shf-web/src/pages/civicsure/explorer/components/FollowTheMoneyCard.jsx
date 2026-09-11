// FollowTheMoneyCard.jsx — signature CivicSure lineage visualization.
// Frame only: this is a static illustration of the seven-step flow,
// not live lineage data — no Truth Spine / Evidence authority wiring.
import React from "react";
import { ExplorerIcon } from "../explorerIcons.jsx";
import { FOLLOW_THE_MONEY_STEPS } from "../civicsureExplorerMockData.js";

export default function FollowTheMoneyCard() {
  return (
    <section className="cse-card cse-ftm" aria-labelledby="cse-ftm-heading">
      <div className="cse-ftm__head">
        <span className="cse-ftm__head-icon" aria-hidden="true">
          <ExplorerIcon name="network" />
        </span>
        <div className="cse-ftm__head-text">
          <h3 id="cse-ftm-heading">Follow the Money</h3>
          <p>Trace the path from funding to real-world impact.</p>
        </div>
        <span className="cse-ftm__head-arrow" aria-hidden="true">
          <ExplorerIcon name="chevronRight" />
        </span>
      </div>

      <ol className="cse-ftm__flow" aria-label="Funding lineage stages (illustrative)">
        {FOLLOW_THE_MONEY_STEPS.map((step, i) => (
          <React.Fragment key={step.key}>
            <li className={`cse-ftm__step${step.tone === "green" ? " cse-ftm__step--green" : ""}`}>
              <span className="cse-ftm__step-icon" aria-hidden="true">
                <ExplorerIcon name={step.icon} />
              </span>
              <span className="cse-ftm__step-label">{step.label}</span>
            </li>
            {i < FOLLOW_THE_MONEY_STEPS.length - 1 && (
              <li className="cse-ftm__arrow" aria-hidden="true">
                <ExplorerIcon name="arrowRight" />
              </li>
            )}
          </React.Fragment>
        ))}
      </ol>

      <a href="#/explorer" className="cse-ftm__footer">
        Explore a real example <ExplorerIcon name="arrowRight" />
      </a>
    </section>
  );
}
