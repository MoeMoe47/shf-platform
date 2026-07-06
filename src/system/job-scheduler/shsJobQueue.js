import { createJob } from "./shsJobTypes";
import { scanJobSafety } from "./shsJobSafety";
import { recordJobHistory } from "./shsJobHistory";

const JOB_STORAGE_KEY = "shs_bos_job_scheduler_v1_jobs";

function readJobs() {
  if (typeof localStorage === "undefined") return [];
  try {
    const value = localStorage.getItem(JOB_STORAGE_KEY);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function writeJobs(jobs) {
  if (typeof localStorage === "undefined") return jobs;
  localStorage.setItem(JOB_STORAGE_KEY, JSON.stringify(jobs));
  return jobs;
}

function upsertJob(job, action, note = "") {
  const jobs = readJobs().filter((item) => item.job_id !== job.job_id);
  const next = { ...job, updated_at: new Date().toISOString() };
  recordJobHistory(next, action, note);
  return writeJobs([next, ...jobs].slice(0, 50));
}

export function getJobs() {
  return readJobs();
}

export function saveJobs(jobs) {
  return writeJobs(jobs);
}

export function createLocalJob(input = {}) {
  const draft = createJob(input);
  const safety = scanJobSafety(draft);
  const job = { ...draft, safety_status: safety.safety_status, status: safety.safe ? draft.status : "blocked" };
  return { job, jobs: upsertJob(job, "create", "Local job created."), safety };
}

export function delayJob(jobId, delayMinutes = 15) {
  const job = readJobs().find((item) => item.job_id === jobId);
  if (!job) return readJobs();
  const runAt = new Date(Date.now() + Number(delayMinutes) * 60 * 1000).toISOString();
  return upsertJob({ ...job, status: "delayed", run_at: runAt }, "delay", `Delayed ${delayMinutes} minutes.`);
}

export function pauseJob(jobId) {
  const job = readJobs().find((item) => item.job_id === jobId);
  return job ? upsertJob({ ...job, status: "paused" }, "pause", "Paused locally.") : readJobs();
}

export function resumeJob(jobId) {
  const job = readJobs().find((item) => item.job_id === jobId);
  return job ? upsertJob({ ...job, status: "queued" }, "resume", "Resumed locally.") : readJobs();
}

export function markJobComplete(jobId) {
  const job = readJobs().find((item) => item.job_id === jobId);
  return job ? upsertJob({ ...job, status: "completed" }, "complete", "Marked complete locally.") : readJobs();
}

export function blockDangerousJob(input = {}) {
  return createLocalJob({
    ...input,
    job_type: "system",
    job_name: "blocked.dangerous.job.preview",
    risk_level: "high",
    payload: {
      blocked_webhook_marker: "send webhook",
      blocked_worker_marker: "external worker",
      blocked_mutation_marker: "mutate production",
    },
  });
}

export function loadSeedJobs() {
  const existing = readJobs();
  if (existing.length) return existing;
  return createLocalJob({
    job_type: "governance",
    job_name: "governance.audit.preview",
    target_layer: "Governance",
    entity_type: "governance_check",
    entity_id: "daily-governance-preview",
    schedule_mode: "manual",
    recurrence: "none",
    max_retries: 2,
    payload: { checklist_preview: true, execution_requested: false },
    operator_note: "Seed local Scheduler job.",
  }).jobs;
}

