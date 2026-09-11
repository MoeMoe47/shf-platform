// apps/shf-web/src/pages/civicsure/explorer/CivicSureAgencyDetailPage.jsx
//
// CivicSure Agency / Department Detail — public-facing page FRAME.
//
// Scope discipline (see docs/ui/CIVICSURE_AGENCY_DETAIL_FRAME.md),
// same phase discipline as every other page in this suite: this is a
// visual/layout build only. It does not wire live GPA/CivicSure data,
// Shared Reporting, or a real assurance engine — every fact and
// status shown here comes from agencyDetailMockData.js, explicitly
// marked DEMO / FRAME DATA. This page does not implement Shared
// Reporting, Public Disclosure, Credential, Truth, Evidence, or
// Metric Registry authority, and does not touch any of those systems,
// or any operator/admin UI.
//
// Only local presentation state lives here (which tab is active,
// whether the "About this data" drawer is open) — nothing that
// reaches a backend.
import React, { useState } from "react";
import "../../../styles/civicsure-explorer.css";
import "../../../styles/civicsure-public-footer.css";
import "../../../styles/civicsure-agency-detail.css";
import CivicSurePublicNav from "../../../components/civicsure/CivicSurePublicNav.jsx";
import CivicSurePublicFooter from "../../../components/civicsure/CivicSurePublicFooter.jsx";
import AgencyDetailHeader from "./components/agency-detail/AgencyDetailHeader.jsx";
import AgencySummaryMetrics from "./components/agency-detail/AgencySummaryMetrics.jsx";
import AgencyDetailTabs from "./components/agency-detail/AgencyDetailTabs.jsx";
import AgencyOverviewPanel from "./components/agency-detail/AgencyOverviewPanel.jsx";
import AgencyProgramsPanel from "./components/agency-detail/AgencyProgramsPanel.jsx";
import AgencyFundingPanel from "./components/agency-detail/AgencyFundingPanel.jsx";
import AgencyProvidersPanel from "./components/agency-detail/AgencyProvidersPanel.jsx";
import AgencyOutcomesPanel from "./components/agency-detail/AgencyOutcomesPanel.jsx";
import AgencyEvidencePanel from "./components/agency-detail/AgencyEvidencePanel.jsx";
import AgencyReportsPanel from "./components/agency-detail/AgencyReportsPanel.jsx";
import AgencyAboutData from "./components/agency-detail/AgencyAboutData.jsx";
import { ExplorerIcon } from "./explorerIcons.jsx";
import { AGENCY_DETAIL_TABS, getAgencyDetail } from "./agencyDetailMockData.js";

const TAB_PANELS = {
  overview: AgencyOverviewPanel,
  programs: AgencyProgramsPanel,
  funding: AgencyFundingPanel,
  providers: AgencyProvidersPanel,
  outcomes: AgencyOutcomesPanel,
  evidence: AgencyEvidencePanel,
  reports: AgencyReportsPanel,
};

export default function CivicSureAgencyDetailPage({ agencyId }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [aboutDataOpen, setAboutDataOpen] = useState(false);
  const agency = getAgencyDetail(agencyId);

  if (!agency) {
    return (
      <div className="civicsure-agency-detail">
        <a className="cse-skip-link" href="#csad-main">
          Skip to main content
        </a>
        <CivicSurePublicNav activeKey="explorer" />
        <main id="csad-main">
          <div className="cse-container cse-agy-not-found">
            <h1>Agency not found</h1>
            <p>We couldn&rsquo;t find an agency matching &ldquo;{agencyId}&rdquo; in CivicSure Explorer&rsquo;s demo data.</p>
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
    <div className="civicsure-agency-detail">
      <a className="cse-skip-link" href="#csad-main">
        Skip to main content
      </a>

      <CivicSurePublicNav activeKey="explorer" />

      <AgencyDetailHeader agency={agency} onViewReports={() => setActiveTab("reports")} />

      <main id="csad-main">
        <div className="cse-container">
          <AgencySummaryMetrics agency={agency} />

          <div className="cse-agy-tabs-row">
            <AgencyDetailTabs tabs={AGENCY_DETAIL_TABS} activeKey={activeTab} onSelect={setActiveTab} />
            <button type="button" className="cse-agy-about-trigger" onClick={() => setAboutDataOpen(true)}>
              <ExplorerIcon name="infoCircle" />
              About this data
            </button>
          </div>

          <ActivePanel agency={agency} />
        </div>
      </main>

      <CivicSurePublicFooter />

      <AgencyAboutData agency={agency} open={aboutDataOpen} onClose={() => setAboutDataOpen(false)} />
    </div>
  );
}
