import { SHS_JOB_DANGEROUS_CAPABILITIES } from "./shsJobTypes";

export function calculateJobReadiness({ jobs = [], history = [], safety = null } = {}) {
  let score = 100;
  const blockers = [];
  const warnings = [];
  if (!jobs.length) {
    score -= 20;
    warnings.push("No local jobs are queued.");
  }
  if (!history.length) {
    score -= 10;
    warnings.push("No local job history has been recorded yet.");
  }
  if (jobs.some((job) => job.status === "blocked")) {
    score -= 10;
    warnings.push("Blocked jobs are present for owner review.");
  }
  if (safety && !safety.safe) {
    score -= 10;
    warnings.push("Dangerous job payload preview is correctly blocked.");
  }
  if (Object.values(SHS_JOB_DANGEROUS_CAPABILITIES).some(Boolean)) {
    score -= 60;
    blockers.push("Dangerous scheduler capability enabled.");
  }
  return {
    score: Math.max(0, score),
    ready: score >= 80 && blockers.length === 0,
    blockers,
    warnings,
    dangerous_capabilities: SHS_JOB_DANGEROUS_CAPABILITIES,
  };
}

