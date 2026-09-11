// CompareDeliveryPanel.jsx — Delivery comparison section. When the
// selected entities use different delivery measures (e.g.
// "Participants Trained" vs "Housing Placements"), this shows an
// explicit "Different delivery measures" notice instead of forcing
// unrelated numbers into one ranking. DEMO / FRAME DATA (see
// ../../compareViewMockData.js).
import React from "react";

export default function CompareDeliveryPanel({ entities }) {
  const measures = entities.map((e) => `${e.delivery.measureLabel} (${e.delivery.unit})`);
  const measuresDiffer = !measures.every((m) => m === measures[0]);

  return (
    <div className="cse-cmp-panel" role="tabpanel" id="cse-cmp-tabpanel-delivery" aria-labelledby="cse-cmp-tab-delivery">
      {measuresDiffer ? <p className="cse-cmp-panel__warning">Different delivery measures</p> : null}

      <div className="cse-card cse-table-wrap">
        <table className="cse-table">
          <caption className="cse-visually-hidden">Delivery comparison for the selected items (demo data)</caption>
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
              <th scope="row">Delivery measure</th>
              {entities.map((e) => (
                <td key={e.id}>{e.delivery.measureLabel}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Target</th>
              {entities.map((e) => (
                <td key={e.id}>{e.delivery.target}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Actual</th>
              {entities.map((e) => (
                <td key={e.id}>{e.delivery.actual}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Unit</th>
              {entities.map((e) => (
                <td key={e.id}>{e.delivery.unit}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Reporting period</th>
              {entities.map((e) => (
                <td key={e.id}>{e.delivery.reportingPeriod}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Evidence coverage</th>
              {entities.map((e) => (
                <td key={e.id}>{e.delivery.evidenceCoverage}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
