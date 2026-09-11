// apps/shf-web/src/pages/civicsure/explorer/CivicSureEvidenceSummaryPage.jsx
//
// CivicSure Evidence Summary — public-facing page FRAME.
//
// Scope discipline (see docs/ui/CIVICSURE_EVIDENCE_SUMMARY_FRAME.md),
// same phase discipline as every other page in this suite: this is a
// visual/layout build only. It does not wire live Evidence authority,
// GPA/CivicSure data, Shared Reporting, or a real assurance engine —
// every fact and status shown here comes from
// evidenceSummaryMockData.js, explicitly marked DEMO / FRAME DATA.
// This page is a public-safe projection only: it never renders
// participant names, SSNs, payroll details, protected wage records,
// private case files, confidential employer records, or raw
// restricted evidence documents — only verification metadata and
// aggregate counts. This page does not implement Shared Reporting,
// Public Disclosure, Credential, Truth, Evidence, or Metric Registry
// authority, and does not touch any of those systems, or any
// operator/admin UI.
//
// Only local presentation state lives here (which tab is active,
// whether the "About this data" drawer is open) — nothing that
// reaches a backend.
import React, { useState } from "react";
import "../../../styles/civicsure-explorer.css";
import "../../../styles/civicsure-public-footer.css";
import "../../../styles/civicsure-evidence-summary.css";
import CivicSurePublicNav from "../../../components/civicsure/CivicSurePublicNav.jsx";
import CivicSurePublicFooter from "../../../components/civicsure/CivicSurePublicFooter.jsx";
import EvidenceSummaryHeader from "./components/evidence-summary/EvidenceSummaryHeader.jsx";
import EvidenceSummaryMetrics from "./components/evidence-summary/EvidenceSummaryMetrics.jsx";
import EvidenceDetailTabs from "./components/evidence-summary/EvidenceDetailTabs.jsx";
import EvidenceOverviewPanel from "./components/evidence-summary/EvidenceOverviewPanel.jsx";
import EvidenceSourcesPanel from "./components/evidence-summary/EvidenceSourcesPanel.jsx";
import EvidenceCoveragePanel from "./components/evidence-summary/EvidenceCoveragePanel.jsx";
import EvidenceVerificationPanel from "./components/evidence-summary/EvidenceVerificationPanel.jsx";
import EvidenceRelatedClaimsPanel from "./components/evidence-summary/EvidenceRelatedClaimsPanel.jsx";
import EvidenceTimelinePanel from "./components/evidence-summary/EvidenceTimelinePanel.jsx";
import EvidenceAboutData from "./components/evidence-summary/EvidenceAboutData.jsx";
import { ExplorerIcon } from "./explorerIcons.jsx";
import { EVIDENCE_DETAIL_TABS, getEvidenceSummary } from "./evidenceSummaryMockData.js";

const TAB_PANELS = {
  overview: EvidenceOverviewPanel,
  sources: EvidenceSourcesPanel,
  coverage: EvidenceCoveragePanel,
  verification: EvidenceVerificationPanel,
  "related-claims": EvidenceRelatedClaimsPanel,
  timeline: EvidenceTimelinePanel,
};

export default function CivicSureEvidenceSummaryPage({ evidenceId }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [aboutDataOpen, setAboutDataOpen] = useState(false);
  const evidence = getEvidenceSummary(evidenceId);

  if (!evidence) {
    return (
      <div className="civicsure-evidence-summary">
        <a className="cse-skip-link" href="#cses-main">
          Skip to main content
        </a>
        <CivicSurePublicNav activeKey="explorer" />
        <main id="cses-main">
          <div className="cse-container cse-evs-not-found">
            <h1>Evidence record not found</h1>
            <p>We couldn&rsquo;t find an evidence record matching &ldquo;{evidenceId}&rdquo; in CivicSure Explorer&rsquo;s demo data.</p>
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
    <div className="civicsure-evidence-summary">
      <a className="cse-skip-link" href="#cses-main">
        Skip to main content
      </a>

      <CivicSurePublicNav activeKey="explorer" />

      <EvidenceSummaryHeader evidence={evidence} />

      <main id="cses-main">
        <div className="cse-container">
          <EvidenceSummaryMetrics evidence={evidence} />

          <div className="cse-evs-tabs-row">
            <EvidenceDetailTabs tabs={EVIDENCE_DETAIL_TABS} activeKey={activeTab} onSelect={setActiveTab} />
            <button type="button" className="cse-evs-about-trigger" onClick={() => setAboutDataOpen(true)}>
              <ExplorerIcon name="infoCircle" />
              About this data
            </button>
          </div>

          <ActivePanel evidence={evidence} />
        </div>
      </main>

      <CivicSurePublicFooter />

      <EvidenceAboutData evidence={evidence} open={aboutDataOpen} onClose={() => setAboutDataOpen(false)} />
    </div>
  );
}
