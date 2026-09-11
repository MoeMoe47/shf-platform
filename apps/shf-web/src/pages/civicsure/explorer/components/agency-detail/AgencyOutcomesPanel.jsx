// AgencyOutcomesPanel.jsx — Outcomes tab: agency-level outcomes with
// context. DEMO / FRAME DATA (see ../../agencyDetailMockData.js).
// Every number is shown next to its target, denominator, and evidence
// coverage — never a bare, unexplained percentage — and there is no
// single universal agency score.
import React from "react";
import StatusBadge from "../StatusBadge.jsx";

export default function AgencyOutcomesPanel({ agency }) {
  return (
    <div className="cse-agy-panel" role="tabpanel" id="cse-agy-tabpanel-outcomes" aria-labelledby="cse-agy-tab-outcomes">
      <div className="cse-card cse-table-wrap">
        <table className="cse-table">
          <caption className="cse-visually-hidden">Agency-level outcomes for {agency.name} (demo data)</caption>
          <thead>
            <tr>
              <th scope="col">Outcome</th>
              <th scope="col">Target</th>
              <th scope="col">Actual</th>
              <th scope="col">Denominator</th>
              <th scope="col">Reporting Period</th>
              <th scope="col">Evidence Coverage</th>
              <th scope="col">Verification</th>
            </tr>
          </thead>
          <tbody>
            {agency.outcomes.map((o) => (
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
