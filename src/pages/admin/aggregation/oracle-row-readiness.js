function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function score(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, num));
}

export function buildOracleRowReadiness(input = {}) {
  const type = normalize(input.type || input.rowType || "row");
  const verification = normalize(input.verificationState || input.verification || input.status);
  const reconciliation = normalize(input.reconciliationStatus || input.status);
  const mappingStatus = normalize(input.mappingStatus || input.status);
  const confidenceScore = score(input.confidenceScore);
  const lineageId = input.lineageId || input.lineage_id || "";
  const sourceCount = Number(input.sourceCount || input.source_count || 0);
  const freshness = normalize(input.freshness);
  const count = Number(input.count || 0);

  const hasTrace = Boolean(lineageId);
  const hasSources = sourceCount > 0;
  const isFresh = !freshness.includes("stale");

  if (type === "mapping") {
    if (mappingStatus === "active" && count > 0) {
      return {
        label: "Oracle Ready",
        tone: "ready",
        blockers: [],
        nextAction: "Mapping is active. Continue toward entity and verification review.",
      };
    }

    if (mappingStatus === "active") {
      return {
        label: "Needs Data",
        tone: "review",
        blockers: ["source_count_missing"],
        nextAction: "Load source records before sending this mapping path downstream.",
      };
    }

    return {
      label: "Blocked",
      tone: "blocked",
      blockers: ["mapping_inactive"],
      nextAction: "Activate or repair the mapping before Oracle use.",
    };
  }

  if (type === "lineage") {
    if (!hasTrace) {
      return {
        label: "Needs Trace",
        tone: "blocked",
        blockers: ["lineage_missing"],
        nextAction: "Attach lineage before Oracle or reporting use.",
      };
    }

    if (!hasSources) {
      return {
        label: "Review First",
        tone: "review",
        blockers: ["source_count_missing"],
        nextAction: "Confirm source coverage before Oracle use.",
      };
    }

    if (!isFresh) {
      return {
        label: "Review Freshness",
        tone: "review",
        blockers: ["freshness_review"],
        nextAction: "Review stale lineage before downstream use.",
      };
    }

    return {
      label: "Oracle Ready",
      tone: "ready",
      blockers: [],
      nextAction: "Lineage is traceable and can support Oracle review.",
    };
  }

  if (type === "reconciliation") {
    if (reconciliation === "blocked") {
      return {
        label: "Blocked",
        tone: "blocked",
        blockers: ["reconciliation_blocked"],
        nextAction: "Resolve the conflict before Oracle use.",
      };
    }

    if (reconciliation === "accepted" || reconciliation === "completed") {
      return {
        label: "Oracle Ready",
        tone: "ready",
        blockers: [],
        nextAction: "Conflict review is complete. Continue toward Oracle truth review.",
      };
    }

    return {
      label: "Review First",
      tone: "review",
      blockers: ["reconciliation_pending"],
      nextAction: "Complete reconciliation before Oracle use.",
    };
  }

  if (type === "verification") {
    if (verification === "verified") {
      return {
        label: "Oracle Ready",
        tone: "ready",
        blockers: [],
        nextAction: "Verification passed. Continue toward Oracle truth review.",
      };
    }

    if (verification === "rejected" || verification === "disputed") {
      return {
        label: "Blocked",
        tone: "blocked",
        blockers: [`verification_${verification}`],
        nextAction: "Resolve verification blocker before Oracle use.",
      };
    }

    return {
      label: "Needs Verification",
      tone: "review",
      blockers: ["verification_pending"],
      nextAction: "Complete verification before Oracle use.",
    };
  }

  if (type === "entity") {
    if (!hasTrace) {
      return {
        label: "Needs Trace",
        tone: "blocked",
        blockers: ["lineage_missing"],
        nextAction: "Attach lineage before Oracle use.",
      };
    }

    if (verification === "verified" && confidenceScore >= 75) {
      return {
        label: "Oracle Ready",
        tone: "ready",
        blockers: [],
        nextAction: "Entity has confidence, verification, and lineage support.",
      };
    }

    if (verification === "disputed" || verification === "rejected") {
      return {
        label: "Blocked",
        tone: "blocked",
        blockers: [`verification_${verification}`],
        nextAction: "Resolve entity verification blocker before Oracle use.",
      };
    }

    return {
      label: "Review First",
      tone: "review",
      blockers: ["entity_review_required"],
      nextAction: "Review confidence, verification, and lineage before Oracle use.",
    };
  }

  return {
    label: "Review First",
    tone: "neutral",
    blockers: ["unknown_row_type"],
    nextAction: "Review row status before downstream use.",
  };
}

export function oracleReadinessClass(tone) {
  const normalized = normalize(tone);
  if (normalized === "ready") return "admin-aggregation-oracle-ready--ready";
  if (normalized === "review") return "admin-aggregation-oracle-ready--review";
  if (normalized === "blocked") return "admin-aggregation-oracle-ready--blocked";
  return "admin-aggregation-oracle-ready--neutral";
}
