// EvidenceSourcesPanel.jsx — Sources tab: public-safe evidence source
// metadata only, no raw documents. Includes the Public Availability
// model explanation — availability describes what CivicSure can
// display publicly, not the underlying access authority. DEMO / FRAME
// DATA (see ../../evidenceSummaryMockData.js).
import React from "react";
import StatusBadge from "../StatusBadge.jsx";
import { PUBLIC_AVAILABILITY_EXPLANATION } from "../../evidenceSummaryMockData.js";

export default function EvidenceSourcesPanel({ evidence }) {
  return (
    <div className="cse-evs-panel" role="tabpanel" id="cse-evs-tabpanel-sources" aria-labelledby="cse-evs-tab-sources">
      <p className="cse-evs-panel__note">
        Evidence sources below show public-safe metadata only. No raw documents are exposed.
      </p>

      <div className="cse-card cse-table-wrap">
        <table className="cse-table">
          <caption className="cse-visually-hidden">Evidence sources for {evidence.name} (demo data)</caption>
          <thead>
            <tr>
              <th scope="col">Evidence Source</th>
              <th scope="col">Source Type</th>
              <th scope="col">Submitted By / Source Authority</th>
              <th scope="col">Reporting Period</th>
              <th scope="col">Records Covered</th>
              <th scope="col">Verification Status</th>
              <th scope="col">Public Availability</th>
              <th scope="col">Last Reviewed</th>
            </tr>
          </thead>
          <tbody>
            {evidence.sources.rows.map((row) => (
              <tr key={row.key}>
                <th scope="row">{row.name}</th>
                <td>{row.type}</td>
                <td>{row.source}</td>
                <td>{row.period}</td>
                <td>{row.recordsCovered}</td>
                <td>
                  <StatusBadge state={row.verification} />
                </td>
                <td>{row.availability}</td>
                <td>{row.lastReviewed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="cse-card cse-evs-availability" aria-labelledby="cse-evs-availability-heading">
        <h3 id="cse-evs-availability-heading">Public Availability Model</h3>
        <ul className="cse-evs-availability__list">
          <li>Public Summary</li>
          <li>Metadata Public</li>
          <li>Not Public</li>
          <li>Restricted (Operator Only)</li>
        </ul>
        <p className="cse-evs-availability__explanation">{PUBLIC_AVAILABILITY_EXPLANATION}</p>
      </section>
    </div>
  );
}
