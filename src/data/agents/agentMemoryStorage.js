import { AGENT_CONTEXT_PACKET_SEED_V1, AGENT_CONTEXT_PACKET_STORAGE_KEY } from "./agentContextPackets";
import { AGENT_MEMORY_SEED_RECORDS_V1, AGENT_MEMORY_STORAGE_KEY } from "./agentMemoryRecords";
import {
  AGENT_MEMORY_REQUIRED_DEFAULTS,
  applyAgentMemorySafetyDefaults,
  buildAgentMemoryAuditEvent,
  scanAgentMemorySafety,
} from "./agentMemorySafety";

function canUseStorage() {
  try {
    return Boolean(globalThis?.localStorage);
  } catch {
    return false;
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function saveJson(key, value) {
  if (canUseStorage()) {
    globalThis.localStorage.setItem(key, JSON.stringify(value));
  }
  return value;
}

function readJson(key, fallback) {
  if (!canUseStorage()) return clone(fallback);
  try {
    const stored = globalThis.localStorage.getItem(key);
    if (!stored) {
      const seed = clone(fallback);
      saveJson(key, seed);
      return seed;
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : clone(fallback);
  } catch {
    return clone(fallback);
  }
}

export function getAgentMemoryRecords() {
  return readJson(AGENT_MEMORY_STORAGE_KEY, AGENT_MEMORY_SEED_RECORDS_V1)
    .map((record) => applyAgentMemorySafetyDefaults(record));
}

export function saveAgentMemoryRecords(records) {
  return saveJson(
    AGENT_MEMORY_STORAGE_KEY,
    (Array.isArray(records) ? records : []).map((record) => applyAgentMemorySafetyDefaults(record))
  );
}

export function resetAgentMemoryRecords() {
  return saveAgentMemoryRecords(clone(AGENT_MEMORY_SEED_RECORDS_V1));
}

export function getAgentContextPackets() {
  return readJson(AGENT_CONTEXT_PACKET_STORAGE_KEY, AGENT_CONTEXT_PACKET_SEED_V1);
}

export function saveAgentContextPackets(packets) {
  const safePackets = (Array.isArray(packets) ? packets : []).map((packet) => ({
    ...packet,
    safe_for_public: false,
    public_approved: false,
    operator_review_required: true,
    safe_for_execution_stub: packet.blocked_items?.length ? false : packet.safe_for_execution_stub !== false,
  }));
  return saveJson(AGENT_CONTEXT_PACKET_STORAGE_KEY, safePackets);
}

export function resetAgentContextPackets() {
  return saveAgentContextPackets(clone(AGENT_CONTEXT_PACKET_SEED_V1));
}

export function createAgentMemoryRecord(overrides = {}) {
  const records = getAgentMemoryRecords();
  const createdAt = nowIso();
  const memoryId = `mem_${String(records.length + 1).padStart(3, "0")}_${Date.now().toString(36)}`;
  const draft = {
    memory_id: memoryId,
    title: overrides.title || "Manual memory note",
    summary: overrides.summary || "Operator-created Agent Memory V1 note.",
    memory_type: overrides.memory_type || "manual",
    source_system: overrides.source_system || "manual",
    source_ref: overrides.source_ref || "agent_workbench/manual_memory",
    related_agent_id: overrides.related_agent_id || "",
    related_task_id: overrides.related_task_id || "",
    related_client_id: overrides.related_client_id || "",
    related_project_id: overrides.related_project_id || "",
    related_report_id: overrides.related_report_id || "",
    visibility: "internal_only",
    sensitivity: overrides.sensitivity || "medium",
    status: overrides.status || "active",
    confidence: overrides.confidence || "medium",
    tags: Array.isArray(overrides.tags) ? overrides.tags : ["manual", "operator_review"],
    operator_note: overrides.operator_note || "Operator review required before reuse.",
    created_at: createdAt,
    updated_at: createdAt,
    expires_at: overrides.expires_at || "",
    audit_events: [
      buildAgentMemoryAuditEvent("memory_created", "Operator-created memory record stored in local V1 state."),
    ],
    ...AGENT_MEMORY_REQUIRED_DEFAULTS,
    contains_pii: false,
    contains_secret: false,
  };
  const safeRecord = applyAgentMemorySafetyDefaults(draft);
  if (safeRecord.status === "needs_review") {
    safeRecord.audit_events.push(buildAgentMemoryAuditEvent("memory_safety_flagged", "Deterministic memory safety scan marked this record needs_review."));
  }
  return saveAgentMemoryRecords([safeRecord, ...records]);
}

export function updateAgentMemoryRecord(memoryId, updater) {
  const records = getAgentMemoryRecords();
  const nextRecords = records.map((record) => {
    if (record.memory_id !== memoryId) return record;
    const next = typeof updater === "function" ? updater({ ...record }) : { ...record, ...updater };
    return applyAgentMemorySafetyDefaults({
      ...next,
      updated_at: nowIso(),
      audit_events: Array.isArray(next.audit_events) ? next.audit_events : [],
    });
  });
  return saveAgentMemoryRecords(nextRecords);
}

export function archiveAgentMemoryRecord(memoryId) {
  return updateAgentMemoryRecord(memoryId, (record) => ({
    ...record,
    status: "archived",
    audit_events: [
      ...(record.audit_events || []),
      buildAgentMemoryAuditEvent("memory_archived", "Operator archived memory record."),
    ],
  }));
}

export function markAgentMemoryNeedsReview(memoryId) {
  return updateAgentMemoryRecord(memoryId, (record) => ({
    ...record,
    status: "needs_review",
    audit_events: [
      ...(record.audit_events || []),
      buildAgentMemoryAuditEvent("memory_marked_needs_review", "Operator marked memory for review."),
    ],
  }));
}

export function createAgentContextPacket({ task, agent, memoryIds = [], purpose = "" }) {
  const records = getAgentMemoryRecords();
  const packets = getAgentContextPackets();
  const createdAt = nowIso();
  const includedRecords = records.filter((record) => memoryIds.includes(record.memory_id));
  const blockedItems = includedRecords.flatMap((record) => scanAgentMemorySafety(record).blocked_items);
  const packet = {
    context_packet_id: `ctx_${String(packets.length + 1).padStart(3, "0")}_${Date.now().toString(36)}`,
    title: `${task?.title || agent?.name || "Agent"} context packet`,
    agent_id: agent?.id || task?.assigned_agent_id || "",
    task_id: task?.task_id || "",
    purpose: purpose || "Support internal Agent Workbench operator review.",
    included_memory_ids: memoryIds,
    context_summary: includedRecords.length
      ? includedRecords.map((record) => record.title).join("; ")
      : "No memory records included yet.",
    risk_summary: blockedItems.length
      ? "One or more included memories require operator review before safe stub use."
      : "No deterministic V1 memory safety blockers detected.",
    blocked_items: [...new Set(blockedItems)],
    operator_review_required: true,
    created_at: createdAt,
    safe_for_execution_stub: blockedItems.length === 0,
    safe_for_public: false,
    public_approved: false,
  };
  return saveAgentContextPackets([packet, ...packets]);
}

export function getMemoryRecordsForTask(taskId, records = getAgentMemoryRecords()) {
  return (records || []).filter((record) => record.related_task_id === taskId);
}

export function getContextPacketsForTask(taskId, packets = getAgentContextPackets()) {
  return (packets || []).filter((packet) => packet.task_id === taskId);
}
