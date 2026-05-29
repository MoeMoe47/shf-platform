import { buildImpactMeasurementModel } from "./impactMeasurementModel";

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

function entityLabel(entity = {}) {
  return (
    entity.label ||
    entity.name ||
    entity.title ||
    entity.program ||
    entity.partner ||
    entity.funder ||
    entity.region ||
    entity.county ||
    entity.id ||
    "Unknown Entity"
  );
}

function entityId(entity = {}) {
  return (
    entity.id ||
    entity.programId ||
    entity.partnerId ||
    entity.funderId ||
    entity.regionId ||
    normalize(entityLabel(entity))
  );
}

function entityType(entity = {}, fallback = "program") {
  return normalize(entity.type || entity.entityType || fallback);
}

function compareDesc(metric) {
  return (a, b) => number(b.metrics?.[metric]) - number(a.metrics?.[metric]);
}

function compareAsc(metric) {
  return (a, b) => number(a.metrics?.[metric]) - number(b.metrics?.[metric]);
}

function rankRows(rows = []) {
  return rows.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}

function buildEntityRow(entity = {}, fallbackType = "program") {
  const model = buildImpactMeasurementModel({
    source: `comparison_${entityId(entity)}`,
    outcomes: safeArray(entity.outcomes),
    programs: safeArray(entity.programs || (entityType(entity, fallbackType) === "program" ? [entity] : [])),
    partners: safeArray(entity.partners || (entityType(entity, fallbackType) === "partner" ? [entity] : [])),
    funding: safeArray(entity.funding),
  });

  const fundingAmount =
    safeArray(entity.funding).reduce(
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
    ) || number(entity.fundingAmount || entity.totalFunding || entity.spend || 0);

  const underfundedHighPerformer =
    model.metrics.verificationRate >= 70 &&
    model.metrics.evidenceStrengthScore >= 75 &&
    model.metrics.costPerVerifiedOutcome > 0 &&
    fundingAmount < 100000;

  let comparisonStatus = "ready";
  let comparisonLabel = "Strong Performer";

  if (model.metrics.weakEvidenceRate >= 30) {
    comparisonStatus = "blocked";
    comparisonLabel = "Weak Evidence Risk";
  } else if (model.metrics.verificationRate < 50 || model.metrics.fundingReadinessScore < 60) {
    comparisonStatus = "review";
    comparisonLabel = "Needs Review";
  } else if (underfundedHighPerformer) {
    comparisonStatus = "scale";
    comparisonLabel = "Underfunded High Performer";
  }

  return {
    id: entityId(entity),
    label: entityLabel(entity),
    type: entityType(entity, fallbackType),
    comparisonStatus,
    comparisonLabel,
    underfundedHighPerformer,
    fundingAmount,
    metrics: {
      ...model.metrics,
      impactEfficiencyScore: Math.round(
        model.metrics.verificationRate * 0.35 +
          model.metrics.evidenceStrengthScore * 0.3 +
          model.metrics.fundingReadinessScore * 0.25 +
          (100 - model.metrics.weakEvidenceRate) * 0.1
      ),
    },
    recommendations: model.recommendations,
    blockers: model.blockers,
    records: model.records,
  };
}

export function buildImpactComparisonModel({
  entities = [],
  comparisonType = "program",
  source = "impact_comparison",
} = {}) {
  const rows = safeArray(entities).map((entity) => buildEntityRow(entity, comparisonType));

  const byVerificationRate = rankRows([...rows].sort(compareDesc("verificationRate")));
  const byCostEfficiency = rankRows(
    [...rows]
      .filter((row) => number(row.metrics.costPerVerifiedOutcome) > 0)
      .sort(compareAsc("costPerVerifiedOutcome"))
  );
  const byEvidenceStrength = rankRows([...rows].sort(compareDesc("evidenceStrengthScore")));
  const byFundingReadiness = rankRows([...rows].sort(compareDesc("fundingReadinessScore")));
  const byImpactEfficiency = rankRows([...rows].sort(compareDesc("impactEfficiencyScore")));
  const byWeakEvidenceRisk = rankRows([...rows].sort(compareDesc("weakEvidenceRate")));
  const underfundedHighPerformers = rows
    .filter((row) => row.underfundedHighPerformer)
    .sort(compareDesc("impactEfficiencyScore"));

  const topScaleCandidate = byImpactEfficiency[0] || null;
  const weakestEvidenceRisk = byWeakEvidenceRisk[0] || null;
  const bestCostEfficiency = byCostEfficiency[0] || null;
  const strongestEvidence = byEvidenceStrength[0] || null;

  let comparisonStatus = "ready";
  let comparisonLabel = "Impact Comparison Ready";
  let recommendedNextAction = "Use comparison rankings to support scale, funding, and performance decisions.";

  if (!rows.length) {
    comparisonStatus = "not_started";
    comparisonLabel = "No Comparison Entities";
    recommendedNextAction = "Load program, partner, funder, or region entities before comparison.";
  } else if (weakestEvidenceRisk && weakestEvidenceRisk.metrics.weakEvidenceRate >= 30) {
    comparisonStatus = "review";
    comparisonLabel = "Evidence Risk Review Needed";
    recommendedNextAction = "Review weak-evidence entities before using comparison results externally.";
  }

  if (underfundedHighPerformers.length) {
    comparisonLabel = "Underfunded High Performer Found";
    recommendedNextAction = "Review underfunded high performers for funding defense or scale recommendation.";
  }

  return {
    source,
    comparisonType,
    comparisonStatus,
    comparisonLabel,
    recommendedNextAction,
    rows,
    leaders: {
      highestVerifiedOutcomeRate: byVerificationRate[0] || null,
      lowestCostPerVerifiedOutcome: bestCostEfficiency,
      strongestEvidence,
      highestFundingReadiness: byFundingReadiness[0] || null,
      bestScaleCandidate: topScaleCandidate,
      weakestEvidenceRisk,
      underfundedHighPerformer: underfundedHighPerformers[0] || null,
    },
    rankings: {
      byVerificationRate,
      byCostEfficiency,
      byEvidenceStrength,
      byFundingReadiness,
      byImpactEfficiency,
      byWeakEvidenceRisk,
      underfundedHighPerformers,
    },
    summary: {
      entityCount: rows.length,
      readyCount: rows.filter((row) => row.comparisonStatus === "ready" || row.comparisonStatus === "scale").length,
      reviewCount: rows.filter((row) => row.comparisonStatus === "review").length,
      blockedCount: rows.filter((row) => row.comparisonStatus === "blocked").length,
      underfundedHighPerformerCount: underfundedHighPerformers.length,
    },
  };
}

export function impactComparisonStatusClass(status) {
  const normalized = normalize(status);
  if (normalized === "ready") return "impact-comparison--ready";
  if (normalized === "scale") return "impact-comparison--scale";
  if (normalized === "review") return "impact-comparison--review";
  if (normalized === "blocked") return "impact-comparison--blocked";
  return "impact-comparison--pending";
}

export function buildImpactComparisonLeaderRows(model) {
  if (!model) return [];

  const leaders = model.leaders || {};

  return [
    ["Highest Verified Rate", leaders.highestVerifiedOutcomeRate],
    ["Lowest Cost / Verified Outcome", leaders.lowestCostPerVerifiedOutcome],
    ["Strongest Evidence", leaders.strongestEvidence],
    ["Highest Funding Readiness", leaders.highestFundingReadiness],
    ["Best Scale Candidate", leaders.bestScaleCandidate],
    ["Weakest Evidence Risk", leaders.weakestEvidenceRisk],
    ["Underfunded High Performer", leaders.underfundedHighPerformer],
  ].map(([label, row]) => ({
    label,
    entity: row?.label || "—",
    value:
      label === "Lowest Cost / Verified Outcome"
        ? row?.metrics?.costPerVerifiedOutcome
          ? `$${Number(row.metrics.costPerVerifiedOutcome).toLocaleString()}`
          : "—"
        : label === "Weakest Evidence Risk"
          ? row?.metrics?.weakEvidenceRate !== undefined
            ? `${row.metrics.weakEvidenceRate}%`
            : "—"
          : row?.metrics?.fundingReadinessScore !== undefined
            ? `${row.metrics.fundingReadinessScore}%`
            : "—",
    status: row?.comparisonStatus || "unknown",
  }));
}
