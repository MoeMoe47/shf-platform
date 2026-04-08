import { runGTSE } from "../gtse/index.js";

function buildCandidateActions(ctx = {}) {
  const actions = [];
  const page = ctx.page || "command";
  const step = ctx.timelineStep || "risk_signal";
  const systemStatus = ctx.systemStatus || "review";

  if (page === "command") {
    if (step === "risk_signal") {
      actions.push("focus_region", "monitor_trend", "escalate_review");
    } else if (step === "verification_inquiry") {
      actions.push("request_verification", "hold_for_verification", "monitor_trend");
    } else if (step === "payment_pending") {
      actions.push("release_now", "hold_for_verification", "partial_release");
    } else {
      actions.push("monitor_trend", "request_verification", "hold_for_verification");
    }
  }

  if (page === "operator") {
    if (systemStatus === "on_hold") {
      actions.push("escalate_review", "request_verification", "reassign_tasks");
    } else {
      actions.push("reassign_tasks", "deploy_idle_capacity", "rebalance_team");
    }
  }

  if (page === "investor") {
    actions.push("release_now", "hold_for_verification", "partial_release");
  }

  if (actions.length === 0) {
    actions.push("monitor_trend", "request_verification", "hold_for_verification");
  }

  return [...new Set(actions)];
}

function mapActionToUi(action, ctx = {}) {
  const region =
    ctx.activeCase?.jurisdiction ||
    ctx.activeCase?.name ||
    ctx.region ||
    "selected region";

  const map = {
    release_now: {
      title: `Release funding for ${region}`,
      actionLabel: "Release Funding",
      reason: "Release now is currently the strongest controlled action.",
    },
    hold_for_verification: {
      title: `Hold for verification in ${region}`,
      actionLabel: "Hold for Verification",
      reason: "Verification improves trust and reduces downside risk.",
    },
    partial_release: {
      title: `Partially release funding in ${region}`,
      actionLabel: "Partial Release",
      reason: "Partial release balances throughput and control.",
    },
    reassign_tasks: {
      title: `Reassign overloaded work in ${region}`,
      actionLabel: "Reassign Tasks",
      reason: "Reassignment reduces overload and improves flow.",
    },
    rebalance_team: {
      title: `Rebalance team capacity in ${region}`,
      actionLabel: "Rebalance Team",
      reason: "Balancing workload is likely to stabilize local operations.",
    },
    deploy_idle_capacity: {
      title: `Deploy idle capacity in ${region}`,
      actionLabel: "Deploy Capacity",
      reason: "Idle capacity can be used to reduce pressure immediately.",
    },
    request_verification: {
      title: `Request verification for ${region}`,
      actionLabel: "Request Verification",
      reason: "Verification is needed before advancing confidently.",
    },
    monitor_trend: {
      title: `Monitor trend in ${region}`,
      actionLabel: "Monitor Trend",
      reason: "Current conditions do not justify a stronger move yet.",
    },
    escalate_review: {
      title: `Escalate review in ${region}`,
      actionLabel: "Escalate Review",
      reason: "Current state warrants supervisor-level attention.",
    },
    focus_region: {
      title: `Focus command attention on ${region}`,
      actionLabel: "Focus Region",
      reason: "This region should be the current command priority.",
    },
  };

  return map[action] || {
    title: `Review next move for ${region}`,
    actionLabel: "Review",
    reason: "This recommendation requires operator review.",
  };
}

function confidenceLabel(value = 0) {
  if (value >= 0.82) return "High";
  if (value >= 0.65) return "Medium";
  return "Low";
}

export function buildGTSERecommendation(baseRecommendation = {}, ctx = {}) {
  const candidate_actions = buildCandidateActions(ctx);

  const result = runGTSE({
    candidate_actions,
    metrics: {
      success_rate: ctx.metrics?.success_rate ?? baseRecommendation?.confidenceScore ?? 0.82,
      funding_confidence: ctx.metrics?.funding_confidence ?? 0.78,
    },
    costs: {
      delay_cost: ctx.costs?.delay_cost ?? 0.16,
      release_risk_cost: ctx.costs?.release_risk_cost ?? 0.22,
    },
  });

  const ui = mapActionToUi(result.recommended_action, ctx);

  return {
    ...baseRecommendation,
    type: result.recommended_action,
    title: ui.title,
    actionLabel: ui.actionLabel,
    reason: result.explanation || ui.reason,
    confidence: result.confidence,
    confidenceLabel: confidenceLabel(result.confidence),
    alternatives: (result.ranked_actions || []).slice(1, 3).map((x) => x.action),
    rankedActions: result.ranked_actions || [],
    gtse: {
      recommended: result.recommended_action,
      confidence: result.confidence,
      explanation: result.explanation,
    },
  };
}
