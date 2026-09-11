// FundingDeliveryPanel.jsx — Delivery tab: target vs. actual for what
// funded organizations were expected to deliver. DEMO / FRAME DATA
// (see ../../fundingDetailMockData.js). Every number carries units
// and a reporting period — never a bare figure.
import React from "react";
import StatusBadge from "../StatusBadge.jsx";

export default function FundingDeliveryPanel({ funding }) {
  return (
    <div className="cse-fnd-panel" role="tabpanel" id="cse-fnd-tabpanel-delivery" aria-labelledby="cse-fnd-tab-delivery">
      <div className="cse-card cse-table-wrap">
        <table className="cse-table">
          <caption className="cse-visually-hidden">Delivery targets vs. actuals for {funding.name} (demo data)</caption>
          <thead>
            <tr>
              <th scope="col">Delivery Item</th>
              <th scope="col">Target</th>
              <th scope="col">Actual</th>
              <th scope="col">Reporting Period</th>
              <th scope="col">Evidence Coverage</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {funding.delivery.map((d) => (
              <tr key={d.key}>
                <th scope="row">{d.label}</th>
                <td>{d.target}</td>
                <td>{d.actual}</td>
                <td>{d.period}</td>
                <td>{d.evidenceCoverage}</td>
                <td>
                  <StatusBadge state={d.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
