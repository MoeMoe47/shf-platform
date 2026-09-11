// OutcomeEvidenceCoverage.jsx — plain-language evidence coverage
// summary. Does not imply that missing evidence means the outcome
// did not occur. DEMO / FRAME DATA (see ../../outcomeDetailMockData.js).
import React from "react";

export default function OutcomeEvidenceCoverage({ coverage }) {
  return (
    <section className="cse-card cse-otc-coverage" aria-labelledby="cse-otc-coverage-heading">
      <h3 id="cse-otc-coverage-heading">Evidence Coverage</h3>
      <dl className="cse-otc-coverage__grid">
        <div>
          <dt>Total eligible participants</dt>
          <dd>{coverage.totalEligible}</dd>
        </div>
        <div>
          <dt>Participants with accepted evidence</dt>
          <dd>{coverage.withAcceptedEvidence}</dd>
        </div>
        <div>
          <dt>Coverage</dt>
          <dd>{coverage.coveragePercent}</dd>
        </div>
        <div>
          <dt>Not yet verified</dt>
          <dd>{coverage.notYetVerified}</dd>
        </div>
      </dl>
      <p className="cse-otc-coverage__explanation">{coverage.explanation}</p>
    </section>
  );
}
