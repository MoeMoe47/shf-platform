// GeographySelectedAreaPanel.jsx — floating overlay card on the map
// showing the currently selected county's headline metrics. Real
// local interaction: whatever county was last clicked (a marker, a
// county-list row, or a result row) is what shows here. Only Franklin
// County has a real "View County Details" link into the already-built
// County Detail frame — every other county shows an honest "County
// Detail page coming soon" note instead of a dead link. DEMO / FRAME
// DATA (see ../../geographyExplorerMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function GeographySelectedAreaPanel({ county }) {
  if (!county) return null;

  const { metrics } = county;

  return (
    <div className="cse-geo-selected-panel" aria-label={`Selected area: ${county.name}`}>
      <h3>{county.name}</h3>
      <ul className="cse-geo-selected-panel__stats">
        <li>
          {metrics.activePrograms} Active Programs
        </li>
        <li>{metrics.totalFunding} Total Funding</li>
        <li>{metrics.providers} Providers</li>
        <li>{metrics.verifiedOutcomes} Verified Outcomes</li>
        <li>{metrics.openExceptions} Open Exceptions</li>
      </ul>

      {county.hasDetailPage ? (
        <a href={`#/explorer/counties/${encodeURIComponent(county.key)}`} className="cse-geo-selected-panel__action">
          View County Details
          <ExplorerIcon name="arrowRight" />
        </a>
      ) : (
        <span className="cse-geo-selected-panel__placeholder" aria-disabled="true" title="Coming soon">
          County Detail page coming soon
        </span>
      )}
    </div>
  );
}
