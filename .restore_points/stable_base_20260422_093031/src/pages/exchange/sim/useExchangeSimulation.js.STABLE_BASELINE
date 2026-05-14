import React from "react";

const DEFAULT_STAGES = [
  "risk_signal",
  "anomaly_clear",
  "verification_inquiry",
  "verification_passed",
  "queue_operator_review",
  "action_queued",
  "outcome_pending",
  "payment_pending",
];

function nextStageFrom(currentStage) {
  const idx = DEFAULT_STAGES.indexOf(currentStage);
  if (idx === -1) return DEFAULT_STAGES[0];
  return DEFAULT_STAGES[(idx + 1) % DEFAULT_STAGES.length];
}

function stagePayload(stage, ctx) {
  const baseRecommendation = ctx?.recommendation || {};

  const map = {
    risk_signal: {
      systemStatus: "review_in_progress",
      recommendation: {
        action: "assign_verifier",
        confidence: 0.74,
        reason: "Risk signal detected. Verification should begin before escalation.",
        prerequisites: ["case_visible"],
        blockers: [],
      },
      note: "Simulation is monitoring a live risk signal.",
      analystSummary: {
        summary: "Simulation is focused on the initial risk signal and verification readiness.",
      },
    },
    anomaly_clear: {
      systemStatus: "review_in_progress",
      recommendation: {
        action: "assign_verifier",
        confidence: 0.78,
        reason: "Anomaly is clearing, but verification should continue before progression.",
        prerequisites: ["case_visible"],
        blockers: [],
      },
      note: "Anomaly has cleared and the case is stabilizing.",
      analystSummary: {
        summary: "Simulation is showing reduced risk pressure while maintaining verification posture.",
      },
    },
    verification_inquiry: {
      systemStatus: "review_in_progress",
      recommendation: {
        action: "assign_verifier",
        confidence: 0.81,
        reason: "Verification inquiry is active. A verifier should be assigned and confirmed.",
        prerequisites: ["funding_pool_ready", "contract_present"],
        blockers: [],
      },
      note: "Verification inquiry is active.",
      analystSummary: {
        summary: "Simulation is focused on verification inquiry and operator readiness.",
      },
    },
    verification_passed: {
      systemStatus: "approval_queued",
      recommendation: {
        action: "queue_operator_review",
        confidence: 0.84,
        reason: "Verification passed. Operator review should be queued before execution.",
        prerequisites: ["funding_pool_ready", "contract_present", "verifier_assigned"],
        blockers: [],
      },
      note: "Verification has passed and the case is ready for operator review.",
      analystSummary: {
        summary: "Simulation is showing a cleared verification path and operator review readiness.",
      },
    },
    queue_operator_review: {
      systemStatus: "manual_review_required",
      recommendation: {
        action: "queue_operator_review",
        confidence: 0.69,
        reason: "Operator review is required before downstream commitment.",
        prerequisites: ["funding_pool_ready", "contract_present", "verifier_assigned"],
        blockers: ["manual_review_pending"],
      },
      note: "Operator review queue is active.",
      analystSummary: {
        summary: "Simulation is waiting on operator review before execution can proceed.",
      },
    },
    action_queued: {
      systemStatus: "approval_queued",
      recommendation: {
        action: "request_case_packet",
        confidence: 0.83,
        reason: "Action has been queued and packet retrieval should complete before release.",
        prerequisites: ["funding_pool_ready", "contract_present"],
        blockers: [],
      },
      note: "Action has been queued for execution.",
      analystSummary: {
        summary: "Simulation shows the case moving through queued execution with moderate confidence.",
      },
    },
    outcome_pending: {
      systemStatus: "in_progress",
      recommendation: {
        action: "confirm_funding_pool",
        confidence: 0.81,
        reason: "Outcome is pending. Funding readiness should be confirmed before downstream commitment.",
        prerequisites: ["funding_pool_ready", "contract_present"],
        blockers: [],
      },
      note: "Outcome is pending confirmation.",
      analystSummary: {
        summary: "Simulation is tracking the case through pending outcome confirmation.",
      },
    },
    payment_pending: {
      systemStatus: "in_progress",
      recommendation: {
        action: "release_payment",
        confidence: 0.88,
        reason: "Payment is pending and release conditions appear close to ready.",
        prerequisites: ["funding_pool_ready", "contract_present", "verifier_assigned"],
        blockers: [],
      },
      note: "Payment is pending completion.",
      analystSummary: {
        summary: "Simulation is in final payment progression with strong release confidence.",
      },
    },
  };

  const selected = map[stage] || map.risk_signal;

  return {
    currentStage: stage,
    systemStatus: selected.systemStatus,
    recommendation: {
      ...baseRecommendation,
      ...selected.recommendation,
    },
    note: selected.note,
    analystSummary: selected.analystSummary,
  };
}

function buildFrameFromStage(stage, ctx) {
  return stagePayload(stage, ctx);
}

export default function useExchangeSimulation(context = {}) {
  const {
    enabled = true,
    tickMs = 5000,
    stepNonce = 0,
    timelineStep,
  } = context || {};

  const initialStage = timelineStep || DEFAULT_STAGES[0];
  const [frame, setFrame] = React.useState(() =>
    buildFrameFromStage(initialStage, context)
  );

  const lastStepNonceRef = React.useRef(stepNonce);

  React.useEffect(() => {
    setFrame((prev) => {
      const targetStage = timelineStep || prev?.currentStage || DEFAULT_STAGES[0];
      return buildFrameFromStage(targetStage, context);
    });
  }, [timelineStep, context?.recommendation, context?.systemStatus]);

  React.useEffect(() => {
    if (!enabled) return;

    const id = window.setInterval(() => {
      setFrame((prev) => {
        const nextStage = nextStageFrom(prev?.currentStage || initialStage);
        return buildFrameFromStage(nextStage, context);
      });
    }, tickMs);

    return () => window.clearInterval(id);
  }, [enabled, tickMs, initialStage, context]);

  React.useEffect(() => {
    if (stepNonce === lastStepNonceRef.current) return;
    lastStepNonceRef.current = stepNonce;

    setFrame((prev) => {
      const nextStage = nextStageFrom(prev?.currentStage || initialStage);
      return buildFrameFromStage(nextStage, context);
    });
  }, [stepNonce, initialStage, context]);

  return frame;
}
