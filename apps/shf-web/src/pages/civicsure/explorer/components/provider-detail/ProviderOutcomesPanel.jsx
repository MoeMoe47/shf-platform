// ProviderOutcomesPanel.jsx — Outcomes tab: outcome name, target vs.
// actual, reporting period, evidence coverage, and verification
// status. DEMO / FRAME DATA (see ../../providerDetailMockData.js).
// Every number is shown next to its target and evidence coverage —
// never a bare, unexplained percentage.
import React from "react";
import StatusBadge from "../StatusBadge.jsx";

export default function ProviderOutcomesPanel({ provider }) {
  return (
    <div className="cse-pvd-panel" role="tabpanel" id="cse-pvd-tabpanel-outcomes" aria-labelledby="cse-pvd-tab-outcomes">
      <div className="cse-card cse-table-wrap">
        <table className="cse-table">
          <caption className="cse-visually-hidden">Verified outcomes for {provider.name} (demo data)</caption>
          <thead>
            <tr>
              <th scope="col">Outcome</th>
              <th scope="col">Target</th>
              <th scope="col">Actual</th>
              <th scope="col">Reporting Period</th>
              <th scope="col">Evidence Coverage</th>
              <th scope="col">Verification</th>
            </tr>
          </thead>
          <tbody>
            {provider.outcomes.map((o) => (
              <tr key={o.key}>
                <th scope="row">{o.name}</th>
                <td>{o.target}</td>
                <td>{o.actual}</td>
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
