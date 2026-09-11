// GeographyExplorerHeader.jsx — eyebrow/headline/supporting copy and
// the "About this data" drawer trigger. DEMO / FRAME DATA — no
// numbers live here, but see ../../geographyExplorerMockData.js for
// everything the drawer itself shows.
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function GeographyExplorerHeader({ onOpenAboutData }) {
  return (
    <div className="cse-geo-header">
      <div className="cse-container cse-geo-header__inner">
        <div className="cse-geo-header__copy">
          <p className="cse-eyebrow">GEOGRAPHY EXPLORER</p>
          <h1 className="cse-geo-header__title">See where public programs, funding, and outcomes are happening.</h1>
          <p className="cse-geo-header__body">
            Explore programs and providers across Ohio by county, community, funding, outcomes, and evidence.
          </p>
        </div>

        <button type="button" className="cse-geo-about-trigger" onClick={onOpenAboutData}>
          <ExplorerIcon name="infoCircle" />
          About this data
        </button>
      </div>
    </div>
  );
}
