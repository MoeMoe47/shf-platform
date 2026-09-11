// CompareAssurancePanel.jsx — Assurance comparison section. Each
// entity's assurance status renders independently via StatusBadge;
// there is no universal assurance score or composite ranking across
// entities. DEMO / FRAME DATA (see ../../compareViewMockData.js).
import React from "react";
import StatusBadge from "../StatusBadge.jsx";

export default function CompareAssurancePanel({ entities }) {
  return (
    <div className="cse-cmp-panel" role="tabpanel" id="cse-cmp-tabpanel-assurance" aria-labelledby="cse-cmp-tab-assurance">
      <div className="cse-card cse-table-wrap">
        <table className="cse-table">
          <caption className="cse-visually-hidden">Assurance comparison for the selected items (demo data)</caption>
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
              <th scope="row">Reporting status</th>
              {entities.map((e) => (
                <td key={e.id}>
                  <StatusBadge state={e.assurance.reportingStatus} />
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Reconciliation status</th>
              {entities.map((e) => (
                <td key={e.id}>
                  <StatusBadge state={e.assurance.reconciliationStatus} />
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Evidence status</th>
              {entities.map((e) => (
                <td key={e.id}>
                  <StatusBadge state={e.assurance.evidenceStatus} />
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Open exceptions</th>
              {entities.map((e) => (
                <td key={e.id}>{e.assurance.openExceptions}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Corrective actions</th>
              {entities.map((e) => (
                <td key={e.id}>{e.assurance.correctiveActions}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Last CivicSure evaluation</th>
              {entities.map((e) => (
                <td key={e.id}>{e.assurance.lastEvaluationDate}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
