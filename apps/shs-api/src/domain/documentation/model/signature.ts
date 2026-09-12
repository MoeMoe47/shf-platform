export const ELECTRONIC_SIGNATURE_STATUSES = {
  DRAFT: "DRAFT", SENT: "SENT", VIEWED: "VIEWED", SIGNED: "SIGNED",
  DECLINED: "DECLINED", VOIDED: "VOIDED", EXPIRED: "EXPIRED", FAILED: "FAILED",
} as const;

export type ElectronicSignatureStatus = typeof ELECTRONIC_SIGNATURE_STATUSES[keyof typeof ELECTRONIC_SIGNATURE_STATUSES];
export type SignatureEnvironment = "TEST" | "SANDBOX" | "PRODUCTION";

export type SignatureRequestInput = {
  documentInstanceId: string;
  templateVersionId?: string;
  contentHash: string;
  owningDomain: string;
  requirementRuleId?: string;
  agreementReference?: string;
  agreementVersion?: string;
  signerReference: string;
  signerRole: string;
  signerCapacity?: string;
  representedPartyReference?: string;
  providerKey: string;
  providerEnvironment?: SignatureEnvironment;
  retentionPolicyKey?: string;
  legalHoldReference?: string;
  idempotencyKey?: string;
};

export type ProviderSignatureEvent = {
  eventReference: string;
  requestReference: string;
  normalizedStatus: ElectronicSignatureStatus;
  rawStatus: string;
  providerMetadata?: Record<string, unknown>;
  signedArtifact?: { reference: string; bytes?: Buffer; mediaType: string; hash?: string };
};

export function allowedSignatureTransition(from: ElectronicSignatureStatus, to: ElectronicSignatureStatus) {
  if (from === to) return true;
  const transitions: Record<ElectronicSignatureStatus, ElectronicSignatureStatus[]> = {
    DRAFT: ["SENT", "FAILED", "VOIDED"],
    SENT: ["VIEWED", "SIGNED", "DECLINED", "VOIDED", "EXPIRED", "FAILED"],
    VIEWED: ["SIGNED", "DECLINED", "VOIDED", "EXPIRED", "FAILED"],
    SIGNED: [], DECLINED: [], VOIDED: [], EXPIRED: [], FAILED: [],
  };
  return transitions[from]?.includes(to) || false;
}
