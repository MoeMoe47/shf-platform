// CountyEvidencePanel.jsx — Evidence tab: county-level evidence
// coverage and data quality, not raw private records. DEMO / FRAME
// DATA (see ../../countyDetailMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function CountyEvidencePanel({ county }) {
  const { evidence } = county;

  const tiles = [
    { key: "verified", label: "Verified", value: evidence.verified, tone: "green" },
    { key: "pendingReview", label: "Pending Review", value: evidence.pendingReview, tone: "blue" },
    { key: "missing", label: "Missing", value: evidence.missing, tone: "amber" },
    { key: "notPublic", label: "Not Public", value: evidence.notPublic, tone: undefined },
  ];

  return (
    <div className="cse-cty-panel" role="tabpanel" id="cse-cty-tabpanel-evidence" aria-labelledby="cse-cty-tab-evidence">
      <p className="cse-cty-evidence__note">
        Evidence coverage reflects publicly approved verification metadata, not raw private records.
      </p>

      <div className="cse-cty-evidence-tiles" role="list" aria-label={`Evidence coverage for ${county.name} (demo data)`}>
        {tiles.map((t) => (
          <div className={`cse-card cse-cty-evidence-tile${t.tone ? ` cse-cty-evidence-tile--${t.tone}` : ""}`} role="listitem" key={t.key}>
            <p className="cse-cty-evidence-tile__value">{t.value}</p>
            <p className="cse-cty-evidence-tile__label">{t.label}</p>
          </div>
        ))}
      </div>

      <section className="cse-card cse-cty-evidence-quality">
        <div className="cse-cty-evidence-quality__head">
          <h3>Data Quality Notices</h3>
          <p>Last CivicSure evaluation: {evidence.lastEvaluationDate}</p>
        </div>
        <ul className="cse-cty-evidence-quality__list">
          {evidence.dataQualityNotices.map((notice, i) => (
            <li key={i}>
              <ExplorerIcon name="infoCircle" aria-hidden="true" />
              <span>{notice}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
