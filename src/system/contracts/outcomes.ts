export interface OutcomeState {
  outcomeId: string;
  entityId: string;
  caseId: string;
  currentState: "stable" | "improving" | "at_risk" | "critical";
  confidenceScore: number;
  likelyNextState: string;
  lastUpdatedAt: string;
}

export interface OutcomeRecommendation {
  recommendationId: string;
  outcomeId: string;
  priority: "low" | "medium" | "high";
  action: string;
  rationale: string;
  expectedImpact: string;
  confidenceScore: number;
}

export interface SimulationResult {
  simulationId: string;
  outcomeId: string;
  scenarioLabel: string;
  projectedState: string;
  projectedImpact: string;
  confidenceScore: number;
  createdAt: string;
}

export interface FundingCondition {
  fundingConditionId: string;
  outcomeId: string;
  fundingReadiness: "not_ready" | "conditional" | "ready";
  rationale: string;
  requiredActions: string[];
}

export interface NarrativeSummary {
  summaryId: string;
  outcomeId: string;
  title: string;
  summaryText: string;
  generatedAt: string;
}

export interface OutcomeConfidence {
  outcomeId: string;
  confidenceScore: number;
  confidenceLabel: "low" | "medium" | "high";
  explanation: string;
}
