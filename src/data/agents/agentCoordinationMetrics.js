export function calculateAgentCoordinationMetrics(plans = [], handoffs = []) {
  return {
    total_plans: plans.length,
    in_review_plans: plans.filter((plan) => plan.status === "in_review").length,
    approved_plans: plans.filter((plan) => plan.status === "approved").length,
    blocked_plans: plans.filter((plan) => plan.status === "blocked").length,
    completed_plans: plans.filter((plan) => plan.status === "completed").length,
    total_handoffs: handoffs.length,
    accepted_handoffs: handoffs.filter((handoff) => handoff.status === "accepted").length,
    blocked_handoffs: handoffs.filter((handoff) => handoff.status === "blocked" || handoff.status === "rejected").length,
    execution_enabled_count: plans.filter((plan) => plan.execution_enabled_v1 === true).length,
  };
}
