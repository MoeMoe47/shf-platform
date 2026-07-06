import { createJob } from "./shsJobTypes";

export const SHS_RECURRING_JOB_TEMPLATES = Object.freeze([
  createJob({
    job_id: "template_daily_governance_review",
    job_type: "governance",
    job_name: "daily.governance.review.preview",
    target_layer: "Governance",
    schedule_mode: "recurring_template",
    recurrence: "daily",
    risk_level: "medium",
    status: "paused",
    payload: { command: "preview daily governance checklist", execution_requested: false },
  }),
  createJob({
    job_id: "template_runtime_hygiene_review",
    job_type: "maintenance",
    job_name: "runtime.hygiene.review.preview",
    target_layer: "Runtime Hygiene",
    schedule_mode: "recurring_template",
    recurrence: "weekly",
    risk_level: "low",
    status: "paused",
    payload: { command: "preview runtime hygiene status", execution_requested: false },
  }),
  createJob({
    job_id: "template_event_bus_replay_review",
    job_type: "event_bus",
    job_name: "event.bus.replay.review.preview",
    target_layer: "Event Bus",
    schedule_mode: "recurring_template",
    recurrence: "manual",
    risk_level: "low",
    status: "paused",
    payload: { command: "preview local event replay", execution_requested: false },
  }),
]);

export function createLocalJobFromTemplate(templateId) {
  const template = SHS_RECURRING_JOB_TEMPLATES.find((job) => job.job_id === templateId) || SHS_RECURRING_JOB_TEMPLATES[0];
  return createJob({
    ...template,
    job_id: "",
    status: "queued",
    schedule_mode: template.recurrence === "manual" ? "manual" : "recurring_template",
    operator_note: `Created from ${template.job_id}.`,
  });
}

