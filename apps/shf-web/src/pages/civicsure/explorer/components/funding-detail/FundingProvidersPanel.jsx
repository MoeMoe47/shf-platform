// FundingProvidersPanel.jsx — Providers tab: organizations receiving
// these funds. DEMO / FRAME DATA (see ../../fundingDetailMockData.js).
// "Explore Provider" is a REAL link only for Community Future Network
// (the one provider with a built demo Provider Detail page); the rest
// render an inert "Not yet available" placeholder.
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import StatusBadge from "../StatusBadge.jsx";

export default function FundingProvidersPanel({ funding }) {
  const { moneyFlow } = funding;

  return (
    <div className="cse-fnd-panel" role="tabpanel" id="cse-fnd-tabpanel-providers" aria-labelledby="cse-fnd-tab-providers">
      <p className="cse-fnd-panel__note">{moneyFlow.programsShownNote.replace("programs", "providers")}</p>

      <div className="cse-fnd-row-list" role="list" aria-label={`Providers funded by ${funding.name} (demo data)`}>
        {moneyFlow.programs.map((program) => {
          const provider = program.provider;
          return (
            <article className="cse-card cse-fnd-row" role="listitem" key={program.key}>
              <div className="cse-fnd-row__main">
                <h3 className="cse-fnd-row__title">{provider.name}</h3>
                <p className="cse-fnd-row__meta">
                  {provider.orgType} | {program.name}
                </p>
                <p className="cse-fnd-row__delivery">
                  {program.delivery.actual} delivered | {provider.evidenceCoverage} evidence coverage
                </p>
                <StatusBadge state={provider.assuranceStatus} />
              </div>

              <div className="cse-fnd-row__aside">
                <p className="cse-fnd-row__amount">{provider.contracted}</p>
                <p className="cse-fnd-row__amount-label">Contracted | {provider.expended} expended</p>
                {provider.providerId ? (
                  <a className="cse-fnd-row__link" href={`#/explorer/providers/${encodeURIComponent(provider.providerId)}`}>
                    Explore Provider
                    <ExplorerIcon name="chevronRight" />
                  </a>
                ) : (
                  <span className="cse-fnd-row__link cse-fnd-row__link--placeholder" aria-disabled="true" title="Coming soon">
                    Not yet available
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
