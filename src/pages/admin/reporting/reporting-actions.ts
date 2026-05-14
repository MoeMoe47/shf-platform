export type ReportingActionKind =
  | "briefing_export"
  | "action_log_export"
  | "analyst_memo_export"
  | "audit_pack_export";

export interface ReportingActionInput {
  exportKind: ReportingActionKind;
  publicationMode?: string;
  relatedEntityIds?: string[];
  requestedBy?: string;
  reportArtifactId?: string;
}

export interface ReportingActionResult {
  exportId: string;
  exportKind: ReportingActionKind;
  status: "queued" | "generated" | "opened" | "downloaded" | "failed";
  createdAt: string;
  publicationMode: string;
  relatedEntityIds: string[];
  requestedBy: string;
  reportArtifactId?: string;
  resolvedRunId?: string;
  url?: string;
  message?: string;
}

const REPORT_BACKEND_BASE = "http://127.0.0.1:8090";

const ARTIFACT_TO_RUN_ID: Record<string, string> = {
  rep_hub_case_demo_001: "pilot_test_001",
  rep_action_log_demo_001: "pilot_test_001",
  rep_analyst_memo_demo_001: "pilot_test_001",
  rep_audit_pack_demo_001: "pilot_test_001",
};

function buildExportId(kind: ReportingActionKind) {
  const stamp = Date.now();
  return `exp_${kind}_${stamp}`;
}

function openUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function downloadBlob(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function resolveRunId(input: Omit<ReportingActionInput, "exportKind"> = {}) {
  const artifactId = input.reportArtifactId || "";
  return ARTIFACT_TO_RUN_ID[artifactId] || "pilot_test_001";
}

function buildPdfUrl(runId: string) {
  return `${REPORT_BACKEND_BASE}/runs/report/${runId}/pdf`;
}

function buildCsvContent(input: Omit<ReportingActionInput, "exportKind"> = {}) {
  const artifactId = input.reportArtifactId || "unknown_artifact";
  const related = (input.relatedEntityIds || []).join(" | ");

  const rows = [
    ["report_artifact_id", artifactId],
    ["publication_mode", input.publicationMode || "admin_internal"],
    ["requested_by", input.requestedBy || "user_admin_001"],
    ["related_entity_ids", related],
    [""],
    ["timestamp", "actor", "source_layer", "target", "status", "note"],
    ["2026-04-16 09:12", "user_admin_001", "Hub", "Referral hub_case_demo_001", "ready", "Referral transitioned into bridge evaluation flow."],
    ["2026-04-16 09:18", "bridge_engine", "Aggregation", "Canonical referral hub_case_demo_001", "ready", "Canonical mapping completed with trust envelope attached."],
    ["2026-04-16 09:24", "bridge_engine", "Verification", "Verification package ver_hub_case_demo_001", "ready", "Verification cleared and linked to reporting flow."],
    ["2026-04-16 09:31", "reporting_surface", "Reporting", `Artifact ${artifactId}`, "ready", "Artifact-specific reporting export generated."],
  ];

  return rows
    .map((row) =>
      row
        .map((cell) => {
          const safe = String(cell ?? "").replace(/"/g, '""');
          return `"${safe}"`;
        })
        .join(",")
    )
    .join("\n");
}

export async function generateBriefingExport(
  input: Omit<ReportingActionInput, "exportKind"> = {}
): Promise<ReportingActionResult> {
  const runId = resolveRunId(input);
  const url = buildPdfUrl(runId);
  openUrl(url);

  return {
    exportId: buildExportId("briefing_export"),
    exportKind: "briefing_export",
    status: "opened",
    createdAt: new Date().toISOString(),
    publicationMode: input.publicationMode || "admin_internal",
    relatedEntityIds: input.relatedEntityIds || [],
    requestedBy: input.requestedBy || "user_admin_001",
    reportArtifactId: input.reportArtifactId,
    resolvedRunId: runId,
    url,
    message: `Briefing PDF opened for artifact ${input.reportArtifactId || "unknown"} via run ${runId}.`,
  };
}

export async function generateActionLogExport(
  input: Omit<ReportingActionInput, "exportKind"> = {}
): Promise<ReportingActionResult> {
  const content = buildCsvContent(input);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const artifactId = input.reportArtifactId || "unknown_artifact";
  const filename = `action-log-${artifactId}-${stamp}.csv`;

  downloadBlob(filename, content, "text/csv;charset=utf-8");

  return {
    exportId: buildExportId("action_log_export"),
    exportKind: "action_log_export",
    status: "downloaded",
    createdAt: new Date().toISOString(),
    publicationMode: input.publicationMode || "admin_internal",
    relatedEntityIds: input.relatedEntityIds || [],
    requestedBy: input.requestedBy || "user_admin_001",
    reportArtifactId: input.reportArtifactId,
    resolvedRunId: resolveRunId(input),
    message: `Action Log CSV downloaded for artifact ${artifactId}.`,
  };
}

export async function generateAnalystMemoExport(
  input: Omit<ReportingActionInput, "exportKind"> = {}
): Promise<ReportingActionResult> {
  const runId = resolveRunId(input);
  const url = buildPdfUrl(runId);
  openUrl(url);

  return {
    exportId: buildExportId("analyst_memo_export"),
    exportKind: "analyst_memo_export",
    status: "opened",
    createdAt: new Date().toISOString(),
    publicationMode: input.publicationMode || "admin_internal",
    relatedEntityIds: input.relatedEntityIds || [],
    requestedBy: input.requestedBy || "user_admin_001",
    reportArtifactId: input.reportArtifactId,
    resolvedRunId: runId,
    url,
    message: `Analyst Memo PDF opened for artifact ${input.reportArtifactId || "unknown"} via run ${runId}.`,
  };
}

export async function generateAuditPackExport(
  input: Omit<ReportingActionInput, "exportKind"> = {}
): Promise<ReportingActionResult> {
  const runId = resolveRunId(input);
  const url = buildPdfUrl(runId);
  openUrl(url);

  return {
    exportId: buildExportId("audit_pack_export"),
    exportKind: "audit_pack_export",
    status: "opened",
    createdAt: new Date().toISOString(),
    publicationMode: input.publicationMode || "admin_internal",
    relatedEntityIds: input.relatedEntityIds || [],
    requestedBy: input.requestedBy || "user_admin_001",
    reportArtifactId: input.reportArtifactId,
    resolvedRunId: runId,
    url,
    message: `Audit Pack PDF opened for artifact ${input.reportArtifactId || "unknown"} via run ${runId}.`,
  };
}

export async function runReportingAction(
  input: ReportingActionInput
): Promise<ReportingActionResult> {
  switch (input.exportKind) {
    case "briefing_export":
      return generateBriefingExport(input);
    case "action_log_export":
      return generateActionLogExport(input);
    case "analyst_memo_export":
      return generateAnalystMemoExport(input);
    case "audit_pack_export":
      return generateAuditPackExport(input);
    default:
      return {
        exportId: buildExportId(input.exportKind),
        exportKind: input.exportKind,
        status: "queued",
        createdAt: new Date().toISOString(),
        publicationMode: input.publicationMode || "admin_internal",
        relatedEntityIds: input.relatedEntityIds || [],
        requestedBy: input.requestedBy || "user_admin_001",
        reportArtifactId: input.reportArtifactId,
        resolvedRunId: resolveRunId(input),
        message: "Unknown export kind queued.",
      };
  }
}
