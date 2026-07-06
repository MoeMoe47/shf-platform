export function calculateJobMetrics(jobs = [], history = []) {
  return {
    total_jobs: jobs.length,
    queued_jobs: jobs.filter((job) => job.status === "queued").length,
    delayed_jobs: jobs.filter((job) => job.status === "delayed").length,
    paused_jobs: jobs.filter((job) => job.status === "paused").length,
    completed_jobs: jobs.filter((job) => job.status === "completed").length,
    blocked_jobs: jobs.filter((job) => job.status === "blocked").length,
    recurring_templates: jobs.filter((job) => job.schedule_mode === "recurring_template").length,
    history_count: history.length,
  };
}

