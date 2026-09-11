// apps/shf-web/src/pages/civicsure/explorer/CivicSureCountyDetailPage.jsx
//
// CivicSure County Detail — public-facing page FRAME.
//
// Scope discipline (see docs/ui/CIVICSURE_COUNTY_DETAIL_FRAME.md),
// same phase discipline as CivicSureExplorerPage.jsx,
// CivicSureProgramDetailPage.jsx, and CivicSureProviderDetailPage.jsx:
// this is a visual/layout build only. It does not wire live GPA/
// CivicSure backend data, real funding/outcome/evidence/assurance
// records, or a real assurance engine — every fact and number shown
// here comes from countyDetailMockData.js, explicitly marked DEMO /
// FRAME DATA. This page does not implement Shared Reporting, Public
// Disclosure, Credential, Truth, or Evidence authority, and does not
// touch any of those systems, or any operator/admin UI.
//
// Only local presentation state lives here (which tab is active,
// whether the "About this data" drawer is open) — nothing that
// reaches a backend.
import React, { useState } from "react";
import "../../../styles/civicsure-explorer.css";
import "../../../styles/civicsure-public-footer.css";
import "../../../styles/civicsure-county-detail.css";
import CivicSurePublicNav from "../../../components/civicsure/CivicSurePublicNav.jsx";
import CivicSurePublicFooter from "../../../components/civicsure/CivicSurePublicFooter.jsx";
import CountyDetailHeader from "./components/county-detail/CountyDetailHeader.jsx";
import CountySummaryMetrics from "./components/county-detail/CountySummaryMetrics.jsx";
import CountyDetailTabs from "./components/county-detail/CountyDetailTabs.jsx";
import CountyOverviewPanel from "./components/county-detail/CountyOverviewPanel.jsx";
import CountyProgramsPanel from "./components/county-detail/CountyProgramsPanel.jsx";
import CountyFundingPanel from "./components/county-detail/CountyFundingPanel.jsx";
import CountyProvidersPanel from "./components/county-detail/CountyProvidersPanel.jsx";
import CountyOutcomesPanel from "./components/county-detail/CountyOutcomesPanel.jsx";
import CountyEvidencePanel from "./components/county-detail/CountyEvidencePanel.jsx";
import CountyAboutData from "./components/county-detail/CountyAboutData.jsx";
import { ExplorerIcon } from "./explorerIcons.jsx";
import { COUNTY_DETAIL_TABS, getCountyDetail } from "./countyDetailMockData.js";

const TAB_PANELS = {
  overview: CountyOverviewPanel,
  programs: CountyProgramsPanel,
  funding: CountyFundingPanel,
  providers: CountyProvidersPanel,
  outcomes: CountyOutcomesPanel,
  evidence: CountyEvidencePanel,
};

export default function CivicSureCountyDetailPage({ countyId }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [aboutDataOpen, setAboutDataOpen] = useState(false);
  const county = getCountyDetail(countyId);

  if (!county) {
    return (
      <div className="civicsure-county-detail">
        <a className="cse-skip-link" href="#csctd-main">
          Skip to main content
        </a>
        <CivicSurePublicNav activeKey="explorer" />
        <main id="csctd-main">
          <div className="cse-container cse-cty-not-found">
            <h1>County not found</h1>
            <p>We couldn&rsquo;t find a county matching &ldquo;{countyId}&rdquo; in CivicSure Explorer&rsquo;s demo data.</p>
            <a className="cse-btn cse-btn--primary" href="#/explorer">
              Back to Explorer
            </a>
          </div>
        </main>
        <CivicSurePublicFooter />
      </div>
    );
  }

  const ActivePanel = TAB_PANELS[activeTab];

  return (
    <div className="civicsure-county-detail">
      <a className="cse-skip-link" href="#csctd-main">
        Skip to main content
      </a>

      <CivicSurePublicNav activeKey="explorer" />

      <CountyDetailHeader county={county} />

      <main id="csctd-main">
        <div className="cse-container">
          <CountySummaryMetrics county={county} />

          <div className="cse-cty-tabs-row">
            <CountyDetailTabs tabs={COUNTY_DETAIL_TABS} activeKey={activeTab} onSelect={setActiveTab} />
            <button type="button" className="cse-cty-about-trigger" onClick={() => setAboutDataOpen(true)}>
              <ExplorerIcon name="infoCircle" />
              About this data
            </button>
          </div>

          <ActivePanel county={county} onNavigateTab={setActiveTab} />
        </div>
      </main>

      <CivicSurePublicFooter />

      <CountyAboutData county={county} open={aboutDataOpen} onClose={() => setAboutDataOpen(false)} />
    </div>
  );
}
