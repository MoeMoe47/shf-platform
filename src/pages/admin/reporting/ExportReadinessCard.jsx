import React from "react";

function normalize(value, fallback = "unknown") {
  return String(value || fallback).toLowerCase().trim();
}

function readable(value) {
  return String(value || "unknown").replace(/_/g, " ");
}

function buildExportReadinessView({
  readiness = {},
  traceRecord = null,
  oracleTruth = null,
  oracleGate = null,
  canGenerateExport = false,
  audience = "Unknown",
  format = "Unknown",
  exportKind = "unknown_export",
} = {}) {
  const reasons = readiness.reasons || [];
  const missingFields = readiness.missingFields || [];
  const traceStatus =
    traceRecord?.traceCoverageStatus ||
    (readiness.sourceToReportTraceCoverage ? "complete" : "unknown");

  const trustEnvelopePresent = Boolean(
    oracleTruth?.trustEnvelope ||
      traceRecord?.trustEnvelopeTraceId ||
      readiness.trustEnvelopePresent
  );

  const oracleAllowed =
    oracleGate?.allowExport ??
    oracleGate?.allowed ??
    (oracleTruth ? oracleTruth.truthStatus === "certified" : false);

  const permissionAllowed = Boolean(canGenerateExport || readiness.allowedActions?.generate);

  let status = "ready";
  let label = "Allowed";
  let nextAction = "Generate this export and preserve the audit trail.";

  if (!permissionAllowed) {
    status = "blocked";
    label = "Blocked";
    nextAction = "Check reports.export permission and readiness blockers before generating.";
  }

  if (oracleGate && !oracleAllowed) {
    status = "blocked";
    label = "Blocked by Oracle";
    nextAction = "Resolve Oracle truth, contradiction, readiness, or trust-envelope blockers.";
  }

  if (reasons.length || missingFields.length) {
    status = status === "blocked" ? "blocked" : "review";
    label = status === "blocked" ? label : "Review Needed";
    nextAction = "Clear missing fields, trace coverage, verification, or publication-mode blockers.";
  }

  if (traceStatus !== "complete") {
    status = status === "blocked" ? "blocked" : "review";
    label = status === "blocked" ? label : "Trace Review";
    nextAction = "Complete source-to-report trace coverage before publication-grade use.";
  }

  return {
    status,
    label,
    rows: [
      ["Export", readable(exportKind)],
      ["Audience", audience],
      ["Format", format],
      ["Trace", traceStatus],
      ["Trust Envelope", trustEnvelopePresent ? "present" : "missing"],
      ["Oracle Gate", oracleAllowed ? "allowed" : "blocked or unavailable"],
      ["Permission", permissionAllowed ? "allowed" : "blocked"],
    ],
    reasons,
    missingFields,
    nextAction,
  };
}

function statusClass(status) {
  const normalized = normalize(status);
  if (normalized === "ready") return "reporting-export-readiness--ready";
  if (normalized === "review") return "reporting-export-readiness--review";
  if (normalized === "blocked") return "reporting-export-readiness--blocked";
  return "reporting-export-readiness--pending";
}

export default function ExportReadinessCard(props) {
  const view = buildExportReadinessView(props);

  return (
    <article className={["reporting-export-readiness", statusClass(view.status)].join(" ")}>
      <div className="reporting-export-readiness__top">
        <div>
          <p className="reporting-export-readiness__eyebrow">Export Readiness</p>
          <h3>{view.label}</h3>
        </div>
        <span>{view.status}</span>
      </div>

      <div className="reporting-export-readiness__grid">
        {view.rows.map(([label, value]) => (
          <div key={label} className="reporting-export-readiness__row">
            <span>{label}</span>
            <strong>{String(value)}</strong>
          </div>
        ))}
      </div>

      {(view.reasons.length || view.missingFields.length) ? (
        <div className="reporting-export-readiness__blockers">
          <strong>Blockers / missing items</strong>
          <p>
            {[
              ...view.reasons,
              ...view.missingFields.map((field) => `missing_${field}`),
            ].join(", ")}
          </p>
        </div>
      ) : null}

      <div className="reporting-export-readiness__next">
        <strong>Next action</strong>
        <p>{view.nextAction}</p>
      </div>
    </article>
  );
}
