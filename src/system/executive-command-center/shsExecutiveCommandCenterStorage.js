import {
  readCriticalStateRecords,
  writeCriticalStateRecords,
} from "@/system/persistence/migrations/criticalStateMigrationCompatibility";

const NOTE_KEY = "shs_bos_executive_command_center_v1_notes";
const REVIEWED_KEY = "shs_bos_executive_command_center_v1_reviewed";
const SNAPSHOT_KEY = "shs_bos_executive_command_center_v1_snapshots";
const FILTER_KEY = "shs_bos_executive_command_center_v1_filters";

function canUseStorage() {
  try {
    return Boolean(globalThis?.localStorage);
  } catch {
    return false;
  }
}

function readJson(key, fallback) {
  if (key !== FILTER_KEY) {
    const records = readCriticalStateRecords("executive_command_center", key, Array.isArray(fallback) ? fallback : [], {
      repository: "executive_command_center",
      idField: key === SNAPSHOT_KEY ? "snapshot_id" : key === NOTE_KEY ? "note_id" : "priority_id",
      schemaVersion: "shs.critical.executive-command-center.v1",
    });
    if (key === NOTE_KEY) return records.filter((record) => record.critical_record_type === "operator_note" || record.note_id);
    if (key === REVIEWED_KEY) return records.filter((record) => record.critical_record_type === "priority_review").map((record) => record.priority_id);
    if (key === SNAPSHOT_KEY) return records.filter((record) => record.critical_record_type === "executive_snapshot" || record.snapshot_id);
    return records;
  }
  if (!canUseStorage()) return fallback;
  try {
    const value = globalThis.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (key !== FILTER_KEY) {
    const typed = (Array.isArray(value) ? value : []).map((record) => {
      if (key === NOTE_KEY) return { ...record, critical_record_type: "operator_note" };
      if (key === REVIEWED_KEY) return { ...(typeof record === "string" ? { priority_id: record } : record), critical_record_type: "priority_review" };
      if (key === SNAPSHOT_KEY) return { ...record, critical_record_type: "executive_snapshot" };
      return record;
    });
    return writeCriticalStateRecords("executive_command_center", key, typed, {
      repository: "executive_command_center",
      idField: key === SNAPSHOT_KEY ? "snapshot_id" : key === NOTE_KEY ? "note_id" : "priority_id",
      schemaVersion: "shs.critical.executive-command-center.v1",
      change_summary: "Executive Command Center critical state write",
    });
  }
  if (canUseStorage()) globalThis.localStorage.setItem(key, JSON.stringify(value));
  return value;
}

export function getExecutiveNotes() {
  return readJson(NOTE_KEY, []);
}

export function addExecutiveOperatorNote(note = "") {
  const text = String(note || "").trim();
  if (!text) return getExecutiveNotes();
  return writeJson(NOTE_KEY, [
    { note_id: `note_${Date.now()}`, note: text, created_at: new Date().toISOString(), local_only: true },
    ...getExecutiveNotes(),
  ].slice(0, 40));
}

export function getReviewedPriorities() {
  return readJson(REVIEWED_KEY, []);
}

export function markExecutivePriorityReviewed(priorityId) {
  const reviewed = new Set(getReviewedPriorities());
  reviewed.add(priorityId);
  return writeJson(REVIEWED_KEY, [...reviewed].map((id) => ({
    priority_id: id,
    reviewed_at: new Date().toISOString(),
    critical_record_type: "priority_review",
  }))).map((record) => record.priority_id);
}

export function getExecutiveSnapshots() {
  return readJson(SNAPSHOT_KEY, []);
}

export function saveExecutiveSnapshot(snapshot) {
  return writeJson(SNAPSHOT_KEY, [snapshot, ...getExecutiveSnapshots()].slice(0, 20));
}

export function archiveExecutiveSnapshot(snapshotId) {
  return writeJson(SNAPSHOT_KEY, getExecutiveSnapshots().filter((snapshot) => snapshot.snapshot_id !== snapshotId));
}

export function getExecutiveFilters() {
  return readJson(FILTER_KEY, { status: "all", category: "all" });
}

export function saveExecutiveFilters(filters = {}) {
  return writeJson(FILTER_KEY, { ...getExecutiveFilters(), ...filters });
}
