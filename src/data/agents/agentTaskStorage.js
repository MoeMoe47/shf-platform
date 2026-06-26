import { AGENT_TASK_QUEUE_SEED_V1, AGENT_TASK_QUEUE_STORAGE_KEY } from "./agentTaskQueue";

function canUseStorage() {
  try {
    return Boolean(globalThis?.localStorage);
  } catch {
    return false;
  }
}

function cloneTasks(tasks) {
  return JSON.parse(JSON.stringify(tasks));
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeTaskAuditEvents(task) {
  const seenEventIds = new Set();
  const auditEvents = (Array.isArray(task.audit_events) ? task.audit_events : []).map((event, index) => {
    const baseId = event?.event_id || `agevt_${task.task_id || "unknown"}_${index}`;
    const eventId = seenEventIds.has(baseId)
      ? `${baseId}_${index}_${Math.random().toString(36).slice(2, 8)}`
      : baseId;
    seenEventIds.add(eventId);
    return {
      ...event,
      event_id: eventId,
    };
  });
  return {
    ...task,
    audit_events: auditEvents,
  };
}

function normalizeTasks(tasks) {
  return (Array.isArray(tasks) ? tasks : []).map((task) => normalizeTaskAuditEvents(task));
}

function makeEvent(taskId, eventType, message, actor = "shs_operator") {
  const suffix = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    event_id: `agevt_${taskId}_${suffix}`,
    event_type: eventType,
    actor,
    message,
    created_at: nowIso(),
  };
}

export function getAgentTasks() {
  if (!canUseStorage()) return normalizeTasks(cloneTasks(AGENT_TASK_QUEUE_SEED_V1));

  try {
    const stored = globalThis.localStorage.getItem(AGENT_TASK_QUEUE_STORAGE_KEY);
    if (!stored) {
      const seed = normalizeTasks(cloneTasks(AGENT_TASK_QUEUE_SEED_V1));
      globalThis.localStorage.setItem(AGENT_TASK_QUEUE_STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }

    const parsed = JSON.parse(stored);
    const tasks = Array.isArray(parsed) ? normalizeTasks(parsed) : normalizeTasks(cloneTasks(AGENT_TASK_QUEUE_SEED_V1));
    globalThis.localStorage.setItem(AGENT_TASK_QUEUE_STORAGE_KEY, JSON.stringify(tasks));
    return tasks;
  } catch {
    return normalizeTasks(cloneTasks(AGENT_TASK_QUEUE_SEED_V1));
  }
}

export function saveAgentTasks(tasks) {
  const safeTasks = normalizeTasks(tasks);
  if (canUseStorage()) {
    globalThis.localStorage.setItem(AGENT_TASK_QUEUE_STORAGE_KEY, JSON.stringify(safeTasks));
  }
  return safeTasks;
}

export function resetAgentTasks() {
  const seed = cloneTasks(AGENT_TASK_QUEUE_SEED_V1);
  return saveAgentTasks(seed);
}

export function createAgentTask(overrides = {}) {
  const tasks = getAgentTasks();
  const createdAt = nowIso();
  const taskId = `agtask_${String(tasks.length + 1).padStart(3, "0")}_${Date.now().toString(36)}`;
  const task = {
    task_id: taskId,
    title: overrides.title || "Manual agent review task",
    task_type: overrides.task_type || "unknown",
    assigned_agent_id: overrides.assigned_agent_id || "",
    source_system: overrides.source_system || "manual",
    priority: overrides.priority || "normal",
    risk_level: overrides.risk_level || "medium",
    status: overrides.status || "queued",
    approval_status: overrides.approval_status || "required",
    intended_action: overrides.intended_action || "Review and recommend safe next steps. No production action will execute.",
    agent_recommendation: overrides.agent_recommendation || "Keep task in operator-controlled review until governance checks are clear.",
    operator_note: overrides.operator_note || "",
    created_at: createdAt,
    updated_at: createdAt,
    blockers: Array.isArray(overrides.blockers) ? overrides.blockers : [],
    warnings: Array.isArray(overrides.warnings) ? overrides.warnings : ["V1 task approval changes status only."],
    audit_events: [
      makeEvent(taskId, "task_created", "Operator-created safe V1 task."),
    ],
  };
  return saveAgentTasks([task, ...tasks]);
}

export function updateAgentTask(taskId, updater) {
  const tasks = getAgentTasks();
  const updatedTasks = tasks.map((task) => {
    if (task.task_id !== taskId) return task;
    const next = typeof updater === "function" ? updater({ ...task }) : { ...task, ...updater };
    return {
      ...next,
      updated_at: nowIso(),
      audit_events: Array.isArray(next.audit_events) ? next.audit_events : [],
    };
  });
  return saveAgentTasks(updatedTasks);
}

function appendTaskEvent(task, eventType, message, extra = {}) {
  return {
    ...task,
    ...extra,
    audit_events: [
      ...(Array.isArray(task.audit_events) ? task.audit_events : []),
      makeEvent(task.task_id, eventType, message),
    ],
  };
}

export function appendAgentTaskAuditEvent(taskId, eventType, message, extra = {}) {
  return updateAgentTask(taskId, (task) => appendTaskEvent(task, eventType, message, extra));
}

export function applyAgentTaskAction(taskId, action, note = "") {
  const messages = {
    approve: "Task approved for V1 queue status only. No production action executed.",
    reject: "Task rejected by operator.",
    complete: "Simulated task marked complete. No external or production action executed.",
    review: "Task returned to operator review.",
    note: "Operator note added.",
  };

  return updateAgentTask(taskId, (task) => {
    if (action === "approve") {
      return appendTaskEvent(task, "approval_changed", messages.approve, {
        status: "approved",
        approval_status: "approved",
        operator_note: note || task.operator_note,
      });
    }
    if (action === "reject") {
      return appendTaskEvent(task, "approval_changed", messages.reject, {
        status: "rejected",
        approval_status: "rejected",
        operator_note: note || task.operator_note,
      });
    }
    if (action === "complete") {
      return appendTaskEvent(task, "task_status_changed", messages.complete, {
        status: "completed",
        operator_note: note || task.operator_note,
      });
    }
    if (action === "review") {
      return appendTaskEvent(task, "task_status_changed", messages.review, {
        status: "in_review",
        approval_status: task.approval_status === "approved" ? "required" : task.approval_status,
        operator_note: note || task.operator_note,
      });
    }
    return appendTaskEvent(task, "note_added", note || messages.note, {
      operator_note: note || task.operator_note,
    });
  });
}
