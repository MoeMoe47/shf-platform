export type ReportingTraceActionKind =
  | "open_source_object"
  | "open_bridge_trace"
  | "open_verification_record"
  | "open_report_artifact";

export interface ReportingTraceActionInput {
  actionKind: ReportingTraceActionKind;
  targetId: string;
  exportKind?: string;
}

export interface ReportingTraceActionResult {
  actionKind: ReportingTraceActionKind;
  targetId: string;
  exportKind?: string;
  status: "ready";
  message: string;
}

export function runReportingTraceAction(
  input: ReportingTraceActionInput
): ReportingTraceActionResult {
  const labelMap: Record<ReportingTraceActionKind, string> = {
    open_source_object: "Source object",
    open_bridge_trace: "Bridge trace",
    open_verification_record: "Verification record",
    open_report_artifact: "Report artifact",
  };

  return {
    actionKind: input.actionKind,
    targetId: input.targetId,
    exportKind: input.exportKind,
    status: "ready",
    message: `${labelMap[input.actionKind]} opened for ${input.targetId}.`,
  };
}

export function buildReportingTraceActions(traceRows: Array<{ label: string; value: string }>) {
  const findValue = (label: string) =>
    traceRows.find((row) => row.label === label)?.value || "";

  return {
    sourceObjectId: findValue("Source Object"),
    bridgeTraceId: findValue("Bridge Trace"),
    verificationRecordId: findValue("Verification Record"),
    reportArtifactId: findValue("Report Artifact"),
  };
}
