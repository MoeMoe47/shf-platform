import React from "react";
import { SHS_RECURRING_JOB_TEMPLATES } from "@/system/job-scheduler/shsJobDefinitions";
import {
  blockDangerousJob,
  createLocalJob,
  createRecurringTemplateJob,
  createRetryPreview,
  delayJob,
  getJobSchedulerState,
  markJobComplete,
  pauseJob,
  resumeJob,
} from "@/system/job-scheduler/shsJobScheduler";
import "./shsJobScheduler.css";

export default function ShsJobSchedulerPage() {
  const initialState = React.useMemo(() => getJobSchedulerState(), []);
  const [jobs, setJobs] = React.useState(initialState.jobs);
  const [history, setHistory] = React.useState(initialState.history);
  const [metrics, setMetrics] = React.useState(initialState.metrics);
  const [readiness, setReadiness] = React.useState(initialState.readiness);
  const [safety, setSafety] = React.useState(initialState.safety);
  const [retryPreview, setRetryPreview] = React.useState(initialState.retry_preview);
  const [selectedTemplate, setSelectedTemplate] = React.useState(SHS_RECURRING_JOB_TEMPLATES[0].job_id);

  function refresh() {
    const state = getJobSchedulerState();
    setJobs([...state.jobs]);
    setHistory([...state.history]);
    setMetrics(state.metrics);
    setReadiness(state.readiness);
    setSafety(state.safety);
    setRetryPreview(createRetryPreview(state.jobs[0] || {}));
  }

  function handleCreateLocalJob() {
    createLocalJob({
      job_type: "maintenance",
      job_name: "local.maintenance.review",
      target_layer: "Maintenance",
      entity_type: "maintenance_review",
      entity_id: "local-maintenance-preview",
      schedule_mode: "manual",
      max_retries: 2,
      payload: { local_review: true, execution_requested: false },
      operator_note: "Local Scheduler job created by admin.",
    });
    refresh();
  }

  function handleTemplateJob() {
    createRecurringTemplateJob(selectedTemplate);
    refresh();
  }

  function handleJobAction(action, jobId) {
    if (action === "delay") delayJob(jobId, 30);
    if (action === "pause") pauseJob(jobId);
    if (action === "resume") resumeJob(jobId);
    if (action === "complete") markJobComplete(jobId);
    refresh();
  }

  function handleRetryPreview(job) {
    setRetryPreview(createRetryPreview(job));
  }

  function handleBlockDangerousJob() {
    const result = blockDangerousJob();
    setSafety(result.safety);
    refresh();
  }

  return (
    <main className="shs-job-scheduler-page">
      <section className="scheduler-hero">
        <div>
          <p>SHS BOS Job Scheduler V1</p>
          <h1>Job Scheduler</h1>
          <span>Local-first scheduling infrastructure for delayed tasks, recurring maintenance templates, retries, timeouts, history, and admin-safe review.</span>
        </div>
        <div className="scheduler-actions">
          <button type="button" onClick={handleCreateLocalJob}>Create Local Job</button>
          <button type="button" onClick={handleBlockDangerousJob}>Block Dangerous Job</button>
          <button type="button" onClick={refresh}>Refresh Local Queue</button>
        </div>
      </section>

      <section className="scheduler-toolbar">
        <label>
          Recurring job template
          <select value={selectedTemplate} onChange={(event) => setSelectedTemplate(event.target.value)}>
            {SHS_RECURRING_JOB_TEMPLATES.map((template) => (
              <option key={template.job_id} value={template.job_id}>{template.job_name}</option>
            ))}
          </select>
        </label>
        <button type="button" onClick={handleTemplateJob}>Create Recurring Job Template</button>
      </section>

      <section className="scheduler-grid">
        <section className="scheduler-panel overview">
          <div className="panel-heading"><p>Overview</p><h2>Local Queue</h2></div>
          <div className="metric-row">
            <article><span>Total</span><strong>{metrics.total_jobs}</strong></article>
            <article><span>Queued</span><strong>{metrics.queued_jobs}</strong></article>
            <article><span>Delayed</span><strong>{metrics.delayed_jobs}</strong></article>
            <article><span>Blocked</span><strong>{metrics.blocked_jobs}</strong></article>
          </div>
        </section>

        <section className="scheduler-panel readiness">
          <div className="panel-heading"><p>Readiness</p><h2>Scheduler Readiness</h2></div>
          <div className="readiness-score">{readiness.score}</div>
          <strong>{readiness.ready ? "Ready for local scheduling" : "Needs review"}</strong>
          <ul>
            {readiness.blockers.map((item) => <li key={item}>{item}</li>)}
            {readiness.warnings.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>

        <section className="scheduler-panel queue">
          <div className="panel-heading"><p>Jobs</p><h2>Queue</h2></div>
          <div className="job-list">
            {jobs.map((job) => (
              <article key={job.job_id}>
                <div>
                  <strong>{job.job_name}</strong>
                  <span>{job.status} · {job.schedule_mode} · {job.risk_level}</span>
                  <small>{job.target_layer} · retry {job.retry_count}/{job.max_retries}</small>
                </div>
                <div className="job-actions">
                  <button type="button" onClick={() => handleJobAction("delay", job.job_id)}>Delay Job</button>
                  <button type="button" onClick={() => handleJobAction("pause", job.job_id)}>Pause</button>
                  <button type="button" onClick={() => handleJobAction("resume", job.job_id)}>Resume</button>
                  <button type="button" onClick={() => handleRetryPreview(job)}>Retry Preview</button>
                  <button type="button" onClick={() => handleJobAction("complete", job.job_id)}>Mark Complete Locally</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="scheduler-panel retry">
          <div className="panel-heading"><p>Retry</p><h2>Retry Preview</h2></div>
          <ol>
            {retryPreview.map((retry) => (
              <li key={retry.retry_number}>Retry {retry.retry_number}: wait {retry.delay_seconds}s, timeout {retry.timeout_seconds}s, execution {String(retry.execution_enabled)}</li>
            ))}
          </ol>
        </section>

        <section className="scheduler-panel safety">
          <div className="panel-heading"><p>Safety</p><h2>Dangerous Job Guard</h2></div>
          <p>{safety.safety_copy}</p>
          <strong>Dangerous job blocked: {String(!safety.safe)}</strong>
          <div className="safety-flags">
            {Object.entries(safety.dangerous_capabilities).map(([flag, enabled]) => (
              <span key={flag}>{flag}: {String(enabled)}</span>
            ))}
          </div>
        </section>

        <section className="scheduler-panel history">
          <div className="panel-heading"><p>History</p><h2>Local Job History</h2></div>
          <div className="history-list">
            {history.map((entry) => (
              <article key={entry.history_id}>
                <strong>{entry.action}</strong>
                <span>{entry.job_name} · {entry.status}</span>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

