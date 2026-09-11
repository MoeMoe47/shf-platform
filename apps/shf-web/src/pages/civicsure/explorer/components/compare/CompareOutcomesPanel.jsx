// CompareOutcomesPanel.jsx — Outcomes comparison section, the most
// sensitive area in this page. Every rate is shown with its
// numerator, denominator, reporting period, methodology/version, and
// evidence coverage — never a bare percentage. When methodologies
// differ across the selection, a prominent "Not directly comparable"
// notice renders instead of any ranking. No trophy icons, no
// first/second/third ranking, no green-winner/red-loser treatment —
// every entity's actual value renders in the same neutral navy
// weight. DEMO / FRAME DATA (see ../../compareViewMockData.js).
import React from "react";
import StatusBadge from "../StatusBadge.jsx";

export default function CompareOutcomesPanel({ entities }) {
  const methodologies = entities.map((e) => `${e.outcome.methodologyName} v${e.outcome.methodologyVersion}`);
  const methodologiesDiffer = !methodologies.every((m) => m === methodologies[0]);

  return (
    <div className="cse-cmp-panel" role="tabpanel" id="cse-cmp-tabpanel-outcomes" aria-labelledby="cse-cmp-tab-outcomes">
      {methodologiesDiffer ? (
        <p className="cse-cmp-panel__warning cse-cmp-panel__warning--strong">Not directly comparable — the selected items use different outcome methodologies.</p>
      ) : null}

      <div className="cse-card cse-table-wrap">
        <table className="cse-table">
          <caption className="cse-visually-hidden">Outcomes comparison for the selected items (demo data)</caption>
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
              <th scope="row">Outcome name</th>
              {entities.map((e) => (
                <td key={e.id}>{e.outcome.name}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Target</th>
              {entities.map((e) => (
                <td key={e.id}>{e.outcome.target}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Actual</th>
              {entities.map((e) => (
                <td key={e.id} className="cse-cmp-panel__neutral-value">
                  {e.outcome.actual}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Numerator</th>
              {entities.map((e) => (
                <td key={e.id}>{e.outcome.numerator}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Denominator</th>
              {entities.map((e) => (
                <td key={e.id}>{e.outcome.denominator}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Reporting period</th>
              {entities.map((e) => (
                <td key={e.id}>{e.outcome.reportingPeriod}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Methodology / version</th>
              {entities.map((e) => (
                <td key={e.id}>
                  {e.outcome.methodologyName} v{e.outcome.methodologyVersion}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Evidence coverage</th>
              {entities.map((e) => (
                <td key={e.id}>{e.outcome.evidenceCoverage}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Verification status</th>
              {entities.map((e) => (
                <td key={e.id}>
                  <StatusBadge state={e.outcome.verificationStatus} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
