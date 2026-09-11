// CountyOutcomesPanel.jsx — Outcomes tab: outcome name, target vs.
// actual, denominator, reporting period, evidence coverage, and
// verification status. DEMO / FRAME DATA (see
// ../../countyDetailMockData.js). Every number is shown next to its
// target, denominator, and evidence coverage — never a bare,
// unexplained percentage. Reuses the shared .cse-table primitive
// (same one Provider Detail's Outcomes/Evidence tabs use).
import React from "react";
import StatusBadge from "../StatusBadge.jsx";

export default function CountyOutcomesPanel({ county }) {
  return (
    <div className="cse-cty-panel" role="tabpanel" id="cse-cty-tabpanel-outcomes" aria-labelledby="cse-cty-tab-outcomes">
      <div className="cse-card cse-table-wrap">
        <table className="cse-table">
          <caption className="cse-visually-hidden">County-wide verified outcomes for {county.name} (demo data)</caption>
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
            {county.outcomes.map((o) => (
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
