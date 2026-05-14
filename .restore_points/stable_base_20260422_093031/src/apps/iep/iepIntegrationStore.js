export const iepSystemState = {
  summary: {
    totalStudents: 4,
    highRiskCount: 1,
    needsAttentionCount: 1,
    onTrackCount: 2,
    verifiedImprovementCount: 2,
    projectedFunding: 78500
  },

  riskEvents: [
    {
      id: "risk_001",
      studentId: "stu_002",
      studentName: "Jason T.",
      type: "low_engagement",
      severity: "high",
      confidence: 0.84,
      recommendedAction: "assign_intervention"
    }
  ],

  fundingSnapshot: {
    eligibleStudents: 2,
    projectedIDEAFunding: 78500,
    verificationStatus: "partial",
    readinessScore: 82
  }
};

export function getIEPSummary() {
  return iepSystemState.summary;
}

export function getIEPRiskEvents() {
  return iepSystemState.riskEvents;
}

export function getIEPFundingSnapshot() {
  return iepSystemState.fundingSnapshot;
}
