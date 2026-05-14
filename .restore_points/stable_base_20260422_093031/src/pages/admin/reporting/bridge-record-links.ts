export interface BridgeRecordLink {
  sourceCaseId: string;
  verificationRecordId: string;
  bridgeTraceId: string;
  reportArtifactId: string;
}

const LINKS: BridgeRecordLink[] = [
  {
    sourceCaseId: "case_1dfc9e8d-1daf-43a8-b892-360cfe068620",
    verificationRecordId: "ver_hub_case_002",
    bridgeTraceId: "live_bridge_hub_case_002",
    reportArtifactId: "rep_hub_case_demo_001",
  },
  {
    sourceCaseId: "hub_case_demo_001",
    verificationRecordId: "ver_hub_case_demo_001",
    bridgeTraceId: "live_bridge_hub_case_demo_001",
    reportArtifactId: "rep_hub_case_demo_001",
  },
];

export function findBridgeLinkBySourceCaseId(sourceCaseId?: string | null) {
  if (!sourceCaseId) return null;
  return LINKS.find((item) => item.sourceCaseId === sourceCaseId) || null;
}

export function findBridgeLinkByVerificationRecordId(verificationRecordId?: string | null) {
  if (!verificationRecordId) return null;
  return LINKS.find((item) => item.verificationRecordId === verificationRecordId) || null;
}
