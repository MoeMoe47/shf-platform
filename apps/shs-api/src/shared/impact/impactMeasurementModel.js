function normalize(value, fallback = "unknown") {
  return String(value || fallback).toLowerCase().trim().replace(/[-\s]+/g, "_");
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, number(value)));
}

function percent(numerator, denominator) {
  const top = number(numerator);
  const bottom = number(denominator);
  if (!bottom) return 0;
  return Math.round((top / bottom) * 100);
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function outcomeStatus(outcome = {}) {
  return normalize(
    outcome.status ||
      outcome.verificationStatus ||
      outcome.evidenceStatus ||
      outcome.truthStatus ||
      "claimed"
  );
}

function evidenceStatus(outcome = {}) {
  return normalize(
    outcome.evidenceStatus ||
      outcome.verificationStatus ||
      outcome.truthStatus ||
      "unknown"
  );
}

function evidenceScore(outcome = {}) {
  if (outcome.evidenceScore !== undefined) return clamp(outcome.evidenceScore);
  if (outcome.confidenceScore !== undefined) return clamp(outcome.confidenceScore);
  if (outcome.trustScore !== undefined) return clamp(outcome.trustScore);

  const status = evidenceStatus(outcome);

  if (status === "verified" || status === "certified") return 95;
  if (status === "in_review" || status === "pending") return 62;
  if (status === "weak" || status === "insufficient_evidence") return 38;
  if (status === "rejected" || status === "disputed") return 20;

  return 50;
}

function isVerified(outcome = {}) {
  const status = outcomeStatus(outcome);
  const evidence = evidenceStatus(outcome);

  return (
    status === "verified" ||
    status === "certified" ||
    evidence === "verified" ||
    evidence === "certified"
  );
}

function isPending(outcome = {}) {
  const status = outcomeStatus(outcome);
  const evidence = evidenceStatus(outcome);

  return (
    status === "pending" ||
    status === "in_review" ||
    evidence === "pending" ||
    evidence === "in_review" ||
    evidence === "unreviewed"
  );
}

function isWeakEvidence(outcome = {}) {
  const status = outcomeStatus(outcome);
  const evidence = evidenceStatus(outcome);
  const score = evidenceScore(outcome);

  return (
    status === "weak" ||
    status === "insufficient_evidence" ||
    evidence === "weak" ||
    evidence === "insufficient_evidence" ||
    score < 50
  );
}

function outcomeValue(outcome = {}) {
  return number(
    outcome.value ??
      outcome.outcomeValue ??
      outcome.count ??
      outcome.verifiedCount ??
      1,
    1
  );
}

function outcomeCost(outcome = {}) {
  return number(
    outcome.cost ??
      outcome.totalCost ??
      outcome.spend ??
      outcome.fundingAmount ??
      outcome.grantAmount ??
      0
  );
}

export function buildImpactMeasurementModel({
  outcomes = [],
  programs = [],
  partners = [],
  funding = [],
  source = "impact_intelligence",
} = {}) {
  const records = safeArray(outcomes);
  const totalClaimedOutcomes = records.reduce((sum, item) => sum + outcomeValue(item), 0);

  const verifiedRecords = records.filter(isVerified);
  const pendingRecords = records.filter(isPending);
  const weakEvidenceRecords = records.filter(isWeakEvidence);

  const verifiedOutcomes = verifiedRecords.reduce((sum, item) => sum + outcomeValue(item), 0);
  const pendingOutcomes = pendingRecords.reduce((sum, item) => sum + outcomeValue(item), 0);
  const weakEvidenceOutcomes = weakEvidenceRecords.reduce((sum, item) => sum + outcomeValue(item), 0);

  const totalCost =
    records.reduce((sum, item) => sum + outcomeCost(item), 0) ||
    safeArray(funding).reduce(
      (sum, item) =>
        sum +
        number(
          item.amount ??
            item.total ??
            item.fundingAmount ??
            item.grantAmount ??
            item.spend
        ),
      0
    );

  const costPerClaimedOutcome = totalClaimedOutcomes ? Math.round(totalCost / totalClaimedOutcomes) : 0;
  const costPerVerifiedOutcome = verifiedOutcomes ? Math.round(totalCost / verifiedOutcomes) : 0;

  const evidenceScores = records.map(evidenceScore);
  const evidenceStrengthScore = evidenceScores.length
    ? Math.round(evidenceScores.reduce((sum, score) => sum + score, 0) / evidenceScores.length)
    : 0;

  const verificationRate = percent(verifiedOutcomes, totalClaimedOutcomes);
  const pendingRate = percent(pendingOutcomes, totalClaimedOutcomes);
  const weakEvidenceRate = percent(weakEvidenceOutcomes, totalClaimedOutcomes);

  const programCount = safeArray(programs).length;
  const partnerCount = safeArray(partners).length;

  let impactStatus = "ready";
  let impactLabel = "Impact Measured";
  let recommendedNextAction = "Use this impact package for comparison, reporting, and funding decision support.";

  const blockers = [];

  if (!records.length) {
    impactStatus = "not_started";
    impactLabel = "No Outcomes Loaded";
    recommendedNextAction = "Load outcome records before measuring impact.";
    blockers.push("outcomes_missing");
  }

  if (weakEvidenceRate >= 30) {
    impactStatus = "blocked";
    impactLabel = "Weak Evidence Risk";
    recommendedNextAction = "Strengthen evidence before leadership, funder, or public reporting.";
    blockers.push("weak_evidence_rate_high");
  } else if (pendingRate >= 30 && impactStatus !== "blocked") {
    impactStatus = "review";
    impactLabel = "Impact Review Needed";
    recommendedNextAction = "Review pending outcomes before using this package for funding decisions.";
    blockers.push("pending_outcomes_high");
  }

  if (verificationRate < 50 && records.length && impactStatus !== "blocked") {
    impactStatus = "review";
    impactLabel = "Verification Coverage Low";
    recommendedNextAction = "Increase verified outcome coverage before using this package externally.";
    blockers.push("verification_rate_low");
  }

  const fundingReadinessScore = Math.round(
    verificationRate * 0.45 +
      evidenceStrengthScore * 0.35 +
      (100 - weakEvidenceRate) * 0.2
  );

  let fundingReadinessLabel = "Funder Ready";
  if (fundingReadinessScore < 60) fundingReadinessLabel = "Not Funder Ready";
  else if (fundingReadinessScore < 80) fundingReadinessLabel = "Funder Review Needed";

  const scaleRecommendation =
    verificationRate >= 75 && evidenceStrengthScore >= 80 && weakEvidenceRate <= 15
      ? "Scale this program or partner lane with confidence."
      : verificationRate >= 50
        ? "Pilot expansion is possible after evidence review."
        : "Do not scale until verification and evidence strength improve.";

  return {
    source,
    impactStatus,
    impactLabel,
    recommendedNextAction,
    blockers,
    metrics: {
      totalClaimedOutcomes,
      verifiedOutcomes,
      pendingOutcomes,
      weakEvidenceOutcomes,
      verificationRate,
      pendingRate,
      weakEvidenceRate,
      evidenceStrengthScore,
      totalCost,
      costPerClaimedOutcome,
      costPerVerifiedOutcome,
      programCount,
      partnerCount,
      fundingReadinessScore,
      fundingReadinessLabel,
    },
    recommendations: {
      scaleRecommendation,
      fundingDecision:
        fundingReadinessScore >= 80
          ? "Strong candidate for funding defense or expansion."
          : fundingReadinessScore >= 60
            ? "Hold for funder review with evidence notes."
            : "Do not present as funder-ready until evidence improves.",
    },
    records: {
      total: records.length,
      verified: verifiedRecords.length,
      pending: pendingRecords.length,
      weakEvidence: weakEvidenceRecords.length,
    },
  };
}

export function impactStatusClass(status) {
  const normalized = normalize(status);
  if (normalized === "ready") return "impact-intelligence--ready";
  if (normalized === "review") return "impact-intelligence--review";
  if (normalized === "blocked") return "impact-intelligence--blocked";
  return "impact-intelligence--pending";
}

export function buildImpactScorecardRows(model) {
  if (!model) return [];

  return [
    ["Claimed Outcomes", model.metrics.totalClaimedOutcomes],
    ["Verified Outcomes", model.metrics.verifiedOutcomes],
    ["Pending Outcomes", model.metrics.pendingOutcomes],
    ["Weak Evidence", model.metrics.weakEvidenceOutcomes],
    ["Verification Rate", `${model.metrics.verificationRate}%`],
    ["Evidence Strength", `${model.metrics.evidenceStrengthScore}%`],
    ["Cost / Verified Outcome", `$${model.metrics.costPerVerifiedOutcome.toLocaleString()}`],
    ["Funding Readiness", `${model.metrics.fundingReadinessScore}%`],
  ];
}
