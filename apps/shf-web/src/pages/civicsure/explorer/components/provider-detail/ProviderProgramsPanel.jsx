// ProviderProgramsPanel.jsx — Programs tab: programs this provider
// operates. DEMO / FRAME DATA (see ../../providerDetailMockData.js).
// "Explore Program" is a REAL link to the existing Program Detail
// frame (#/explorer/programs/:programId) — provider.programs[].programId
// values are chosen to match ids already defined in
// civicsureExplorerMockData.js / programDetailMockData.js, so this is
// genuine cross-page navigation, not a placeholder.
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function ProviderProgramsPanel({ provider }) {
  return (
    <div className="cse-pvd-panel" role="tabpanel" id="cse-pvd-tabpanel-programs" aria-labelledby="cse-pvd-tab-programs">
      <p className="cse-pvd-panel__note">{provider.programsShownNote}</p>

      <div className="cse-pvd-program-list" role="list" aria-label={`Programs operated by ${provider.name} (demo data)`}>
        {provider.programs.map((program) => (
          <article className="cse-card cse-pvd-program-row" role="listitem" key={program.programId}>
            <div className="cse-pvd-program-row__main">
              <div className="cse-pvd-program-row__title-row">
                <h3 className="cse-pvd-program-row__title">{program.name}</h3>
                <span className="cse-pill">{program.status}</span>
              </div>
              <p className="cse-pvd-program-row__meta">
                {program.category} | {program.county}
              </p>
              <p className="cse-pvd-program-row__outcomes">{program.verifiedOutcomeSummary}</p>
            </div>

            <div className="cse-pvd-program-row__aside">
              <p className="cse-pvd-program-row__funding">{program.funding}</p>
              <p className="cse-pvd-program-row__funding-label">Funding</p>
              <a className="cse-pvd-program-row__link" href={`#/explorer/programs/${encodeURIComponent(program.programId)}`}>
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
