// EvidenceOverviewPanel.jsx — Overview tab: evidence summary facts +
// "What does this evidence support?" + "What does Verified mean
// here?" + Still Pending + Data Quality Notice + Privacy Boundary on
// the left; the Verification Snapshot, Related Assurance Report, and
// a compact Evidence-to-Claim Chain on the right. DEMO / FRAME DATA
// (see ../../evidenceSummaryMockData.js).
import React from "react";
import StatusBadge from "../StatusBadge.jsx";
import EvidenceVerificationSnapshot from "./EvidenceVerificationSnapshot.jsx";
import EvidenceReportCard from "./EvidenceReportCard.jsx";
import EvidenceClaimChain from "./EvidenceClaimChain.jsx";
import EvidencePendingNotice from "./EvidencePendingNotice.jsx";
import EvidenceDataQualityNotice from "./EvidenceDataQualityNotice.jsx";
import EvidencePrivacyBoundary from "./EvidencePrivacyBoundary.jsx";

export default function EvidenceOverviewPanel({ evidence }) {
  const { overview } = evidence;

  return (
    <div className="cse-evs-overview" role="tabpanel" id="cse-evs-tabpanel-overview" aria-labelledby="cse-evs-tab-overview">
      <div className="cse-evs-overview__main">
        <section className="cse-card cse-evs-summary">
          <h2 className="cse-evs-summary__heading">Evidence Summary</h2>
          <dl className="cse-evs-summary__grid">
            <div>
              <dt>Evidence purpose</dt>
              <dd>{overview.purpose}</dd>
            </div>
            <div>
              <dt>Evidence category</dt>
              <dd>{overview.category}</dd>
            </div>
            <div>
              <dt>Reporting period</dt>
              <dd>{overview.reportingPeriod}</dd>
            </div>
            <div>
              <dt>Verification status</dt>
              <dd>
                <StatusBadge state={overview.verificationStatus} />
              </dd>
            </div>
            <div>
              <dt>Evidence coverage</dt>
              <dd>{overview.coverage}</dd>
            </div>
            <div>
              <dt>Records covered</dt>
              <dd>{overview.recordsCovered}</dd>
            </div>
            <div>
              <dt>Eligible population</dt>
              <dd>{overview.eligiblePopulation}</dd>
            </div>
            <div>
              <dt>Records not yet verified</dt>
              <dd>{overview.notYetVerified}</dd>
            </div>
            <div>
              <dt>Last reviewed</dt>
              <dd>{overview.lastReviewed}</dd>
            </div>
          </dl>

          <div className="cse-evs-summary__block">
            <h3>What does this evidence support?</h3>
            <p>{overview.whatItSupports}</p>
          </div>

          <div className="cse-evs-summary__block">
            <h3>What does &ldquo;Verified&rdquo; mean here?</h3>
            <p>{overview.whatVerifiedMeans}</p>
            <p className="cse-evs-summary__disclaimer">{overview.verifiedMeaningDisclaimer}</p>
          </div>
        </section>

        <EvidencePendingNotice pending={evidence.pending} />
        <EvidenceDataQualityNotice notice={evidence.dataQualityNotice} />
        <EvidencePrivacyBoundary privacyBoundary={evidence.privacyBoundary} />
      </div>

      <div className="cse-evs-overview__side">
        <EvidenceVerificationSnapshot evidence={evidence} />
        <EvidenceReportCard report={evidence.report} />
        <EvidenceClaimChain
          chain={evidence.claimChain}
          heading="Evidence-to-Claim Chain"
          description="How this evidence connects to a verified outcome."
        />
      </div>
    </div>
  );
}
