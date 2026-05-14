export function listNotes(lessonId) {
  try { return JSON.parse(localStorage.getItem(`civic:lesson:${lessonId}:notes`) || "[]"); }
  catch { return []; }
}

export function addNote(lessonId, anchorIdx, selectionText, note) {
  const items = listNotes(lessonId);
  const n = {
    id: `n-${Date.now()}`,
    t: Date.now(),
    anchorIdx,           // paragraph index within .sh-cardContent
    selectionText: String(selectionText || "").slice(0, 500),
    note: String(note || "").slice(0, 1000),
  };
  items.push(n);
  try { localStorage.setItem(`civic:lesson:${lessonId}:notes`, JSON.stringify(items)); } catch {}
  window.dispatchEvent(new CustomEvent("notes:update", { detail: { lessonId } }));
  return n;
}

export function removeNote(lessonId, id) {
  const items = listNotes(lessonId).filter(n => n.id !== id);
  try { localStorage.setItem(`civic:lesson:${lessonId}:notes`, JSON.stringify(items)); } catch {}
  window.dispatchEvent(new CustomEvent("notes:update", { detail: { lessonId } }));
}

export function notesToPortfolioArtifact(lessonId, title) {
  const items = listNotes(lessonId);
  return {
    id: `notes-${lessonId}-${Date.now()}`,
    kind: "notes",
    title: `Notes — ${title || ("Lesson " + lessonId)}`,
    lessonId,
    createdAt: Date.now(),
    tags: ["civic", "lesson", "notes"],
    pathwayId: null,
    notes: items
  };
}
