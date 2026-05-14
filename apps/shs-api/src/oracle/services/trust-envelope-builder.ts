import type {
  TrustEnvelope,
  TruthStatus,
  VerificationStatus,
  ContradictionStatus,
  ReadinessStatus,
  PublicationMode,
  ConfidenceBand,
} from "../domain/types";

export function buildTrustEnvelope(input: {
  traceId: string;
  truthStatus: TruthStatus;
  confidenceScore: number;
  confidenceBand: ConfidenceBand;
  verificationStatus: VerificationStatus;
  contradictionStatus: ContradictionStatus;
  readinessStatus: ReadinessStatus;
  publicationMode: PublicationMode;
  unresolvedItemsCount: number;
  warnings?: string[];
}): TrustEnvelope {
  return {
    traceId: input.traceId,
    oracleVersion: "0.1.0",
    lastUpdatedAt: new Date().toISOString(),
    truthStatus: input.truthStatus,
    confidenceScore: input.confidenceScore,
    confidenceBand: input.confidenceBand,
    verificationStatus: input.verificationStatus,
    contradictionStatus: input.contradictionStatus,
    readinessStatus: input.readinessStatus,
    publicationMode: input.publicationMode,
    unresolvedItemsCount: input.unresolvedItemsCount,
    warnings: input.warnings || [],
  };
}
