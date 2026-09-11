// FundingProgramsPanel.jsx — Programs tab: programs receiving this
// funding. DEMO / FRAME DATA (see ../../fundingDetailMockData.js).
// Reuses the same funding.moneyFlow.programs branches shown in the
// Money Flow tab (one data source, not a second list to keep in
// sync). "Explore Program" is a REAL link only for Clean Energy
// Workforce Training (the one branch with a built demo Program Detail
// page); the rest render an inert "Not yet available" placeholder.
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import StatusBadge from "../StatusBadge.jsx";

export default function FundingProgramsPanel({ funding }) {
  const { moneyFlow } = funding;

  return (
    <div className="cse-fnd-panel" role="tabpanel" id="cse-fnd-tabpanel-programs" aria-labelledby="cse-fnd-tab-programs">
      <p className="cse-fnd-panel__note">{moneyFlow.programsShownNote}</p>

      <div className="cse-fnd-row-list" role="list" aria-label={`Programs funded by ${funding.name} (demo data)`}>
        {moneyFlow.programs.map((program) => (
          <article className="cse-card cse-fnd-row" role="listitem" key={program.key}>
            <div className="cse-fnd-row__main">
              <h3 className="cse-fnd-row__title">{program.name}</h3>
              <p className="cse-fnd-row__meta">
                {program.category} | {program.county}
              </p>
              <div className="cse-fnd-row__badges">
                <StatusBadge state={program.detail.status} />
                <StatusBadge state={program.outcome.detail.status}>{program.outcome.actual} outcomes</StatusBadge>
              </div>
            </div>

            <div className="cse-fnd-row__aside">
              <p className="cse-fnd-row__amount">{program.allocation}</p>
              <p className="cse-fnd-row__amount-label">Allocated | {program.provider.expended} expended</p>
              {program.programId ? (
                <a className="cse-fnd-row__link" href={`#/explorer/programs/${encodeURIComponent(program.programId)}`}>
                  Explore Program
                  <ExplorerIcon name="chevronRight" />
                </a>
              ) : (
                <span className="cse-fnd-row__link cse-fnd-row__link--placeholder" aria-disabled="true" title="Coming soon">
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
