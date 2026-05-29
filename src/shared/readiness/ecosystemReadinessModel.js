function normalize(value, fallback = "unknown") {
  return String(value || fallback).toLowerCase().trim().replace(/[-\s]+/g, "_");
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function clamp(value, min = 0, max = 100) {
  const parsed = Number(value);
  const safe = Number.isFinite(parsed) ? parsed : 0;
  return Math.max(min, Math.min(max, safe));
}

export const SHS_V1_REQUIRED_BACKBONES = Object.freeze([
  "truth_spine",
  "security_identity_spine",
  "ai_analyst_spine",
  "aggregation_verification_ui",
  "reporting_export",
  "hub_partner_workflow",
  "impact_intelligence",
  "funding_decision_briefs",
  "adaptive_feedback_loop",
]);

export const SHS_V1_BACKBONE_LABELS = Object.freeze({
  truth_spine: "Truth Spine V1",
  security_identity_spine: "Security + Identity Spine V1",
  ai_analyst_spine: "AI Analyst Spine V1",
  aggregation_verification_ui: "Aggregation + Verification UI V1",
  reporting_export: "Reporting + Export V1",
  hub_partner_workflow: "SHS Hub / Partner Workflow V1",
  impact_intelligence: "Impact Intelligence V1",
  funding_decision_briefs: "Funding Decision Briefs V1",
  adaptive_feedback_loop: "Adaptive Feedback Loop V1",
});

export function buildReadinessBackbone({
  id,
  label,
  status = "missing",
  modelActive = false,
  surfaceActive = false,
  exportConnected = false,
  auditPassed = false,
  driftClean = false,
  buildPassed = false,
  backendPassed = false,
  notes = [],
} = {}) {
  const normalizedId = normalize(id);
  const checks = {
    modelActive: Boolean(modelActive),
    surfaceActive: Boolean(surfaceActive),
    exportConnected: Boolean(exportConnected),
    auditPassed: Boolean(auditPassed),
    driftClean: Boolean(driftClean),
    buildPassed: Boolean(buildPassed),
    backendPassed: Boolean(backendPassed),
  };

  const score = Math.round(
    [
      checks.modelActive ? 18 : 0,
      checks.surfaceActive ? 18 : 0,
      checks.exportConnected ? 12 : 0,
      checks.auditPassed ? 18 : 0,
      checks.driftClean ? 12 : 0,
      checks.buildPassed ? 11 : 0,
      checks.backendPassed ? 11 : 0,
    ].reduce((sum, value) => sum + value, 0)
  );

  let readinessStatus = "missing";
  let readinessLabel = "Missing";

  if (score >= 90) {
    readinessStatus = "locked";
    readinessLabel = "Locked";
  } else if (score >= 70) {
    readinessStatus = "ready_review";
    readinessLabel = "Ready Review";
  } else if (score >= 45) {
    readinessStatus = "partial";
    readinessLabel = "Partial";
  }

  return {
    id: normalizedId,
    label: label || SHS_V1_BACKBONE_LABELS[normalizedId] || normalizedId,
    status,
    readinessStatus,
    readinessLabel,
    readinessScore: clamp(score),
    checks,
    notes: safeArray(notes),
  };
}

export function buildEcosystemReadinessModel({
  backbones = [],
  buildHealth = {},
  backendHealth = {},
  driftFindings = [],
  importRisks = [],
  source = "shs_ecosystem_readiness_v1",
} = {}) {
  const suppliedById = new Map(
    safeArray(backbones).map((backbone) => [normalize(backbone.id), backbone])
  );

  const rows = SHS_V1_REQUIRED_BACKBONES.map((id) =>
    buildReadinessBackbone({
      id,
      label: SHS_V1_BACKBONE_LABELS[id],
      ...(suppliedById.get(id) || {}),
    })
  );

  const lockedRows = rows.filter((row) => row.readinessStatus === "locked");
  const partialRows = rows.filter((row) => row.readinessStatus === "partial");
  const reviewRows = rows.filter((row) => row.readinessStatus === "ready_review");
  const missingRows = rows.filter((row) => row.readinessStatus === "missing");

  const averageBackboneScore = rows.length
    ? Math.round(rows.reduce((sum, row) => sum + row.readinessScore, 0) / rows.length)
    : 0;

  const frontendPassed = Boolean(buildHealth.frontendBuildPassed);
  const backendPassed = Boolean(backendHealth.backendTypecheckPassed && backendHealth.backendBuildPassed);
  const driftClean = safeArray(driftFindings).length === 0;
  const importRiskClean = safeArray(importRisks).length === 0;

  let readinessScore = averageBackboneScore;

  if (frontendPassed) readinessScore += 3;
  if (backendPassed) readinessScore += 3;
  if (driftClean) readinessScore += 2;
  if (importRiskClean) readinessScore += 2;

  readinessScore = clamp(readinessScore);

  let readinessStatus = "not_ready";
  let readinessLabel = "Not Ready";
  let recommendedNextAction = "Resolve missing V1 backbones before launch readiness review.";

  if (readinessScore >= 95 && lockedRows.length === SHS_V1_REQUIRED_BACKBONES.length && frontendPassed && backendPassed && driftClean) {
    readinessStatus = "v1_locked";
    readinessLabel = "V1 Locked";
    recommendedNextAction = "Prepare final launch-readiness signoff and production hardening checklist.";
  } else if (readinessScore >= 85 && missingRows.length === 0) {
    readinessStatus = "launch_review";
    readinessLabel = "Launch Review";
    recommendedNextAction = "Run final drift, import, route, and security review before calling V1 launch-ready.";
  } else if (readinessScore >= 70) {
    readinessStatus = "system_review";
    readinessLabel = "System Review Needed";
    recommendedNextAction = "Complete partial or review backbones before V1 lock.";
  }

  const openRisks = [
    ...missingRows.map((row) => `${row.label} is missing.`),
    ...partialRows.map((row) => `${row.label} is partial.`),
    ...reviewRows.map((row) => `${row.label} needs readiness review.`),
    ...safeArray(driftFindings).map((item) => `Drift finding: ${item}`),
    ...safeArray(importRisks).map((item) => `Import risk: ${item}`),
  ];

  return {
    source,
    readinessStatus,
    readinessLabel,
    readinessScore,
    recommendedNextAction,
    summary: {
      requiredBackbones: SHS_V1_REQUIRED_BACKBONES.length,
      lockedBackbones: lockedRows.length,
      reviewBackbones: reviewRows.length,
      partialBackbones: partialRows.length,
      missingBackbones: missingRows.length,
      frontendBuildPassed: frontendPassed,
      backendValidationPassed: backendPassed,
      driftClean,
      importRiskClean,
    },
    rows,
    openRisks,
    lockedBackbones: lockedRows,
    missingBackbones: missingRows,
  };
}

export function ecosystemReadinessStatusClass(status) {
  const normalized = normalize(status);
  if (normalized === "v1_locked") return "ecosystem-readiness--locked";
  if (normalized === "launch_review") return "ecosystem-readiness--review";
  if (normalized === "system_review") return "ecosystem-readiness--warning";
  return "ecosystem-readiness--blocked";
}

export function buildEcosystemReadinessRows(model) {
  if (!model) return [];

  return [
    ["V1 Readiness Score", `${model.readinessScore}%`],
    ["Locked Backbones", `${model.summary.lockedBackbones}/${model.summary.requiredBackbones}`],
    ["Review Backbones", model.summary.reviewBackbones],
    ["Partial Backbones", model.summary.partialBackbones],
    ["Missing Backbones", model.summary.missingBackbones],
    ["Frontend Build", model.summary.frontendBuildPassed ? "Passed" : "Needs Review"],
    ["Backend Validation", model.summary.backendValidationPassed ? "Passed" : "Needs Review"],
    ["Drift Check", model.summary.driftClean ? "Clean" : "Findings"],
  ];
}
