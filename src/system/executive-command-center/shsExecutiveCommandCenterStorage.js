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
  if (!canUseStorage()) return fallback;
  try {
    const value = globalThis.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
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
  return writeJson(REVIEWED_KEY, [...reviewed]);
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
