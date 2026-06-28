export function calculateProductionAutomationV2Metrics(runs = [], recipes = []) {
  const safeRuns = Array.isArray(runs) ? runs : [];
  return {
    recipe_count: Array.isArray(recipes) ? recipes.length : 0,
    run_count: safeRuns.length,
    ready_runs: safeRuns.filter((run) => run.status === "ready" || run.readiness_score >= 80 && !run.blockers?.length).length,
    in_review_runs: safeRuns.filter((run) => run.status === "in_review").length,
    approved_runs: safeRuns.filter((run) => run.status === "approved").length,
    blocked_runs: safeRuns.filter((run) => run.status === "blocked" || run.blockers?.length).length,
    completed_runs: safeRuns.filter((run) => run.status === "completed").length,
    average_readiness_score: safeRuns.length
      ? Math.round(safeRuns.reduce((sum, run) => sum + Number(run.readiness_score || 0), 0) / safeRuns.length)
      : 0,
    dangerous_flag_violations: safeRuns.filter((run) => (
      run.execution_enabled_v2 !== false
      || run.production_action_executed
      || run.report_published
      || run.public_data_mutated
      || run.public_approved_mutated
      || run.shf_impact_data_mutated
      || run.external_message_sent
      || run.webhook_sent
      || run.notification_sent
      || run.warehouse_write_performed
      || run.auth_modified
    )).length,
  };
}
