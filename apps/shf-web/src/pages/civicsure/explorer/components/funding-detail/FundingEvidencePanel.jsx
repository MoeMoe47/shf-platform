// FundingEvidencePanel.jsx — Evidence tab: public-safe evidence
// metadata only, never raw private records. DEMO / FRAME DATA (see
// ../../fundingDetailMockData.js).
import React from "react";
import StatusBadge from "../StatusBadge.jsx";

export default function FundingEvidencePanel({ funding }) {
  return (
    <div className="cse-fnd-panel" role="tabpanel" id="cse-fnd-tabpanel-evidence" aria-labelledby="cse-fnd-tab-evidence">
      <div className="cse-card cse-table-wrap">
        <table className="cse-table">
          <caption className="cse-visually-hidden">Evidence records for {funding.name} (demo data)</caption>
          <thead>
            <tr>
              <th scope="col">Evidence</th>
              <th scope="col">Related Program / Provider</th>
              <th scope="col">Period</th>
              <th scope="col">Covers</th>
              <th scope="col">Verification</th>
              <th scope="col">Availability</th>
              <th scope="col">Last Reviewed</th>
            </tr>
          </thead>
          <tbody>
            {funding.evidence.map((e) => (
              <tr key={e.key}>
                <th scope="row">{e.type}</th>
                <td>{e.related}</td>
                <td>{e.period}</td>
                <td>{e.covers}</td>
                <td>
                  <StatusBadge state={e.verification} />
                </td>
                <td>{e.availability}</td>
                <td>{e.lastReviewed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
