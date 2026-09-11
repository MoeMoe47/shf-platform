// CompareMethodologyPanel.jsx — Methodology comparison section. Shows
// each selected entity's methodology name/version/effective date/
// measurement window/numerator rule/denominator rule/evidence
// threshold, then visually highlights the specific mismatch when
// methodologies differ — the same "Program A / Program B / Result"
// format called for by the brief. DEMO / FRAME DATA (see
// ../../compareViewMockData.js).
import React from "react";

export default function CompareMethodologyPanel({ entities }) {
  const methodologies = entities.map((e) => `${e.methodology.name} v${e.methodology.version}`);
  const methodologiesDiffer = !methodologies.every((m) => m === methodologies[0]);

  return (
    <div className="cse-cmp-panel" role="tabpanel" id="cse-cmp-tabpanel-methodology" aria-labelledby="cse-cmp-tab-methodology">
      <div className="cse-card cse-table-wrap">
        <table className="cse-table">
          <caption className="cse-visually-hidden">Methodology comparison for the selected items (demo data)</caption>
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
              <th scope="row">Methodology name</th>
              {entities.map((e) => (
                <td key={e.id}>{e.methodology.name}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Version</th>
              {entities.map((e) => (
                <td key={e.id}>{e.methodology.version}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Effective date</th>
              {entities.map((e) => (
                <td key={e.id}>{e.methodology.effectiveDate}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Measurement window</th>
              {entities.map((e) => (
                <td key={e.id}>{e.methodology.measurementWindow}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Numerator rule</th>
              {entities.map((e) => (
                <td key={e.id}>{e.methodology.numeratorRule}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Denominator rule</th>
              {entities.map((e) => (
                <td key={e.id}>{e.methodology.denominatorRule}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Evidence threshold</th>
              {entities.map((e) => (
                <td key={e.id}>{e.methodology.evidenceThreshold}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {methodologiesDiffer ? (
        <section className="cse-card cse-cmp-methodology-mismatch" aria-labelledby="cse-cmp-methodology-mismatch-heading">
          <h3 id="cse-cmp-methodology-mismatch-heading">Methodology mismatch</h3>
          <dl className="cse-cmp-methodology-mismatch__list">
            {entities.map((e) => (
              <div key={e.id}>
                <dt>{e.name}</dt>
                <dd>
                  {e.methodology.name} v{e.methodology.version} — {e.methodology.measurementWindow}
                </dd>
              </div>
            ))}
          </dl>
          <p className="cse-cmp-methodology-mismatch__result">
            <strong>Result:</strong> Not directly comparable
          </p>
        </section>
      ) : null}
    </div>
  );
}
