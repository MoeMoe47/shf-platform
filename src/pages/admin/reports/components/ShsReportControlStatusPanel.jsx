import React from "react";
import {
  normalizeLifecycleStatus,
  normalizeVisibility,
  safeReportValue,
  SHS_PREMIUM_INTERIOR_TEMPLATE,
} from "../shsPremiumReportData";
import {
  ShsReportLifecycleBadge,
  ShsReportVisibilityBadge,
} from "./ShsPremiumReportShared.jsx";

export default function ShsReportControlStatusPanel({ report }) {
  const exportLocked = Boolean(report?.isLocked || report?.exportMetadata?.exportLocked);

  return (
    <section className="shs-report-control-panel" aria-label="Report control status">
      <div className="shs-report-control-panel__header">
        <span>Control</span>
        <h2>Report Control Status</h2>
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
          <span>Template Version</span>
          <strong>{safeReportValue(report?.templateVersion, SHS_PREMIUM_INTERIOR_TEMPLATE.label)}</strong>
        </div>
        <div>
          <span>Export Lock</span>
          <strong>{exportLocked ? "Locked Exported Record" : "Unlocked Draft"}</strong>
        </div>
      </div>

      <div className="shs-report-control-panel__trust">
        <strong>Trust Reminder</strong>
        <p>Sections marked Draft, Sample, or Missing should not be treated as final verified evidence.</p>
      </div>

      <div className="shs-report-control-panel__mini">
        <span>Lifecycle</span>
        <strong>{normalizeLifecycleStatus(report?.lifecycleStatus)}</strong>
        <span>Visibility</span>
        <strong>{normalizeVisibility(report?.visibility)}</strong>
      </div>
    </section>
  );
}
