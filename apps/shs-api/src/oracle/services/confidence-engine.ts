import type { ConfidenceBand } from "../domain/types.js";

export function deriveConfidenceBand(score: number): ConfidenceBand {
  if (score >= 90) return "very_high";
  if (score >= 75) return "high";
  if (score >= 55) return "moderate";
  return "low";
}

export function computeConfidenceScore(input: {
  sourceCount?: number;
  verificationStatus?: string;
  contradictionStatus?: string;
  completeness?: number;
  freshnessBonus?: number;
}): { confidenceScore: number; confidenceBand: ConfidenceBand } {
  let score = 50;

  score += Math.min((input.sourceCount || 0) * 8, 24);
  score += Math.max(0, Math.min(input.completeness || 0, 20));
  score += Math.max(0, Math.min(input.freshnessBonus || 0, 10));

  if (input.verificationStatus === "verified") score += 18;
  if (input.verificationStatus === "insufficient_evidence") score -= 18;
  if (input.verificationStatus === "rejected") score -= 28;

  if (input.contradictionStatus === "minor_conflict") score -= 8;
  if (input.contradictionStatus === "unresolved_conflict") score -= 18;
  if (input.contradictionStatus === "escalated") score -= 25;

  score = Math.max(0, Math.min(100, score));

  return {
    confidenceScore: score,
    confidenceBand: deriveConfidenceBand(score),
  };
}
