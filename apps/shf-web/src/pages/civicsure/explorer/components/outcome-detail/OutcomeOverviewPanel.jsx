// OutcomeOverviewPanel.jsx — Overview tab: outcome summary facts +
// "What does this mean?" + "Why this matters" + a plain-language
// formula (numerator ÷ denominator, explained in words, never shown
// as bare notation) + Limitations/Comparability on the left; the
// Verification panel, Related Assurance Report, and a compact Related
// Funding chain on the right. DEMO / FRAME DATA (see
// ../../outcomeDetailMockData.js).
import React from "react";
import StatusBadge from "../StatusBadge.jsx";
import OutcomeVerificationPanel from "./OutcomeVerificationPanel.jsx";
import OutcomeReportCard from "./OutcomeReportCard.jsx";
import OutcomeRelatedFundingPanel from "./OutcomeRelatedFundingPanel.jsx";
import OutcomeLimitationsPanel from "./OutcomeLimitationsPanel.jsx";

export default function OutcomeOverviewPanel({ outcome }) {
  const { overview, formula } = outcome;

  return (
    <div className="cse-otc-overview" role="tabpanel" id="cse-otc-tabpanel-overview" aria-labelledby="cse-otc-tab-overview">
      <div className="cse-otc-overview__main">
        <section className="cse-card cse-otc-summary">
          <h2 className="cse-otc-summary__heading">Outcome Summary</h2>
          <dl className="cse-otc-summary__grid">
            <div>
              <dt>Outcome</dt>
              <dd>{outcome.name}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{overview.category}</dd>
            </div>
            <div>
              <dt>Reporting period</dt>
              <dd>{overview.reportingPeriod}</dd>
            </div>
            <div>
              <dt>Target</dt>
              <dd>{overview.target}</dd>
            </div>
            <div>
              <dt>Actual</dt>
              <dd>{overview.actual}</dd>
            </div>
            <div>
              <dt>Difference</dt>
              <dd>{overview.difference}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge state={overview.status} />
              </dd>
            </div>
            <div>
              <dt>Denominator</dt>
              <dd>{overview.denominatorLabel}</dd>
            </div>
            <div>
              <dt>Numerator</dt>
              <dd>{overview.numeratorLabel}</dd>
            </div>
            <div>
              <dt>Evidence coverage</dt>
              <dd>{overview.evidenceCoverage}</dd>
            </div>
          </dl>

          <div className="cse-otc-summary__block">
            <h3>What does this mean?</h3>
            <p>{overview.meaning}</p>
          </div>

          <div className="cse-otc-summary__block">
            <h3>Why this matters</h3>
            <p>{overview.whyItMatters}</p>
          </div>
        </section>

        <section className="cse-card cse-otc-formula" aria-labelledby="cse-otc-formula-heading">
          <h3 id="cse-otc-formula-heading">How this number was calculated</h3>
          <p className="cse-otc-formula__equation">
            {formula.numeratorValue} verified placements ÷ {formula.denominatorValue} eligible participants = {formula.resultValue}
          </p>
          <div className="cse-otc-formula__terms">
            <div>
              <h4>{formula.numeratorLabel}</h4>
              <p>{formula.numeratorExplanation}</p>
            </div>
            <div>
              <h4>{formula.denominatorLabel}</h4>
              <p>{formula.denominatorExplanation}</p>
            </div>
          </div>
        </section>

        <OutcomeLimitationsPanel limitations={outcome.limitations} comparability={outcome.comparability} />
      </div>

      <div className="cse-otc-overview__side">
        <OutcomeVerificationPanel outcome={outcome} />
        <OutcomeReportCard report={outcome.report} />
        <OutcomeRelatedFundingPanel relatedFunding={outcome.relatedFunding} />
      </div>
    </div>
  );
}
