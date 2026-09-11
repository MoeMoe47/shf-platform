// apps/shf-web/src/pages/civicsure/explorer/CivicSureOutcomeDetailPage.jsx
//
// CivicSure Outcome Detail / Methodology — public-facing page FRAME.
//
// Scope discipline (see docs/ui/CIVICSURE_OUTCOME_DETAIL_FRAME.md),
// same phase discipline as every other page in this suite: this is a
// visual/layout build only. It does not wire live GPA/CivicSure data,
// Shared Reporting, or a real assurance engine — every fact and
// status shown here comes from outcomeDetailMockData.js, explicitly
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
import "../../../styles/civicsure-outcome-detail.css";
import CivicSurePublicNav from "../../../components/civicsure/CivicSurePublicNav.jsx";
import CivicSurePublicFooter from "../../../components/civicsure/CivicSurePublicFooter.jsx";
import OutcomeDetailHeader from "./components/outcome-detail/OutcomeDetailHeader.jsx";
import OutcomeSummaryMetrics from "./components/outcome-detail/OutcomeSummaryMetrics.jsx";
import OutcomeDetailTabs from "./components/outcome-detail/OutcomeDetailTabs.jsx";
import OutcomeOverviewPanel from "./components/outcome-detail/OutcomeOverviewPanel.jsx";
import OutcomeMethodologyPanel from "./components/outcome-detail/OutcomeMethodologyPanel.jsx";
import OutcomeEvidencePanel from "./components/outcome-detail/OutcomeEvidencePanel.jsx";
import OutcomePopulationPanel from "./components/outcome-detail/OutcomePopulationPanel.jsx";
import OutcomeRelatedProgramsPanel from "./components/outcome-detail/OutcomeRelatedProgramsPanel.jsx";
import OutcomeTimelinePanel from "./components/outcome-detail/OutcomeTimelinePanel.jsx";
import OutcomeAboutData from "./components/outcome-detail/OutcomeAboutData.jsx";
import { ExplorerIcon } from "./explorerIcons.jsx";
import { OUTCOME_DETAIL_TABS, getOutcomeDetail } from "./outcomeDetailMockData.js";

const TAB_PANELS = {
  overview: OutcomeOverviewPanel,
  methodology: OutcomeMethodologyPanel,
  evidence: OutcomeEvidencePanel,
  population: OutcomePopulationPanel,
  "related-programs": OutcomeRelatedProgramsPanel,
  timeline: OutcomeTimelinePanel,
};

export default function CivicSureOutcomeDetailPage({ outcomeId }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [aboutDataOpen, setAboutDataOpen] = useState(false);
  const outcome = getOutcomeDetail(outcomeId);

  if (!outcome) {
    return (
      <div className="civicsure-outcome-detail">
        <a className="cse-skip-link" href="#csod-main">
          Skip to main content
        </a>
        <CivicSurePublicNav activeKey="explorer" />
        <main id="csod-main">
          <div className="cse-container cse-otc-not-found">
            <h1>Outcome not found</h1>
            <p>We couldn&rsquo;t find an outcome matching &ldquo;{outcomeId}&rdquo; in CivicSure Explorer&rsquo;s demo data.</p>
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
    <div className="civicsure-outcome-detail">
      <a className="cse-skip-link" href="#csod-main">
        Skip to main content
      </a>

      <CivicSurePublicNav activeKey="explorer" />

      <OutcomeDetailHeader outcome={outcome} />

      <main id="csod-main">
        <div className="cse-container">
          <OutcomeSummaryMetrics outcome={outcome} />

          <div className="cse-otc-tabs-row">
            <OutcomeDetailTabs tabs={OUTCOME_DETAIL_TABS} activeKey={activeTab} onSelect={setActiveTab} />
            <button type="button" className="cse-otc-about-trigger" onClick={() => setAboutDataOpen(true)}>
              <ExplorerIcon name="infoCircle" />
              About this data
            </button>
          </div>

          <ActivePanel outcome={outcome} />
        </div>
      </main>

      <CivicSurePublicFooter />

      <OutcomeAboutData outcome={outcome} open={aboutDataOpen} onClose={() => setAboutDataOpen(false)} />
    </div>
  );
}
