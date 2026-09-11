// CountyProgramsPanel.jsx — Programs tab: county-scoped program list.
// DEMO / FRAME DATA (see ../../countyDetailMockData.js). "Explore
// Program" is a REAL link to the existing Program Detail frame
// (#/explorer/programs/:programId) for every row here — all four
// demo programs already have a built detail page, so this is genuine
// cross-page navigation, not a placeholder.
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import StatusBadge from "../StatusBadge.jsx";

export default function CountyProgramsPanel({ county }) {
  return (
    <div className="cse-cty-panel" role="tabpanel" id="cse-cty-tabpanel-programs" aria-labelledby="cse-cty-tab-programs">
      <p className="cse-cty-panel__note">{county.programsShownNote}</p>

      <div className="cse-cty-program-list" role="list" aria-label={`Programs in ${county.name} (demo data)`}>
        {county.programs.map((program) => (
          <article className="cse-card cse-cty-program-row" role="listitem" key={program.programId}>
            <div className="cse-cty-program-row__main">
              <h3 className="cse-cty-program-row__title">{program.name}</h3>
              <p className="cse-cty-program-row__meta">
                {program.category} | {program.provider}
              </p>
              <div className="cse-cty-program-row__badges">
                <StatusBadge state={program.assurance} />
                <StatusBadge state={program.evidence} />
              </div>
            </div>

            <div className="cse-cty-program-row__aside">
              <p className="cse-cty-program-row__funding">{program.funding}</p>
              <p className="cse-cty-program-row__funding-label">Funding</p>
              <a className="cse-cty-program-row__link" href={`#/explorer/programs/${encodeURIComponent(program.programId)}`}>
                Explore Program
                <ExplorerIcon name="chevronRight" />
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
