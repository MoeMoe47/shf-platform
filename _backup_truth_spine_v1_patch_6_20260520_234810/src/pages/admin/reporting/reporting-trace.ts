export type ReportingTraceKind =
  | "briefing_export"
  | "action_log_export"
  | "analyst_memo_export"
  | "audit_pack_export";

export interface ReportingTraceRecord {
  exportKind: ReportingTraceKind;
  sourceObjectId: string;
  bridgeTraceId: string;
  canonicalEntityId: string;
  verificationRecordId: string;
  reportArtifactId: string;
  lineageId: string;
}

export function buildReportingTraceRecord(
  exportKind: ReportingTraceKind,
  overrides: Partial<ReportingTraceRecord> = {}
): ReportingTraceRecord {
  const base: Record<ReportingTraceKind, ReportingTraceRecord> = {
    briefing_export: {
      exportKind: "briefing_export",
      sourceObjectId: "hub_case_demo_001",
      bridgeTraceId: "live_bridge_hub_case_002",
      canonicalEntityId: "hub_case_demo_001",
      verificationRecordId: "ver_hub_case_demo_001",
      reportArtifactId: "rep_hub_case_demo_001",
      lineageId: "lineage_hub_case_demo_001_v1",
    },
    action_log_export: {
      exportKind: "action_log_export",
      sourceObjectId: "hub_case_demo_001",
      bridgeTraceId: "live_bridge_hub_case_002",
      canonicalEntityId: "hub_case_demo_001",
      verificationRecordId: "ver_hub_case_demo_001",
      reportArtifactId: "rep_hub_case_demo_001",
      lineageId: "lineage_hub_case_demo_001_v1",
    },
    analyst_memo_export: {
      exportKind: "analyst_memo_export",
      sourceObjectId: "hub_case_demo_001",
      bridgeTraceId: "live_bridge_hub_case_002",
      canonicalEntityId: "hub_case_demo_001",
      verificationRecordId: "ver_hub_case_demo_001",
      reportArtifactId: "rep_hub_case_demo_001",
      lineageId: "lineage_hub_case_demo_001_v1",
    },
    audit_pack_export: {
      exportKind: "audit_pack_export",
      sourceObjectId: "hub_case_demo_001",
      bridgeTraceId: "live_bridge_hub_case_002",
      canonicalEntityId: "hub_case_demo_001",
      verificationRecordId: "ver_hub_case_demo_001",
      reportArtifactId: "rep_hub_case_demo_001",
      lineageId: "lineage_hub_case_demo_001_v1",
    },
  };

  return {
    ...base[exportKind],
    ...overrides,
  };
}

export function getReportingTraceRows(
  exportKind: ReportingTraceKind,
  overrides: Partial<ReportingTraceRecord> = {}
) {
  const trace = buildReportingTraceRecord(exportKind, overrides);

  return [
    { label: "Source Object", value: trace.sourceObjectId },
    { label: "Bridge Trace", value: trace.bridgeTraceId },
    { label: "Canonical Entity", value: trace.canonicalEntityId },
    { label: "Verification Record", value: trace.verificationRecordId },
    { label: "Report Artifact", value: trace.reportArtifactId },
    { label: "Lineage ID", value: trace.lineageId },
  ];
}
