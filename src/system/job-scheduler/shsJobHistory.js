import {
  readCriticalStateRecords,
  writeCriticalStateRecords,
} from "@/system/persistence/migrations/criticalStateMigrationCompatibility";

const HISTORY_STORAGE_KEY = "shs_bos_job_scheduler_v1_history";

function readHistory() {
  return readCriticalStateRecords("job_scheduler", HISTORY_STORAGE_KEY, [], {
    repository: "job_scheduler",
    idField: "history_id",
    schemaVersion: "shs.critical.job-scheduler.v1",
  }).filter((record) => record.critical_record_type === "job_history" || record.history_id);
}

function writeHistory(history) {
  return writeCriticalStateRecords("job_scheduler", HISTORY_STORAGE_KEY, history.map((entry) => ({ ...entry, critical_record_type: "job_history" })), {
    repository: "job_scheduler",
    idField: "history_id",
    schemaVersion: "shs.critical.job-scheduler.v1",
    change_summary: "Job Scheduler critical history write",
  });
}

export function getJobHistory() {
  return readHistory();
}

export function recordJobHistory(job, action, note = "") {
  const entry = {
    history_id: `job_history_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    job_id: job.job_id,
    job_name: job.job_name,
    action,
    status: job.status,
    timestamp: new Date().toISOString(),
    note,
    local_only: true,
  };
  return writeHistory([entry, ...readHistory()].slice(0, 100));
}
