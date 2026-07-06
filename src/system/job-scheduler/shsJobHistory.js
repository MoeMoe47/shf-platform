const HISTORY_STORAGE_KEY = "shs_bos_job_scheduler_v1_history";

function readHistory() {
  if (typeof localStorage === "undefined") return [];
  try {
    const value = localStorage.getItem(HISTORY_STORAGE_KEY);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function writeHistory(history) {
  if (typeof localStorage === "undefined") return history;
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  return history;
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

