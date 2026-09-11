// ProviderEvidencePanel.jsx — Evidence tab: public-safe evidence
// metadata only (type, related program, period, verification status,
// last updated, public availability). DEMO / FRAME DATA (see
// ../../providerDetailMockData.js). No raw private evidence content
// is shown or implied — "availability" makes explicit when a record
// is restricted to operators rather than pretending everything is
// public.
import React from "react";
import StatusBadge from "../StatusBadge.jsx";

export default function ProviderEvidencePanel({ provider }) {
  return (
    <div className="cse-pvd-panel" role="tabpanel" id="cse-pvd-tabpanel-evidence" aria-labelledby="cse-pvd-tab-evidence">
      <div className="cse-card cse-table-wrap">
        <table className="cse-table">
          <caption className="cse-visually-hidden">Evidence records for {provider.name} (demo data)</caption>
          <thead>
            <tr>
              <th scope="col">Evidence Type</th>
              <th scope="col">Related Program</th>
              <th scope="col">Period</th>
              <th scope="col">Verification</th>
              <th scope="col">Last Updated</th>
              <th scope="col">Availability</th>
            </tr>
          </thead>
          <tbody>
            {provider.evidence.map((e) => (
              <tr key={e.key}>
                <th scope="row">{e.type}</th>
                <td>{e.relatedProgram}</td>
                <td>{e.period}</td>
                <td>
                  <StatusBadge state={e.verification} />
                </td>
                <td>{e.lastUpdated}</td>
                <td>{e.availability}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
