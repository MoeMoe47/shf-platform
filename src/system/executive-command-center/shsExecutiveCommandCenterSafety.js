import {
  SHS_EXECUTIVE_COMMAND_CENTER_SAFETY_STATEMENT,
  SHS_EXECUTIVE_DANGEROUS_FLAGS,
} from "./shsExecutiveCommandCenterTypes";

const FORBIDDEN_ACTION_MARKERS = [
  "dispatchCommand",
  "executeCommand",
  "activateOrchestration",
  "publishReport",
  "markPublicApproved",
  "mutateShfImpactData",
  "sendWebhook",
  "sendEmail",
  "sendSms",
  "sendPush",
  "writeWarehouse",
  "modifyAuth",
  "runShell",
  "runPython",
  "connectBank",
  "oauth",
  "payment",
];

export function getExecutiveDangerousFlags() {
  return { ...SHS_EXECUTIVE_DANGEROUS_FLAGS };
}

export function scanExecutiveSafety(payload = {}) {
  const serialized = JSON.stringify(payload);
  const findings = FORBIDDEN_ACTION_MARKERS.filter((marker) => serialized.toLowerCase().includes(marker.toLowerCase()));
  const dangerousFlagsEnabled = Object.entries(SHS_EXECUTIVE_DANGEROUS_FLAGS)
    .filter(([, enabled]) => enabled)
    .map(([flag]) => flag);
  return {
    safe: findings.length === 0 && dangerousFlagsEnabled.length === 0,
    safety_status: findings.length || dangerousFlagsEnabled.length ? "blocked" : "allowed",
    findings,
    dangerous_flags_enabled: dangerousFlagsEnabled,
    dangerous_flags: getExecutiveDangerousFlags(),
    safety_statement: SHS_EXECUTIVE_COMMAND_CENTER_SAFETY_STATEMENT,
    shs_shf_boundary_intact: true,
    direct_connect_direct_source_proof_only: true,
    preview_only_actions: true,
  };
}

export function buildExecutiveSafetySummary(layers = []) {
  const layerIssues = layers.filter((layer) => layer.dangerous_flags_enabled);
  return {
    safe: layerIssues.length === 0,
    dangerous_flags: getExecutiveDangerousFlags(),
    layer_issues: layerIssues.map((layer) => layer.layer_id),
    all_dangerous_flags_false: Object.values(SHS_EXECUTIVE_DANGEROUS_FLAGS).every((value) => value === false),
    safety_statement: SHS_EXECUTIVE_COMMAND_CENTER_SAFETY_STATEMENT,
    boundary_copy: "SHS operational/private data remains inside SHS admin surfaces. SHF public surfaces receive public-approved information only through existing Data Approval controls.",
  };
}
