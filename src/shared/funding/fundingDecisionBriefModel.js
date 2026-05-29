import { buildImpactMeasurementModel } from "../impact/impactMeasurementModel.js";
import { buildImpactComparisonModel } from "../impact/impactComparisonModel.js";

function normalize(value, fallback = "unknown") {
  return String(value || fallback).toLowerCase().trim().replace(/[-\s]+/g, "_");
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function money(value) {
  return `$${number(value).toLocaleString()}`;
}

function percent(value) {
  return `${number(value)}%`;
}

function pickPrimaryEntity(comparisonModel) {
  return (
    comparisonModel?.leaders?.underfundedHighPerformer ||
    comparisonModel?.leaders?.bestScaleCandidate ||
    comparisonModel?.leaders?.highestFundingReadiness ||
    comparisonModel?.rows?.[0] ||
    null
  );
}

function buildDecisionFromSignals({ measurementModel, comparisonModel, primaryEntity }) {
  const metrics = measurementModel.metrics;
  const blockers = [...measurementModel.blockers];

  const weakEvidenceHigh = metrics.weakEvidenceRate >= 30;
  const pendingHigh = metrics.pendingRate >= 30;
  const verificationLow = metrics.verificationRate < 50;
  const fundingReady = metrics.fundingReadinessScore >= 80;
  const funderReview = metrics.fundingReadinessScore >= 60 && metrics.fundingReadinessScore < 80;
  const underfundedHighPerformer = Boolean(primaryEntity?.underfundedHighPerformer);
  const bestScaleCandidate = comparisonModel?.leaders?.bestScaleCandidate;

  if (!metrics.totalClaimedOutcomes) {
    return {
      decision: "do_not_publish",
      decisionLabel: "Do Not Publish Yet",
      posture: "blocked",
      confidence: 30,
      reason: "No outcome records are loaded, so SHS cannot support a funding decision brief yet.",
      blockers: ["outcomes_missing", ...blockers],
    };
  }

  if (weakEvidenceHigh) {
    return {
      decision: "review_before_funding",
      decisionLabel: "Review Before Funding",
      posture: "blocked",
      confidence: Math.max(40, metrics.evidenceStrengthScore),
      reason: "Weak-evidence risk is too high for a clean leadership or funder-facing decision.",
      blockers: ["weak_evidence_rate_high", ...blockers],
    };
  }

  if (verificationLow) {
    return {
      decision: "hold_funding",
      decisionLabel: "Hold Funding",
      posture: "review",
      confidence: Math.max(45, metrics.evidenceStrengthScore),
      reason: "Verified outcome coverage is below the level needed for a strong funding recommendation.",
      blockers: ["verification_rate_low", ...blockers],
    };
  }

  if (underfundedHighPerformer && fundingReady) {
    return {
      decision: "increase_or_defend_funding",
      decisionLabel: "Increase / Defend Funding",
      posture: "scale",
      confidence: Math.min(98, metrics.fundingReadinessScore),
      reason: `${primaryEntity.label} is an underfunded high performer with strong verified outcomes and funding readiness.`,
      blockers,
    };
  }

  if (bestScaleCandidate && fundingReady) {
    return {
      decision: "scale_program",
      decisionLabel: "Scale Program",
      posture: "scale",
      confidence: Math.min(96, metrics.fundingReadinessScore),
      reason: `${bestScaleCandidate.label} is the strongest scale candidate based on verified outcomes, evidence strength, cost, and funding readiness.`,
      blockers,
    };
  }

  if (funderReview || pendingHigh) {
    return {
      decision: "funder_review",
      decisionLabel: "Funder Review Needed",
      posture: "review",
      confidence: Math.max(60, metrics.fundingReadinessScore),
      reason: "The impact package is promising, but pending outcomes or funding-readiness limits require review before external use.",
      blockers: pendingHigh ? ["pending_outcomes_high", ...blockers] : blockers,
    };
  }

  return {
    decision: "funding_supported",
    decisionLabel: "Funding Supported",
    posture: "ready",
    confidence: Math.min(94, Math.max(70, metrics.fundingReadinessScore)),
    reason: "Verified outcomes, evidence strength, and funding readiness support a positive funding decision.",
    blockers,
  };
}

export function buildFundingDecisionBriefModel({
  outcomes = [],
  programs = [],
  partners = [],
  funding = [],
  comparisonEntities = [],
  audience = "leadership",
  source = "funding_decision_brief",
} = {}) {
  const measurementModel = buildImpactMeasurementModel({
    outcomes,
    programs,
    partners,
    funding,
    source: `${source}_measurement`,
  });

  const comparisonModel = buildImpactComparisonModel({
    entities: comparisonEntities.length ? comparisonEntities : programs,
    comparisonType: "program",
    source: `${source}_comparison`,
  });

  const primaryEntity = pickPrimaryEntity(comparisonModel);
  const decision = buildDecisionFromSignals({
    measurementModel,
    comparisonModel,
    primaryEntity,
  });

  const metrics = measurementModel.metrics;
  const weakestEvidenceRisk = comparisonModel.leaders?.weakestEvidenceRisk;
  const bestScaleCandidate = comparisonModel.leaders?.bestScaleCandidate;
  const underfundedHighPerformer = comparisonModel.leaders?.underfundedHighPerformer;

  const executiveSummary =
    decision.posture === "scale"
      ? "Impact Intelligence supports a scale or funding-defense decision based on verified outcomes, evidence strength, and performance comparison."
      : decision.posture === "blocked"
        ? "This funding brief should stay internal until evidence and verification blockers are resolved."
        : decision.posture === "review"
          ? "This funding brief is useful for internal review, but leadership should resolve review items before external publication."
          : "This funding brief supports leadership decision-making with verified impact and funding-readiness signals.";

  const evidenceBasis = [
    `Verified outcomes: ${metrics.verifiedOutcomes} of ${metrics.totalClaimedOutcomes} claimed outcomes.`,
    `Verification rate: ${percent(metrics.verificationRate)}.`,
    `Evidence strength: ${percent(metrics.evidenceStrengthScore)}.`,
    `Weak-evidence rate: ${percent(metrics.weakEvidenceRate)}.`,
    `Cost per verified outcome: ${money(metrics.costPerVerifiedOutcome)}.`,
    `Funding readiness: ${percent(metrics.fundingReadinessScore)} (${metrics.fundingReadinessLabel}).`,
  ];

  const riskNotes = [];

  if (metrics.pendingOutcomes > 0) {
    riskNotes.push(`${metrics.pendingOutcomes} outcomes remain pending.`);
  }

  if (metrics.weakEvidenceOutcomes > 0) {
    riskNotes.push(`${metrics.weakEvidenceOutcomes} outcomes have weak evidence.`);
  }

  if (weakestEvidenceRisk?.label) {
    riskNotes.push(`${weakestEvidenceRisk.label} has the highest weak-evidence risk at ${percent(weakestEvidenceRisk.metrics.weakEvidenceRate)}.`);
  }

  if (!riskNotes.length) {
    riskNotes.push("No major evidence or readiness risk is blocking this brief.");
  }

  const recommendedActions = [
    decision.decision === "increase_or_defend_funding"
      ? "Prepare a funding-defense brief and protect this program from cuts."
      : decision.decision === "scale_program"
        ? "Prepare a scale recommendation and identify expansion requirements."
        : decision.decision === "funder_review"
          ? "Send to internal funder-readiness review before external release."
          : decision.decision === "hold_funding"
            ? "Hold funding decision until verification coverage improves."
            : decision.decision === "review_before_funding"
              ? "Resolve weak-evidence issues before leadership/funder use."
              : decision.decision === "do_not_publish"
                ? "Load verified outcome records before generating a brief."
                : "Use this brief for leadership review and funding support.",
  ];

  if (underfundedHighPerformer?.label) {
    recommendedActions.push(`Review ${underfundedHighPerformer.label} as an underfunded high performer.`);
  }

  if (bestScaleCandidate?.label) {
    recommendedActions.push(`Use ${bestScaleCandidate.label} as the first scale-candidate comparison point.`);
  }

  return {
    source,
    audience,
    briefStatus: decision.posture,
    decision: decision.decision,
    decisionLabel: decision.decisionLabel,
    confidence: decision.confidence,
    executiveSummary,
    decisionReason: decision.reason,
    blockers: [...new Set(decision.blockers || [])],
    evidenceBasis,
    riskNotes,
    recommendedActions,
    metrics: {
      claimedOutcomes: metrics.totalClaimedOutcomes,
      verifiedOutcomes: metrics.verifiedOutcomes,
      pendingOutcomes: metrics.pendingOutcomes,
      weakEvidenceOutcomes: metrics.weakEvidenceOutcomes,
      verificationRate: metrics.verificationRate,
      evidenceStrengthScore: metrics.evidenceStrengthScore,
      costPerVerifiedOutcome: metrics.costPerVerifiedOutcome,
      fundingReadinessScore: metrics.fundingReadinessScore,
      fundingReadinessLabel: metrics.fundingReadinessLabel,
      comparedEntities: comparisonModel.summary.entityCount,
      underfundedHighPerformers: comparisonModel.summary.underfundedHighPerformerCount,
    },
    leaders: {
      bestScaleCandidate,
      underfundedHighPerformer,
      weakestEvidenceRisk,
      highestFundingReadiness: comparisonModel.leaders?.highestFundingReadiness || null,
      lowestCostPerVerifiedOutcome: comparisonModel.leaders?.lowestCostPerVerifiedOutcome || null,
    },
    models: {
      measurement: measurementModel,
      comparison: comparisonModel,
    },
  };
}

export function fundingBriefStatusClass(status) {
  const normalized = normalize(status);
  if (normalized === "scale") return "funding-brief--scale";
  if (normalized === "ready") return "funding-brief--ready";
  if (normalized === "review") return "funding-brief--review";
  if (normalized === "blocked") return "funding-brief--blocked";
  return "funding-brief--pending";
}

export function buildFundingDecisionBriefRows(brief) {
  if (!brief) return [];

  return [
    ["Decision", brief.decisionLabel],
    ["Confidence", percent(brief.confidence)],
    ["Verified Outcomes", brief.metrics.verifiedOutcomes],
    ["Verification Rate", percent(brief.metrics.verificationRate)],
    ["Evidence Strength", percent(brief.metrics.evidenceStrengthScore)],
    ["Cost / Verified Outcome", money(brief.metrics.costPerVerifiedOutcome)],
    ["Funding Readiness", percent(brief.metrics.fundingReadinessScore)],
    ["Underfunded High Performers", brief.metrics.underfundedHighPerformers],
  ];
}
