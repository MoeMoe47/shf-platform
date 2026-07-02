export function calculateShsOrchestratorMetrics(requests = [], plans = [], templates = []) {
  return {
    template_count: templates.length,
    request_count: requests.length,
    plan_count: plans.length,
    ready_for_review_count: requests.filter((request) => request.status === "ready_for_review").length,
    blocked_count: requests.filter((request) => request.status === "blocked").length + plans.filter((plan) => plan.blockers?.length).length,
    average_readiness_score: plans.length
      ? Math.round(plans.reduce((sum, plan) => sum + Number(plan.readiness_score || 0), 0) / plans.length)
      : 0,
    dangerous_flags_enabled_count: plans.filter((plan) => (
      plan.execution_enabled
      || plan.production_mutation_enabled
      || plan.public_publish_enabled
      || plan.public_approved_mutation_enabled
      || plan.shf_impact_data_mutation_enabled
      || plan.external_delivery_enabled
      || plan.warehouse_write_enabled
      || plan.auth_mutation_enabled
    )).length,
  };
}
