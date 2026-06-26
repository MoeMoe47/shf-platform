export function calculateAgentWorkflowMetrics(runs = [], steps = []) {
  const totalRuns = runs.length;
  const blockedRuns = runs.filter((run) => run.status === "blocked" || run.blockers?.length).length;
  const activeRuns = runs.filter((run) => ["ready", "active", "paused"].includes(run.status)).length;
  const completedRuns = runs.filter((run) => run.status === "completed").length;
  const totalSteps = steps.length;
  const completedSteps = steps.filter((step) => step.status === "completed").length;
  const skippedSteps = steps.filter((step) => step.status === "skipped").length;
  const blockedSteps = steps.filter((step) => step.status === "blocked" || step.blockers?.length).length;
  const averageProgress = totalRuns
    ? Math.round(runs.reduce((sum, run) => sum + Number(run.progress_percent || 0), 0) / totalRuns)
    : 0;

  return {
    total_runs: totalRuns,
    active_runs: activeRuns,
    blocked_runs: blockedRuns,
    completed_runs: completedRuns,
    total_steps: totalSteps,
    completed_steps: completedSteps,
    skipped_steps: skippedSteps,
    blocked_steps: blockedSteps,
    average_progress_percent: averageProgress,
  };
}
