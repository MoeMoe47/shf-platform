// apps/shf-web/src/pages/civicsure/explorer/CivicSureProviderDetailPage.jsx
//
// CivicSure Provider Detail — public-facing page FRAME.
//
// Scope discipline (see docs/ui/CIVICSURE_PROVIDER_DETAIL_FRAME.md),
// same phase discipline as CivicSureExplorerPage.jsx and
// CivicSureProgramDetailPage.jsx: this is a visual/layout build only.
// It does not wire live API data, real funding/outcome/evidence/
// compliance records, or a real assurance engine — every fact and
// number shown here comes from providerDetailMockData.js, explicitly
// marked DEMO / FRAME DATA. This page does not implement Shared
// Reporting, Public Disclosure, Credential, Truth, or Evidence
// authority, and does not touch any of those systems, or any operator/
// admin UI.
//
// Only local presentation state lives here (which tab is active,
// whether the "About this data" drawer is open) — nothing that
// reaches a backend.
import React, { useState } from "react";
import "../../../styles/civicsure-explorer.css";
import "../../../styles/civicsure-public-footer.css";
import "../../../styles/civicsure-provider-detail.css";
import CivicSurePublicNav from "../../../components/civicsure/CivicSurePublicNav.jsx";
import CivicSurePublicFooter from "../../../components/civicsure/CivicSurePublicFooter.jsx";
import ProviderDetailHeader from "./components/provider-detail/ProviderDetailHeader.jsx";
import ProviderIdentityPanel from "./components/provider-detail/ProviderIdentityPanel.jsx";
import ProviderSummaryMetrics from "./components/provider-detail/ProviderSummaryMetrics.jsx";
import ProviderDetailTabs from "./components/provider-detail/ProviderDetailTabs.jsx";
import ProviderOverviewPanel from "./components/provider-detail/ProviderOverviewPanel.jsx";
import ProviderProgramsPanel from "./components/provider-detail/ProviderProgramsPanel.jsx";
import ProviderFundingPanel from "./components/provider-detail/ProviderFundingPanel.jsx";
import ProviderOutcomesPanel from "./components/provider-detail/ProviderOutcomesPanel.jsx";
import ProviderEvidencePanel from "./components/provider-detail/ProviderEvidencePanel.jsx";
import ProviderCompliancePanel from "./components/provider-detail/ProviderCompliancePanel.jsx";
import ProviderAboutData from "./components/provider-detail/ProviderAboutData.jsx";
import { ExplorerIcon } from "./explorerIcons.jsx";
import { PROVIDER_DETAIL_TABS, getProviderDetail } from "./providerDetailMockData.js";

const TAB_PANELS = {
  overview: ProviderOverviewPanel,
  programs: ProviderProgramsPanel,
  funding: ProviderFundingPanel,
  outcomes: ProviderOutcomesPanel,
  evidence: ProviderEvidencePanel,
  compliance: ProviderCompliancePanel,
};

export default function CivicSureProviderDetailPage({ providerId }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [aboutDataOpen, setAboutDataOpen] = useState(false);
  const provider = getProviderDetail(providerId);

  if (!provider) {
    return (
      <div className="civicsure-provider-detail">
        <a className="cse-skip-link" href="#cspvd-main">
          Skip to main content
        </a>
        <CivicSurePublicNav activeKey="explorer" />
        <main id="cspvd-main">
          <div className="cse-container cse-pvd-not-found">
            <h1>Provider not found</h1>
            <p>We couldn&rsquo;t find a provider matching &ldquo;{providerId}&rdquo; in CivicSure Explorer&rsquo;s demo data.</p>
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
    <div className="civicsure-provider-detail">
      <a className="cse-skip-link" href="#cspvd-main">
        Skip to main content
      </a>

      <CivicSurePublicNav activeKey="explorer" />

      <ProviderDetailHeader provider={provider} />

      <main id="cspvd-main">
        <div className="cse-container">
          <ProviderIdentityPanel provider={provider} />
          <ProviderSummaryMetrics provider={provider} />

          <div className="cse-pvd-tabs-row">
            <ProviderDetailTabs tabs={PROVIDER_DETAIL_TABS} activeKey={activeTab} onSelect={setActiveTab} />
            <button type="button" className="cse-pvd-about-trigger" onClick={() => setAboutDataOpen(true)}>
              <ExplorerIcon name="infoCircle" />
              About this data
            </button>
          </div>

          <ActivePanel provider={provider} onNavigateTab={setActiveTab} />
        </div>
      </main>

      <CivicSurePublicFooter />

      <ProviderAboutData provider={provider} open={aboutDataOpen} onClose={() => setAboutDataOpen(false)} />
    </div>
  );
}
