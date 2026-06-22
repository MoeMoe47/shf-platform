import React from "react";
import { Link } from "react-router-dom";
import { createReportVersion } from "@/data/shsReports/shsReportStorage";
import { displayDataStatus, displayLifecycleStatus, displayVisibilityMode } from "@/data/shsReports/shsReportTypes";
import {
  ShsReportDataStatusBadge,
  ShsReportLifecycleBadge,
  ShsReportVisibilityBadge,
} from "./ShsPremiumReportShared.jsx";

export default function ShsReportHistoryTable({ reports = [], onVersionCreated }) {
  return (
    <div className="shs-report-table-wrap">
      <table className="shs-report-history-table">
        <thead>
          <tr>
            <th>Report ID</th>
            <th>Title</th>
            <th>Subject</th>
            <th>Type</th>
            <th>Lifecycle</th>
            <th>Visibility</th>
            <th>Data</th>
            <th>Version</th>
            <th>Template</th>
            <th>Generated</th>
            <th>Exported</th>
            <th>Locked</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id || report.reportId}>
              <td>{report.reportId}</td>
              <td>{report.title}</td>
              <td>{report.subjectName}</td>
              <td>{report.reportType}</td>
              <td><ShsReportLifecycleBadge status={displayLifecycleStatus(report.lifecycleStatus)} /></td>
              <td><ShsReportVisibilityBadge visibility={displayVisibilityMode(report.visibility)} /></td>
              <td><ShsReportDataStatusBadge status={displayDataStatus(report.dataMode)} /></td>
              <td>{report.reportVersion}</td>
              <td>{report.templateVersion}</td>
              <td>{report.generatedDate || "Missing"}</td>
              <td>{report.exportMetadata?.exportedAt || "Missing"}</td>
              <td>{report.isLocked ? "Locked" : "Draft"}</td>
              <td>
                <div className="shs-report-row-actions">
                  <Link to="/ops/reports/premium-preview">open preview</Link>
                  <Link to={`/ops/reports/export-metadata?reportId=${encodeURIComponent(report.reportId)}`}>metadata</Link>
                  {report.isLocked ? (
                    <button
                      type="button"
                      onClick={() => {
                        const version = createReportVersion(report.reportId);
                        onVersionCreated?.(version);
                      }}
                    >
                      duplicate as new version
                    </button>
                  ) : (
                    <Link to={`/ops/reports/create?reportId=${encodeURIComponent(report.reportId)}`}>continue draft</Link>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
