const REVIEW_NOTES_KEY = "shs.systemRegistry.reviewNotes.v1";
const EXPORTS_KEY = "shs.systemRegistry.localExports.v1";

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") || fallback;
  } catch {
    return fallback;
  }
}

export function getSystemRegistryReviewNotes() {
  return readJson(REVIEW_NOTES_KEY, {});
}

export function markSystemRegistryReviewNote(layerId, note) {
  const notes = getSystemRegistryReviewNotes();
  notes[layerId] = {
    layer_id: layerId,
    note,
    reviewed_at: new Date().toISOString(),
  };
  localStorage.setItem(REVIEW_NOTES_KEY, JSON.stringify(notes));
  return notes;
}

export function exportSystemRegistrySummary(summary) {
  const exports = readJson(EXPORTS_KEY, []);
  const record = {
    export_id: `registry_export_${Date.now()}`,
    exported_at: new Date().toISOString(),
    summary,
  };
  const next = [record, ...exports].slice(0, 10);
  localStorage.setItem(EXPORTS_KEY, JSON.stringify(next));
  console.info("[system-registry] local summary export", record);
  return record;
}

