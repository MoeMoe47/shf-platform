export const AGGREGATION_READINESS_STEPS = Object.freeze([
  {
    key: "raw_source",
    label: "Raw Source",
    description: "Source records exist and can be inspected.",
  },
  {
    key: "normalized",
    label: "Normalized",
    description: "Source data is mapped into the canonical shape.",
  },
  {
    key: "entity_matched",
    label: "Entity Matched",
    description: "Records are linked to canonical entities.",
  },
  {
    key: "conflict_checked",
    label: "Conflict Checked",
    description: "Duplicate, stale, and conflicting records are identified.",
  },
  {
    key: "verified",
    label: "Verified",
    description: "Evidence review has produced a verification state.",
  },
  {
    key: "oracle_ready",
    label: "Oracle Ready",
    description: "The record can be used by Oracle truth logic.",
  },
  {
    key: "reporting_ready",
    label: "Reporting Ready",
    description: "The record has enough trace coverage for reporting review.",
  },
]);

function normalizeStatus(value) {
  return String(value || "").toLowerCase().trim();
}

function normalizeScore(value) {
  const score = Number(value);
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, score));
}

function countBy(items = [], predicate = () => false) {
  return items.reduce((total, item) => total + (predicate(item) ? 1 : 0), 0);
}

export function buildAggregationReadinessSnapshot({
  overviewStats = {},
  entityItems = [],
  verificationItems = [],
  reconciliationItems = [],
  lineageItems = [],
  mappingRows = [],
  oracleTruth = null,
} = {}) {
  const entityCount = entityItems.length;
  const verificationCount = verificationItems.length;
  const reconciliationCount = reconciliationItems.length;
  const lineageCount = lineageItems.length;
  const mappingCount = mappingRows.length;

  const normalizedMappings = countBy(mappingRows, (row) =>
    ["active", "mapped", "ready"].includes(normalizeStatus(row.status))
  );

  const matchedEntities = countBy(entityItems, (item) => {
    const status = normalizeStatus(item.status);
    return (
      status.includes("matched") ||
      status.includes("canonical") ||
      normalizeScore(item.confidenceScore) >= 75
    );
  });

  const verifiedItems = countBy(verificationItems, (item) =>
    normalizeStatus(item.verificationState) === "verified"
  );

  const conflictChecked = countBy(reconciliationItems, (item) => {
    const status = normalizeStatus(item.status);
    return ["accepted", "completed", "blocked", "queued", "in_progress"].includes(status);
  });

  const completeLineage = countBy(lineageItems, (item) => {
    return Boolean(item.lineageId) && Number(item.sourceCount || 0) > 0;
  });

  const oracleReady =
    oracleTruth?.truthStatus === "certified" ||
    oracleTruth?.readinessStatus === "internally_ready" ||
    oracleTruth?.readinessStatus === "leadership_ready" ||
    oracleTruth?.readinessStatus === "funder_ready" ||
    oracleTruth?.readinessStatus === "public_ready";

  const reportingReady =
    oracleReady &&
    Boolean(oracleTruth?.trustEnvelope || oracleTruth?.traceId) &&
    !["blocked", "not_ready"].includes(normalizeStatus(oracleTruth?.readinessStatus));

  const steps = AGGREGATION_READINESS_STEPS.map((step) => {
    let status = "pending";
    let detail = step.description;

    if (step.key === "raw_source") {
      const rawTotal =
        Number(overviewStats.organizations || 0) +
        Number(overviewStats.referrals || 0) +
        Number(overviewStats.outcomes || 0) +
        Number(overviewStats.signals || 0);

      status = rawTotal > 0 ? "complete" : "pending";
      detail = `${rawTotal} source objects available.`;
    }

    if (step.key === "normalized") {
      status = mappingCount > 0 && normalizedMappings === mappingCount ? "complete" : "pending";
      detail = `${normalizedMappings}/${mappingCount || 0} mappings active.`;
    }

    if (step.key === "entity_matched") {
      status =
        entityCount > 0 && matchedEntities === entityCount
          ? "complete"
          : matchedEntities > 0
          ? "partial"
          : "pending";
      detail = `${matchedEntities}/${entityCount || 0} entities matched.`;
    }

    if (step.key === "conflict_checked") {
      status =
        reconciliationCount > 0 && conflictChecked === reconciliationCount
          ? "complete"
          : conflictChecked > 0
          ? "partial"
          : "pending";
      detail = `${conflictChecked}/${reconciliationCount || 0} reconciliation items checked.`;
    }

    if (step.key === "verified") {
      status =
        verificationCount > 0 && verifiedItems === verificationCount
          ? "complete"
          : verifiedItems > 0
          ? "partial"
          : "pending";
      detail = `${verifiedItems}/${verificationCount || 0} records verified.`;
    }

    if (step.key === "oracle_ready") {
      status = oracleReady ? "complete" : oracleTruth ? "partial" : "pending";
      detail = oracleTruth
        ? `Oracle status: ${oracleTruth.truthStatus || "unknown"} / ${oracleTruth.readinessStatus || "unknown"}.`
        : "Oracle truth not loaded.";
    }

    if (step.key === "reporting_ready") {
      status = reportingReady ? "complete" : oracleReady ? "partial" : "pending";
      detail = reportingReady
        ? "Trust envelope / trace context available."
        : "Needs Oracle-ready state and trace context.";
    }

    return {
      ...step,
      status,
      detail,
    };
  });

  const completeCount = steps.filter((step) => step.status === "complete").length;
  const partialCount = steps.filter((step) => step.status === "partial").length;
  const blockedCount = steps.filter((step) => step.status === "blocked").length;

  const readinessPercent = Math.round((completeCount / steps.length) * 100);

  const headlineStatus =
    blockedCount > 0
      ? "blocked"
      : completeCount === steps.length
      ? "ready"
      : partialCount > 0 || completeCount > 0
      ? "in_progress"
      : "not_started";

  const nextStep =
    steps.find((step) => step.status !== "complete") ||
    steps[steps.length - 1];

  return {
    steps,
    completeCount,
    partialCount,
    blockedCount,
    totalSteps: steps.length,
    readinessPercent,
    headlineStatus,
    nextStep,
    summary:
      headlineStatus === "ready"
        ? "Aggregation pipeline is ready for Oracle and reporting review."
        : `Next operator focus: ${nextStep.label}.`,
  };
}

export function readinessStepClass(status) {
  const normalized = normalizeStatus(status);
  if (normalized === "complete") return "is-complete";
  if (normalized === "partial") return "is-partial";
  if (normalized === "blocked") return "is-blocked";
  return "is-pending";
}
