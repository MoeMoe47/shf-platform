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

export const HARDENING_RISK_PATTERNS = Object.freeze({
  backup: [
    ".bak",
    ".backup",
    "before_",
    "backup",
    "_backup",
    "pre_restore",
    "pre_target_restore",
    "rescue",
  ],
  broken: [
    "broken",
    "BROKEN",
    "STOP_LOOP",
    "BEFORE_AI_WIRE",
    "safe_working",
    "old",
    "legacy",
    "duplicate",
  ],
  route: [
    "Route",
    "Routes",
    "router",
    "main.jsx",
    "nav",
    "sidebar",
  ],
  security: [
    "auth",
    "role",
    "permission",
    "security",
    "identity",
    "guard",
    "access",
  ],
});

export function classifyHardeningFile(path = "") {
  const value = String(path || "");
  const lower = value.toLowerCase();

  const isBackup = HARDENING_RISK_PATTERNS.backup.some((pattern) =>
    lower.includes(pattern.toLowerCase())
  );

  const isBrokenRisk = HARDENING_RISK_PATTERNS.broken.some((pattern) =>
    value.includes(pattern)
  );

  const isRouteRelated = HARDENING_RISK_PATTERNS.route.some((pattern) =>
    lower.includes(pattern.toLowerCase())
  );

  const isSecurityRelated = HARDENING_RISK_PATTERNS.security.some((pattern) =>
    lower.includes(pattern.toLowerCase())
  );

  const isArchive = lower.includes("/_archive/") || lower.includes("/_patchbak/");
  const isActiveSource = lower.startsWith("src/") || lower.startsWith("apps/shs-api/src/");

  let riskLevel = "low";
  let recommendedAction = "Keep file in place.";

  if (isBackup || isBrokenRisk) {
    riskLevel = "medium";
    recommendedAction = "Move to archive outside active source tree after final review.";
  }

  if ((isBackup || isBrokenRisk) && (isRouteRelated || isSecurityRelated)) {
    riskLevel = "high";
    recommendedAction = "Review first, then move to archive. Do not delete blindly.";
  }

  if (isArchive) {
    riskLevel = "low";
    recommendedAction = "Already in archive path. Keep out of active imports.";
  }

  return {
    path: value,
    isActiveSource,
    isArchive,
    isBackup,
    isBrokenRisk,
    isRouteRelated,
    isSecurityRelated,
    riskLevel,
    recommendedAction,
  };
}

export function buildProductionHardeningAuditModel({
  files = [],
  placeholderFindings = [],
  consoleFindings = [],
  importFindings = [],
  buildHealth = {},
  backendHealth = {},
  source = "shs_v1_production_hardening",
} = {}) {
  const classifiedFiles = safeArray(files).map(classifyHardeningFile);

  const highRiskFiles = classifiedFiles.filter((file) => file.riskLevel === "high");
  const mediumRiskFiles = classifiedFiles.filter((file) => file.riskLevel === "medium");
  const archiveCandidates = classifiedFiles.filter(
    (file) => !file.isArchive && (file.isBackup || file.isBrokenRisk)
  );
  const routeRiskFiles = classifiedFiles.filter((file) => file.isRouteRelated && (file.isBackup || file.isBrokenRisk));
  const securityRiskFiles = classifiedFiles.filter((file) => file.isSecurityRelated && (file.isBackup || file.isBrokenRisk));

  const frontendPassed = Boolean(buildHealth.frontendBuildPassed);
  const backendPassed = Boolean(backendHealth.backendTypecheckPassed && backendHealth.backendBuildPassed);
  const placeholderClean = safeArray(placeholderFindings).length === 0;
  const consoleClean = safeArray(consoleFindings).length === 0;
  const importClean = safeArray(importFindings).length === 0;

  let hardeningScore = 100;

  hardeningScore -= Math.min(35, highRiskFiles.length * 2);
  hardeningScore -= Math.min(20, mediumRiskFiles.length);
  hardeningScore -= placeholderClean ? 0 : 10;
  hardeningScore -= consoleClean ? 0 : 5;
  hardeningScore -= importClean ? 0 : 5;
  hardeningScore += frontendPassed ? 0 : -15;
  hardeningScore += backendPassed ? 0 : -15;

  hardeningScore = clamp(hardeningScore);

  let hardeningStatus = "production_ready";
  let hardeningLabel = "Production Ready";
  let recommendedNextAction = "Continue final route, role, and UX validation.";

  if (highRiskFiles.length || archiveCandidates.length > 25) {
    hardeningStatus = "cleanup_needed";
    hardeningLabel = "Cleanup Needed";
    recommendedNextAction = "Archive backup and broken-risk files outside the active source tree before production signoff.";
  }

  if (!frontendPassed || !backendPassed) {
    hardeningStatus = "blocked";
    hardeningLabel = "Blocked";
    recommendedNextAction = "Fix build or backend validation before continuing production hardening.";
  }

  return {
    source,
    hardeningStatus,
    hardeningLabel,
    hardeningScore,
    recommendedNextAction,
    summary: {
      totalFilesScanned: classifiedFiles.length,
      highRiskFiles: highRiskFiles.length,
      mediumRiskFiles: mediumRiskFiles.length,
      archiveCandidates: archiveCandidates.length,
      routeRiskFiles: routeRiskFiles.length,
      securityRiskFiles: securityRiskFiles.length,
      placeholderClean,
      consoleClean,
      importClean,
      frontendBuildPassed: frontendPassed,
      backendValidationPassed: backendPassed,
    },
    highRiskFiles,
    mediumRiskFiles,
    archiveCandidates,
    routeRiskFiles,
    securityRiskFiles,
    classifiedFiles,
  };
}

export function productionHardeningStatusClass(status) {
  const normalized = normalize(status);
  if (normalized === "production_ready") return "production-hardening--ready";
  if (normalized === "cleanup_needed") return "production-hardening--cleanup";
  if (normalized === "blocked") return "production-hardening--blocked";
  return "production-hardening--review";
}

export function buildProductionHardeningRows(model) {
  if (!model) return [];

  return [
    ["Hardening Score", `${model.hardeningScore}%`],
    ["High-Risk Files", model.summary.highRiskFiles],
    ["Archive Candidates", model.summary.archiveCandidates],
    ["Route Risk Files", model.summary.routeRiskFiles],
    ["Security Risk Files", model.summary.securityRiskFiles],
    ["Frontend Build", model.summary.frontendBuildPassed ? "Passed" : "Needs Review"],
    ["Backend Validation", model.summary.backendValidationPassed ? "Passed" : "Needs Review"],
    ["Placeholder Check", model.summary.placeholderClean ? "Clean" : "Findings"],
  ];
}
