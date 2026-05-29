import React from "react";
import {
  aggregationOrganizations,
  aggregationReferrals,
  aggregationOutcomes,
  aggregationReports,
  aggregationSignals,
  aggregationVerificationRecords,
} from "./mockData";

function mappingSignal(row) {
  const status = String(row.status || "").toLowerCase();
  const count = Number(row.count || 0);

  if (status === "active" && count > 0) {
    return { label: "Ready", tone: "ready" };
  }

  if (status === "active") {
    return { label: "Needs Data", tone: "review" };
  }

  return { label: "Not Ready", tone: "blocked" };
}

function buildMappingRows() {
  return [
    {
      source: "OrganizationEntity",
      mappedTo: "Canonical Organization",
      count: aggregationOrganizations.length,
      status: "active",
      note: "Organization identity + county + trust envelope aligned",
    },
    {
      source: "ReferralEntity",
      mappedTo: "Canonical Referral",
      count: aggregationReferrals.length,
      status: "active",
      note: "Referral lifecycle and priority fields normalized",
    },
    {
      source: "OutcomeEntity",
      mappedTo: "Canonical Outcome",
      count: aggregationOutcomes.length,
      status: "active",
      note: "Outcome type, status, and trust shape aligned",
    },
    {
      source: "VerificationRecordEntity",
      mappedTo: "Canonical Verification Record",
      count: aggregationVerificationRecords.length,
      status: "active",
      note: "Review state and reviewer metadata mapped",
    },
    {
      source: "GeographySignalEntity",
      mappedTo: "Canonical Geography Signal",
      count: aggregationSignals.length,
      status: "active",
      note: "Signal state and freshness metadata aligned",
    },
    {
      source: "ReportArtifactEntity",
      mappedTo: "Canonical Report Artifact",
      count: aggregationReports.length,
      status: "active",
      note: "Publication mode and related entity IDs included",
    },
  ];
}

export default function MappingRegistry() {
  const rows = buildMappingRows();

  return (
    <section className="admin-aggregation-mapping">
      <div className="admin-aggregation-mapping__header">
        <div>
          <p className="admin-aggregation-mapping__eyebrow">Schema + Contract Alignment</p>
          <h2 className="admin-aggregation-mapping__title">Mapping Registry</h2>
          <p className="admin-aggregation-mapping__subtitle">
            Registry of live aggregation entity types aligned to the shared canonical model.
          </p>
        </div>
      </div>

      <div className="admin-aggregation-mapping__table-wrap">
        <table className="admin-aggregation-mapping__table">
          <thead>
            <tr>
              <th>Source Type</th>
              <th>Mapped To</th>
              <th>Count</th>
              <th>Status</th>
              <th>Operator Signal</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.source}>
                <td>{row.source}</td>
                <td>{row.mappedTo}</td>
                <td>{row.count}</td>
                <td>{row.status}</td>
                <td>
                  <span
                    className={[
                      "admin-aggregation-signal-pill",
                      `admin-aggregation-signal-pill--${mappingSignal(row).tone}`,
                    ].join(" ")}
                  >
                    {mappingSignal(row).label}
                  </span>
                </td>
                <td>{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
