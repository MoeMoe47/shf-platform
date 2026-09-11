// AgencyProgramsPanel.jsx — Programs tab: programs this agency
// oversees. DEMO / FRAME DATA (see ../../agencyDetailMockData.js).
// "Explore Program" is a REAL link only for Clean Energy Workforce
// Training (the one program with a built demo Program Detail page);
// the rest render an inert "Not yet available" placeholder.
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import StatusBadge from "../StatusBadge.jsx";

export default function AgencyProgramsPanel({ agency }) {
  return (
    <div className="cse-agy-panel" role="tabpanel" id="cse-agy-tabpanel-programs" aria-labelledby="cse-agy-tab-programs">
      <p className="cse-agy-panel__note">{agency.programsShownNote}</p>

      <div className="cse-agy-row-list" role="list" aria-label={`Programs overseen by ${agency.name} (demo data)`}>
        {agency.programs.map((program) => (
          <article className="cse-card cse-agy-row" role="listitem" key={program.key}>
            <div className="cse-agy-row__main">
              <h3 className="cse-agy-row__title">{program.name}</h3>
              <p className="cse-agy-row__meta">
                {program.category} | {program.county} | {program.providerCount} provider
              </p>
              <div className="cse-agy-row__badges">
                <StatusBadge state={program.assuranceStatus} />
                <span className="cse-agy-row__outcome">{program.outcomeSummary}</span>
              </div>
            </div>

            <div className="cse-agy-row__aside">
              <p className="cse-agy-row__amount">{program.funding}</p>
              <p className="cse-agy-row__amount-label">Funding</p>
              {program.programId ? (
                <a className="cse-agy-row__link" href={`#/explorer/programs/${encodeURIComponent(program.programId)}`}>
                  Explore Program
                  <ExplorerIcon name="chevronRight" />
                </a>
              ) : (
                <span className="cse-agy-row__link cse-agy-row__link--placeholder" aria-disabled="true" title="Coming soon">
                  Not yet available
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
