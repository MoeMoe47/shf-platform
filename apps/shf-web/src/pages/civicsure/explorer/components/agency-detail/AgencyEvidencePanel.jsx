// AgencyEvidencePanel.jsx — Evidence tab: agency-level evidence
// coverage and data quality, not raw private records. DEMO / FRAME
// DATA (see ../../agencyDetailMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function AgencyEvidencePanel({ agency }) {
  const { evidence } = agency;

  const tiles = [
    { key: "verified", label: "Verified", value: evidence.verified, tone: "green" },
    { key: "pendingReview", label: "Pending Review", value: evidence.pendingReview, tone: "blue" },
    { key: "missing", label: "Missing", value: evidence.missing, tone: "amber" },
    { key: "notPublic", label: "Not Public", value: evidence.notPublic, tone: undefined },
  ];

  return (
    <div className="cse-agy-panel" role="tabpanel" id="cse-agy-tabpanel-evidence" aria-labelledby="cse-agy-tab-evidence">
      <p className="cse-agy-evidence__note">
        Evidence coverage reflects CivicSure verification metadata and does not expose private underlying records.
      </p>

      <div className="cse-agy-evidence-tiles" role="list" aria-label={`Evidence coverage for ${agency.name} (demo data)`}>
        {tiles.map((t) => (
          <div className={`cse-card cse-agy-evidence-tile${t.tone ? ` cse-agy-evidence-tile--${t.tone}` : ""}`} role="listitem" key={t.key}>
            <p className="cse-agy-evidence-tile__value">{t.value}</p>
            <p className="cse-agy-evidence-tile__label">{t.label}</p>
          </div>
        ))}
      </div>

      <section className="cse-card cse-agy-evidence-quality">
        <div className="cse-agy-evidence-quality__head">
          <h3>Data Quality Notices</h3>
          <p>Last CivicSure evaluation: {evidence.lastEvaluationDate}</p>
        </div>
        <ul className="cse-agy-evidence-quality__list">
          {evidence.dataQualityNotices.map((notice, i) => (
            <li key={i}>
              <ExplorerIcon name="infoCircle" aria-hidden="true" />
              <span>{notice}</span>
            </li>
          ))}
        </ul>
        <p className="cse-agy-evidence-quality__limitations">
          <strong>Known limitations: </strong>
          {evidence.limitations}
        </p>
      </section>
    </div>
  );
}
