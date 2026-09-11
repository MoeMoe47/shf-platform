// OutcomeEvidencePanel.jsx — Evidence tab: public-safe evidence
// metadata only, no names, PII, case records, wage details, or
// private documents. One row is explicitly "Restricted (Operator
// Only)" to show not everything is public, same convention as Funding
// Detail's Evidence tab. DEMO / FRAME DATA (see
// ../../outcomeDetailMockData.js).
import React from "react";
import StatusBadge from "../StatusBadge.jsx";
import OutcomeEvidenceCoverage from "./OutcomeEvidenceCoverage.jsx";

export default function OutcomeEvidencePanel({ outcome }) {
  const { evidence } = outcome;

  return (
    <div className="cse-otc-panel" role="tabpanel" id="cse-otc-tabpanel-evidence" aria-labelledby="cse-otc-tab-evidence">
      <p className="cse-otc-panel__note">
        Evidence records below show public-safe metadata only. No participant names, PII, case records, wage details, or private
        documents are shown.
      </p>

      <div className="cse-card cse-table-wrap">
        <table className="cse-table">
          <caption className="cse-visually-hidden">Evidence supporting the {outcome.name} outcome (demo data)</caption>
          <thead>
            <tr>
              <th scope="col">Evidence Type</th>
              <th scope="col">Source</th>
              <th scope="col">Reporting Period</th>
              <th scope="col">Records Covered</th>
              <th scope="col">Verification Status</th>
              <th scope="col">Public Availability</th>
              <th scope="col">Last Reviewed</th>
            </tr>
          </thead>
          <tbody>
            {evidence.rows.map((row) => (
              <tr key={row.key}>
                <th scope="row">{row.type}</th>
                <td>{row.source}</td>
                <td>{row.period}</td>
                <td>{row.recordsCovered}</td>
                <td>
                  <StatusBadge state={row.verification} />
                </td>
                <td>{row.availability}</td>
                <td>{row.lastReviewed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <OutcomeEvidenceCoverage coverage={evidence.coverage} />
    </div>
  );
}
