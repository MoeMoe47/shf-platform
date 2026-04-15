export type TrustEnvelope = {
  confidenceScore: number;
  verificationStatus: string;
  evidenceStrength: string;
  freshnessTimestamp: string;
  sourceCount: number;
  lineageRef: string;
  discrepancyStatus: string;
  rulesVersion: string;
  deIdentificationStatus: string;
  consentScope: string;
};

export type CertifiedAggregationContext = {
  contextId: string;
  surface: string;
  entityType: "county" | "organization" | "hub" | "program" | "pathway" | "referral_cohort";
  entityId: string;
  period: { start: string; end: string };
  metrics: Array<{
    metricId: string;
    metricName: string;
    value: number | string;
    trust: TrustEnvelope;
  }>;
  sourceCoverage: {
    expectedSources: number;
    activeSources: number;
    staleSources: number;
  };
  openDiscrepancies: number;
  unmetNeeds: Array<{ category: string; count: number }>;
  topRisks: string[];
  cautions: string[];
  recommendedNextMoves: string[];
  publishedAt: string;
};
