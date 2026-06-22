import React from "react";
import { evaluateReportReadiness } from "@/data/shsReports/shsReportReadiness";
import {
  normalizeLifecycleStatus,
  normalizeVisibility,
  safeReportValue,
  SHS_PREMIUM_INTERIOR_TEMPLATE,
} from "../shsPremiumReportData";
import {
  ShsReportDataStatusBadge,
  ShsReportLifecycleBadge,
  ShsReportVisibilityBadge,
} from "./ShsPremiumReportShared.jsx";

function profileReadinessStatus(readiness) {
  if (readiness.blocked) return "blocked";
  if (readiness.draftOrSample.length) return "draft";
  if (readiness.canExport) return "approved";
  return "sample";
}

export default function ShsProfileControlStatusPanel({ report }) {
  const readiness = evaluateReportReadiness(report);
  const profile = report?.subjectProfile || {};

  return (
    <section className="shs-report-control-panel shs-profile-control-panel" aria-label="Profile control status">
      <div className="shs-report-control-panel__header">
        <span>Control</span>
        <h2>Profile Control Status</h2>
      </div>

      <div className="shs-report-control-panel__rows">
        <div>
          <span>Lifecycle Status</span>
          <ShsReportLifecycleBadge status={report?.lifecycleStatus} />
        </div>
        <div>
          <span>Visibility Mode</span>
          <ShsReportVisibilityBadge visibility={report?.visibility} />
        </div>
        <div>
          <span>Profile Readiness</span>
          <ShsReportDataStatusBadge status={profileReadinessStatus(readiness)} />
        </div>
        <div>
          <span>Subject Record</span>
          <strong>{safeReportValue(profile.clientId || report?.subjectId || report?.reportId)}</strong>
        </div>
        <div>
          <span>Template Version</span>
          <strong>{safeReportValue(report?.templateVersion, SHS_PREMIUM_INTERIOR_TEMPLATE.version)}</strong>
        </div>
      </div>

      <div className="shs-report-control-panel__trust">
        <strong>Profile Reminder</strong>
        <p>Missing, Draft, or Sample source areas must remain visible as review states until updated in report data.</p>
      </div>

      <div className="shs-report-control-panel__mini">
        <span>Lifecycle</span>
        <strong>{normalizeLifecycleStatus(report?.lifecycleStatus)}</strong>
        <span>Visibility</span>
        <strong>{normalizeVisibility(report?.visibility)}</strong>
        <span>Readiness Gaps</span>
        <strong>{readiness.missingRequired.length + readiness.draftOrSample.length}</strong>
      </div>
    </section>
  );
}
