const KEY = "shf:externalProofs:v1";

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch { return []; }
}
function save(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

/** Submit proof for a completed external course */
export function submitProof({ userId, courseId, method, payload }) {
  const list = load();
  const item = {
    id: crypto.randomUUID(),
    userId, courseId, method, payload,
    status: "pending",
    submittedAt: Date.now()
  };
  list.push(item);
  save(list);
  return item;
}

/** List proofs; pass a filter object {status, userId, courseId} */
export function listProofs(filter = {}) {
  const list = load();
  return list.filter(p => {
    if (filter.status && p.status !== filter.status) return false;
    if (filter.userId && p.userId !== filter.userId) return false;
    if (filter.courseId && p.courseId !== filter.courseId) return false;
    return true;
  });
}

/** Update proof status; returns updated record */
export function setProofStatus(id, status, meta = {}) {
  const list = load();
  const idx = list.findIndex(p => p.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], status, ...meta, reviewedAt: Date.now() };
  save(list);
  return list[idx];
}
