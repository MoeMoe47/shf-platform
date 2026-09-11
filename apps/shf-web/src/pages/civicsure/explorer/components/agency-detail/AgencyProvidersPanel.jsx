// AgencyProvidersPanel.jsx — Providers tab: organizations this agency
// works with. DEMO / FRAME DATA (see ../../agencyDetailMockData.js).
// "Explore Provider" is a REAL link only for Community Future Network
// (the one provider with a built demo Provider Detail page); the rest
// render an inert "Not yet available" placeholder.
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import StatusBadge from "../StatusBadge.jsx";

export default function AgencyProvidersPanel({ agency }) {
  return (
    <div className="cse-agy-panel" role="tabpanel" id="cse-agy-tabpanel-providers" aria-labelledby="cse-agy-tab-providers">
      <p className="cse-agy-panel__note">{agency.providersShownNote}</p>

      <div className="cse-agy-row-list" role="list" aria-label={`Providers working with ${agency.name} (demo data)`}>
        {agency.providers.map((provider) => (
          <article className="cse-card cse-agy-row" role="listitem" key={provider.key}>
            <div className="cse-agy-row__main">
              <h3 className="cse-agy-row__title">{provider.name}</h3>
              <p className="cse-agy-row__meta">
                {provider.orgType} | {provider.activePrograms} active program
              </p>
              <p className="cse-agy-row__delivery">
                {provider.deliveryStatus} | {provider.evidenceCoverage} evidence coverage
              </p>
              <StatusBadge state={provider.assuranceStatus} />
            </div>

            <div className="cse-agy-row__aside">
              <p className="cse-agy-row__amount">{provider.contracted}</p>
              <p className="cse-agy-row__amount-label">Contracted</p>
              {provider.providerId ? (
                <a className="cse-agy-row__link" href={`#/explorer/providers/${encodeURIComponent(provider.providerId)}`}>
                  Explore Provider
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
