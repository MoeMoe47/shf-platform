// FundingOutcomesPanel.jsx — Outcomes tab: the outcome chain from
// training completion through employment retention. DEMO / FRAME DATA
// (see ../../fundingDetailMockData.js). No universal performance
// score — each outcome keeps its own target/actual/denominator so a
// percentage never appears without context. "Methodology" opens the
// existing "About this data" drawer (real interaction, not a second
// drawer) rather than duplicating methodology text per row.
import React from "react";
import StatusBadge from "../StatusBadge.jsx";

export default function FundingOutcomesPanel({ funding, onOpenAboutData }) {
  return (
    <div className="cse-fnd-panel" role="tabpanel" id="cse-fnd-tabpanel-outcomes" aria-labelledby="cse-fnd-tab-outcomes">
      <div className="cse-card cse-table-wrap">
        <table className="cse-table">
          <caption className="cse-visually-hidden">Outcome chain for {funding.name} (demo data)</caption>
          <thead>
            <tr>
              <th scope="col">Outcome</th>
              <th scope="col">Target</th>
              <th scope="col">Actual</th>
              <th scope="col">Denominator</th>
              <th scope="col">Reporting Period</th>
              <th scope="col">Evidence Coverage</th>
              <th scope="col">Verification</th>
              <th scope="col">
                <span className="cse-visually-hidden">Methodology</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {funding.outcomes.map((o) => (
              <tr key={o.key}>
                <th scope="row">{o.name}</th>
                <td>{o.target}</td>
                <td>{o.actual}</td>
                <td>{o.denominator}</td>
                <td>{o.period}</td>
                <td>{o.evidenceCoverage}</td>
                <td>
                  <StatusBadge state={o.verification} />
                </td>
                <td>
                  <button type="button" className="cse-fnd-outcomes__methodology" onClick={onOpenAboutData}>
                    Methodology
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
