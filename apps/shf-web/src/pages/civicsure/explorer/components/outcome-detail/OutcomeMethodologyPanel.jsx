// OutcomeMethodologyPanel.jsx — Methodology tab. This is a major
// CivicSure trust surface: outcome definition, numerator/denominator
// rules, measurement window, inclusion/exclusion rules, evidence
// requirements, a plain-language calculation, and a clearly labeled
// demo verification threshold (not a production policy). DEMO / FRAME
// DATA (see ../../outcomeDetailMockData.js).
import React from "react";
import OutcomeMethodologyHistory from "./OutcomeMethodologyHistory.jsx";

export default function OutcomeMethodologyPanel({ outcome }) {
  const { methodology } = outcome;

  return (
    <div className="cse-otc-panel" role="tabpanel" id="cse-otc-tabpanel-methodology" aria-labelledby="cse-otc-tab-methodology">
      <section className="cse-card cse-otc-methodology-section">
        <h3>Outcome Definition</h3>
        <p>{methodology.outcomeDefinition}</p>
      </section>

      <div className="cse-otc-methodology-grid">
        <section className="cse-card cse-otc-methodology-section">
          <h3>Numerator Rule</h3>
          <p>{methodology.numeratorRule}</p>
        </section>
        <section className="cse-card cse-otc-methodology-section">
          <h3>Denominator Rule</h3>
          <p>{methodology.denominatorRule}</p>
        </section>
      </div>

      <section className="cse-card cse-otc-methodology-section">
        <h3>Measurement Window</h3>
        <p>{methodology.measurementWindow}</p>
      </section>

      <div className="cse-otc-methodology-grid">
        <section className="cse-card cse-otc-methodology-section">
          <h3>Inclusion Rules</h3>
          <ul className="cse-otc-methodology-list">
            {methodology.inclusionRules.map((rule, i) => (
              <li key={i}>{rule}</li>
            ))}
          </ul>
        </section>
        <section className="cse-card cse-otc-methodology-section">
          <h3>Exclusion Rules</h3>
          <ul className="cse-otc-methodology-list">
            {methodology.exclusionRules.map((rule, i) => (
              <li key={i}>{rule}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="cse-card cse-otc-methodology-section">
        <h3>Evidence Requirements</h3>
        <ul className="cse-otc-methodology-list">
          {methodology.evidenceRequirements.map((rule, i) => (
            <li key={i}>{rule}</li>
          ))}
        </ul>
      </section>

      <section className="cse-card cse-otc-methodology-section">
        <h3>Calculation</h3>
        <p className="cse-otc-formula__equation">{methodology.calculationSteps}</p>
      </section>

      <section className="cse-card cse-otc-methodology-threshold">
        <h3>Verification Threshold</h3>
        <p>{methodology.verificationThreshold}</p>
        <p className="cse-otc-methodology-threshold__disclaimer">{methodology.thresholdDisclaimer}</p>
      </section>

      <OutcomeMethodologyHistory methodology={methodology} />
    </div>
  );
}
