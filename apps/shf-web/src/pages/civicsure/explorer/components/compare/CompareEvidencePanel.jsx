// CompareEvidencePanel.jsx — Evidence comparison section. Carries the
// same "coverage is not performance" principle established on
// Evidence Summary — coverage describes how much of the population is
// supported by accepted evidence, not how well an entity performed.
// DEMO / FRAME DATA (see ../../compareViewMockData.js).
import React from "react";

export default function CompareEvidencePanel({ entities }) {
  return (
    <div className="cse-cmp-panel" role="tabpanel" id="cse-cmp-tabpanel-evidence" aria-labelledby="cse-cmp-tab-evidence">
      <p className="cse-cmp-panel__note">Coverage is not the same as performance.</p>

      <div className="cse-card cse-table-wrap">
        <table className="cse-table">
          <caption className="cse-visually-hidden">Evidence comparison for the selected items (demo data)</caption>
          <thead>
            <tr>
              <th scope="col">Field</th>
              {entities.map((e) => (
                <th scope="col" key={e.id}>
                  {e.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Evidence coverage</th>
              {entities.map((e) => (
                <td key={e.id}>{e.evidence.coverage}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Verified evidence count</th>
              {entities.map((e) => (
                <td key={e.id}>{e.evidence.verifiedCount}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Pending review</th>
              {entities.map((e) => (
                <td key={e.id}>{e.evidence.pendingReview}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Missing evidence</th>
              {entities.map((e) => (
                <td key={e.id}>{e.evidence.missing}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Restricted / non-public</th>
              {entities.map((e) => (
                <td key={e.id}>{e.evidence.restricted}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Last review date</th>
              {entities.map((e) => (
                <td key={e.id}>{e.evidence.lastReviewDate}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
