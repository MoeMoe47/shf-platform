// apps/shf-web/src/pages/civicsure/explorer/CivicSureFundingDetailPage.jsx
//
// CivicSure Funding Detail / Follow the Money — public-facing page
// FRAME.
//
// Scope discipline (see docs/ui/CIVICSURE_FUNDING_DETAIL_FRAME.md),
// same phase discipline as every other page in this suite: this is a
// visual/layout build only. It does not wire live GPA/CivicSure data,
// Shared Reporting, a real assurance engine, or real financial
// records — every fact, node, and status shown here comes from
// fundingDetailMockData.js, explicitly marked DEMO / FRAME DATA. This
// page does not implement Shared Reporting, Public Disclosure,
// Credential, Truth, Evidence, or Metric Registry authority, and does
// not touch any of those systems, or any operator/admin UI.
//
// Only local presentation state lives here (which tab is active,
// which Money Flow node/program branch is selected, whether the
// "About this data" drawer is open) — nothing that reaches a backend.
import React, { useState } from "react";
import "../../../styles/civicsure-explorer.css";
import "../../../styles/civicsure-public-footer.css";
import "../../../styles/civicsure-funding-detail.css";
import CivicSurePublicNav from "../../../components/civicsure/CivicSurePublicNav.jsx";
import CivicSurePublicFooter from "../../../components/civicsure/CivicSurePublicFooter.jsx";
import FundingDetailHeader from "./components/funding-detail/FundingDetailHeader.jsx";
import FundingSummaryMetrics from "./components/funding-detail/FundingSummaryMetrics.jsx";
import FundingDetailTabs from "./components/funding-detail/FundingDetailTabs.jsx";
import FundingOverviewPanel from "./components/funding-detail/FundingOverviewPanel.jsx";
import FundingMoneyFlowPanel from "./components/funding-detail/FundingMoneyFlowPanel.jsx";
import FundingProgramsPanel from "./components/funding-detail/FundingProgramsPanel.jsx";
import FundingProvidersPanel from "./components/funding-detail/FundingProvidersPanel.jsx";
import FundingDeliveryPanel from "./components/funding-detail/FundingDeliveryPanel.jsx";
import FundingEvidencePanel from "./components/funding-detail/FundingEvidencePanel.jsx";
import FundingOutcomesPanel from "./components/funding-detail/FundingOutcomesPanel.jsx";
import FundingTimelinePanel from "./components/funding-detail/FundingTimelinePanel.jsx";
import FundingAboutData from "./components/funding-detail/FundingAboutData.jsx";
import { ExplorerIcon } from "./explorerIcons.jsx";
import { FUNDING_DETAIL_TABS, getFundingDetail } from "./fundingDetailMockData.js";

export default function CivicSureFundingDetailPage({ fundingId }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [aboutDataOpen, setAboutDataOpen] = useState(false);
  const funding = getFundingDetail(fundingId);

  if (!funding) {
    return (
      <div className="civicsure-funding-detail">
        <a className="cse-skip-link" href="#csfd-main">
          Skip to main content
        </a>
        <CivicSurePublicNav activeKey="explorer" />
        <main id="csfd-main">
          <div className="cse-container cse-fnd-not-found">
            <h1>Funding record not found</h1>
            <p>We couldn&rsquo;t find a funding record matching &ldquo;{fundingId}&rdquo; in CivicSure Explorer&rsquo;s demo data.</p>
            <a className="cse-btn cse-btn--primary" href="#/explorer">
              Back to Explorer
            </a>
          </div>
        </main>
        <CivicSurePublicFooter />
      </div>
    );
  }

  const openAboutData = () => setAboutDataOpen(true);

  return (
    <div className="civicsure-funding-detail">
      <a className="cse-skip-link" href="#csfd-main">
        Skip to main content
      </a>

      <CivicSurePublicNav activeKey="explorer" />

      <FundingDetailHeader funding={funding} />

      <main id="csfd-main">
        <div className="cse-container">
          <FundingSummaryMetrics funding={funding} />

          <div className="cse-fnd-tabs-row">
            <FundingDetailTabs tabs={FUNDING_DETAIL_TABS} activeKey={activeTab} onSelect={setActiveTab} />
            <button type="button" className="cse-fnd-about-trigger" onClick={openAboutData}>
              <ExplorerIcon name="infoCircle" />
              About this data
            </button>
          </div>

          {activeTab === "overview" && <FundingOverviewPanel funding={funding} />}
          {activeTab === "money-flow" && <FundingMoneyFlowPanel funding={funding} />}
          {activeTab === "programs" && <FundingProgramsPanel funding={funding} />}
          {activeTab === "providers" && <FundingProvidersPanel funding={funding} />}
          {activeTab === "delivery" && <FundingDeliveryPanel funding={funding} />}
          {activeTab === "evidence" && <FundingEvidencePanel funding={funding} />}
          {activeTab === "outcomes" && <FundingOutcomesPanel funding={funding} onOpenAboutData={openAboutData} />}
          {activeTab === "timeline" && <FundingTimelinePanel funding={funding} />}
        </div>
      </main>

      <CivicSurePublicFooter />

      <FundingAboutData funding={funding} open={aboutDataOpen} onClose={() => setAboutDataOpen(false)} />
    </div>
  );
}
