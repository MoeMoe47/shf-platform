// OutcomeRelatedProgramsPanel.jsx — Related Programs tab: programs
// that produced this outcome, plus compact Related Funding and
// Related Provider connections. "Explore Program"/"Explore Provider"
// are REAL links only where a matching demo detail page exists
// (Clean Energy Workforce Training / Community Future Network) — same
// real-vs-placeholder convention as every other page in this suite.
// DEMO / FRAME DATA (see ../../outcomeDetailMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import StatusBadge from "../StatusBadge.jsx";
import OutcomeRelatedFundingPanel from "./OutcomeRelatedFundingPanel.jsx";

export default function OutcomeRelatedProgramsPanel({ outcome }) {
  const { relatedPrograms, relatedFunding, relatedProvider } = outcome;

  return (
    <div className="cse-otc-panel" role="tabpanel" id="cse-otc-tabpanel-related-programs" aria-labelledby="cse-otc-tab-related-programs">
      <p className="cse-otc-panel__note">{relatedPrograms.note}</p>

      <div className="cse-card cse-table-wrap">
        <table className="cse-table">
          <caption className="cse-visually-hidden">Programs contributing to the {outcome.name} outcome (demo data)</caption>
          <thead>
            <tr>
              <th scope="col">Program</th>
              <th scope="col">Provider</th>
              <th scope="col">Eligible Participants</th>
              <th scope="col">Verified Placements</th>
              <th scope="col">Outcome Rate</th>
              <th scope="col">Evidence Coverage</th>
              <th scope="col">Status</th>
              <th scope="col">
                <span className="cse-visually-hidden">Explore</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {relatedPrograms.rows.map((row) => (
              <tr key={row.key}>
                <th scope="row">{row.program}</th>
                <td>{row.provider}</td>
                <td>{row.eligibleParticipants}</td>
                <td>{row.verifiedPlacements}</td>
                <td>{row.outcomeRate}</td>
                <td>{row.evidenceCoverage}</td>
                <td>
                  <StatusBadge state={row.status} />
                </td>
                <td>
                  {row.programId ? (
                    <a className="cse-otc-related-programs__link" href={`#/explorer/programs/${encodeURIComponent(row.programId)}`}>
                      Explore Program
                      <ExplorerIcon name="chevronRight" />
                    </a>
                  ) : (
                    <span className="cse-otc-related-programs__link cse-otc-related-programs__link--placeholder" aria-disabled="true" title="Coming soon">
                      Not yet available
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cse-otc-related-grid">
        <OutcomeRelatedFundingPanel relatedFunding={relatedFunding} />

        <section className="cse-card cse-otc-related-provider" aria-labelledby="cse-otc-related-provider-heading">
          <h3 id="cse-otc-related-provider-heading">Related Provider</h3>
          <p className="cse-otc-related-provider__name">{relatedProvider.name}</p>
          {relatedProvider.providerId ? (
            <a className="cse-otc-related-provider__action" href={`#/explorer/providers/${encodeURIComponent(relatedProvider.providerId)}`}>
              View provider
              <ExplorerIcon name="arrowRight" />
            </a>
          ) : (
            <span className="cse-otc-related-provider__action cse-otc-related-provider__action--placeholder" aria-disabled="true" title="Coming soon">
              Not yet available
            </span>
          )}
        </section>
      </div>
    </div>
  );
}
