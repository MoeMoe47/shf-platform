const API_BASE = "http://127.0.0.1:8090";

export async function fetchReportPdf(runId: string) {
  const url = `${API_BASE}/runs/report/${runId}/pdf`;
  window.open(url, "_blank");
  return {
    runId,
    url,
    createdAt: new Date().toISOString(),
  };
}

// Temporary mapping (replace later with real run creation endpoint)
export function resolveRunIdFromArtifact(artifactId: string): string {
  // Map UI artifacts → backend run IDs
  const map: Record<string, string> = {
    rep_hub_case_demo_001: "pilot_test_001",
    rep_action_log_demo_001: "pilot_test_001",
    rep_analyst_memo_demo_001: "pilot_test_001",
    rep_audit_pack_demo_001: "pilot_test_001",
  };

  return map[artifactId] || "pilot_test_001";
}
