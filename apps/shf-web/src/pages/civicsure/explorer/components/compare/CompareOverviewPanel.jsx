// CompareOverviewPanel.jsx — Overview comparison section. Side-by-side
// rows for identity fields only — no composite score, per the locked
// non-ranking UX principle. DEMO / FRAME DATA (see
// ../../compareViewMockData.js).
import React from "react";
import StatusBadge from "../StatusBadge.jsx";

export default function CompareOverviewPanel({ entities }) {
  return (
    <div className="cse-cmp-panel" role="tabpanel" id="cse-cmp-tabpanel-overview" aria-labelledby="cse-cmp-tab-overview">
      <div className="cse-card cse-table-wrap">
        <table className="cse-table">
          <caption className="cse-visually-hidden">Overview comparison for the selected items (demo data)</caption>
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
              <th scope="row">Entity type</th>
              {entities.map((e) => (
                <td key={e.id}>{e.entityTypeLabel}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Category</th>
              {entities.map((e) => (
                <td key={e.id}>{e.category}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Geography</th>
              {entities.map((e) => (
                <td key={e.id}>{e.geography}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Provider / responsible organization</th>
              {entities.map((e) => (
                <td key={e.id}>{e.organization}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Reporting period</th>
              {entities.map((e) => (
                <td key={e.id}>{e.reportingPeriod}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Active status</th>
              {entities.map((e) => (
                <td key={e.id}>
                  <StatusBadge state={e.activeStatus} />
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Total funding</th>
              {entities.map((e) => (
                <td key={e.id}>{e.totalFunding}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Evidence coverage</th>
              {entities.map((e) => (
                <td key={e.id}>{e.evidenceCoveragePercent}%</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Open exceptions</th>
              {entities.map((e) => (
                <td key={e.id}>{e.openExceptions}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
