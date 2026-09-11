// CountyProvidersPanel.jsx — Providers tab: top providers in this
// county. DEMO / FRAME DATA (see ../../countyDetailMockData.js).
// "Explore Provider" is a REAL link to the existing Provider Detail
// frame (#/explorer/providers/:providerId) only for rows whose
// providerId matches a built demo provider — the rest render an
// inert "Not yet available" placeholder rather than a dead link, same
// convention as CivicSurePublicFooter's placeholder nav links.
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import StatusBadge from "../StatusBadge.jsx";

export default function CountyProvidersPanel({ county }) {
  return (
    <div className="cse-cty-panel" role="tabpanel" id="cse-cty-tabpanel-providers" aria-labelledby="cse-cty-tab-providers">
      <p className="cse-cty-panel__note">{county.providersShownNote}</p>

      <div className="cse-cty-provider-list" role="list" aria-label={`Providers in ${county.name} (demo data)`}>
        {county.providers.map((provider) => (
          <article className="cse-card cse-cty-provider-row" role="listitem" key={provider.providerId || provider.name}>
            <div className="cse-cty-provider-row__main">
              <h3 className="cse-cty-provider-row__title">{provider.name}</h3>
              <p className="cse-cty-provider-row__meta">
                {provider.orgType} | {provider.activePrograms} active programs
              </p>
              <p className="cse-cty-provider-row__outcomes">{provider.verifiedOutcomeSummary}</p>
              <StatusBadge state={provider.assurance} />
            </div>

            <div className="cse-cty-provider-row__aside">
              <p className="cse-cty-provider-row__funding">{provider.funding}</p>
              <p className="cse-cty-provider-row__funding-label">Funding</p>
              {provider.providerId ? (
                <a className="cse-cty-provider-row__link" href={`#/explorer/providers/${encodeURIComponent(provider.providerId)}`}>
                  Explore Provider
                  <ExplorerIcon name="chevronRight" />
                </a>
              ) : (
                <span className="cse-cty-provider-row__link cse-cty-provider-row__link--placeholder" aria-disabled="true" title="Coming soon">
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
