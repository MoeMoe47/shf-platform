// CompareFundingPanel.jsx — Funding comparison section. Reuses the
// same plain-language accounting term definitions established in
// Funding Detail (FINANCIAL_TERM_DEFINITIONS) rather than redefining
// them a fourth time. Shows a scope-mismatch warning whenever the
// selected entities use different funding types or reporting periods.
// DEMO / FRAME DATA (see ../../compareViewMockData.js).
import React from "react";
import { FINANCIAL_TERM_DEFINITIONS } from "../../fundingDetailMockData.js";

function allEqual(values) {
  return values.every((v) => v === values[0]);
}

export default function CompareFundingPanel({ entities }) {
  const fundingTypes = entities.map((e) => e.comparability.fundingType);
  const periods = entities.map((e) => e.funding.reportingPeriod);
  const scopesDiffer = !allEqual(fundingTypes) || !allEqual(periods);

  return (
    <div className="cse-cmp-panel" role="tabpanel" id="cse-cmp-tabpanel-funding" aria-labelledby="cse-cmp-tab-funding">
      {scopesDiffer ? (
        <p className="cse-cmp-panel__warning">
          These funding values represent different scopes and should not be interpreted as directly equivalent.
        </p>
      ) : null}

      <div className="cse-card cse-table-wrap">
        <table className="cse-table">
          <caption className="cse-visually-hidden">Funding comparison for the selected items (demo data)</caption>
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
              <th scope="row">
                Authorized
                <span className="cse-cmp-panel__term-def">{FINANCIAL_TERM_DEFINITIONS.authorized}</span>
              </th>
              {entities.map((e) => (
                <td key={e.id}>{e.funding.authorized}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">
                Obligated
                <span className="cse-cmp-panel__term-def">{FINANCIAL_TERM_DEFINITIONS.obligated}</span>
              </th>
              {entities.map((e) => (
                <td key={e.id}>{e.funding.obligated}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">
                Expended
                <span className="cse-cmp-panel__term-def">{FINANCIAL_TERM_DEFINITIONS.expended}</span>
              </th>
              {entities.map((e) => (
                <td key={e.id}>{e.funding.expended}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">
                Remaining
                <span className="cse-cmp-panel__term-def">{FINANCIAL_TERM_DEFINITIONS.remaining}</span>
              </th>
              {entities.map((e) => (
                <td key={e.id}>{e.funding.remaining}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Funding source</th>
              {entities.map((e) => (
                <td key={e.id}>{e.funding.fundingSource}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Reporting period</th>
              {entities.map((e) => (
                <td key={e.id}>{e.funding.reportingPeriod}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
