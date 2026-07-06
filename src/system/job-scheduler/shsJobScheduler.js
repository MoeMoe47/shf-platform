import { SHS_RECURRING_JOB_TEMPLATES, createLocalJobFromTemplate } from "./shsJobDefinitions";
import {
  blockDangerousJob,
  createLocalJob,
  delayJob,
  getJobs,
  loadSeedJobs,
  markJobComplete,
  pauseJob,
  resumeJob,
} from "./shsJobQueue";
import { createRetryPreview } from "./shsJobRetryPolicy";
import { getJobHistory } from "./shsJobHistory";
import { calculateJobMetrics } from "./shsJobMetrics";
import { calculateJobReadiness } from "./shsJobReadiness";
import { createBlockedDangerousJobPreview } from "./shsJobSafety";

export function getJobSchedulerState() {
  const jobs = loadSeedJobs();
  const history = getJobHistory();
  const safety = createBlockedDangerousJobPreview();
  const metrics = calculateJobMetrics(jobs, history);
  return {
    jobs,
    history,
    templates: SHS_RECURRING_JOB_TEMPLATES,
    retry_preview: createRetryPreview(jobs[0] || {}),
    safety,
    metrics,
    readiness: calculateJobReadiness({ jobs, history, safety }),
  };
}

export function createRecurringTemplateJob(templateId) {
  return createLocalJob(createLocalJobFromTemplate(templateId));
}

export {
  blockDangerousJob,
  createLocalJob,
  createRetryPreview,
  delayJob,
  getJobs,
  markJobComplete,
  pauseJob,
  resumeJob,
};

