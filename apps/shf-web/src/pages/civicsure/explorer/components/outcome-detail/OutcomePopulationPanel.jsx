// OutcomePopulationPanel.jsx — Population tab: how the denominator is
// constructed. Uses a simple step-down card list rather than a funnel
// visual, since a funnel graphic can imply a causal drop-off this
// data does not support — each step is just a count of participants
// excluded for a distinct, named reason. DEMO / FRAME DATA (see
// ../../outcomeDetailMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function OutcomePopulationPanel({ outcome }) {
  const { population } = outcome;

  return (
    <div className="cse-otc-panel" role="tabpanel" id="cse-otc-tabpanel-population" aria-labelledby="cse-otc-tab-population">
      <section className="cse-card cse-otc-population-steps" aria-labelledby="cse-otc-population-steps-heading">
        <h3 id="cse-otc-population-steps-heading">How the denominator was constructed</h3>
        <ol className="cse-otc-population-steps__list">
          {population.steps.map((step, i) => (
            <React.Fragment key={step.key}>
              <li className={`cse-otc-population-step${step.isResult ? " cse-otc-population-step--result" : ""}`}>
                <span className="cse-otc-population-step__label">{step.label}</span>
                <span className="cse-otc-population-step__value">{step.value}</span>
              </li>
              {i < population.steps.length - 1 ? (
                <li className="cse-otc-population-step__arrow" aria-hidden="true">
                  <ExplorerIcon name="arrowRight" />
                </li>
              ) : null}
            </React.Fragment>
          ))}
        </ol>
      </section>

      <section className="cse-card cse-otc-population-breakdown" aria-labelledby="cse-otc-population-breakdown-heading">
        <h3 id="cse-otc-population-breakdown-heading">Eligible Participants by County</h3>
        <ul className="cse-otc-population-breakdown__list">
          {population.breakdown.map((b) => (
            <li key={b.key}>
              <span>{b.label}</span>
              <strong>{b.value}</strong>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
