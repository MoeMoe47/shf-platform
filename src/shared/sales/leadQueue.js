const KEY = "sales:leadQueue";

export function getLeadQueue() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function clearLeadQueue() {
  try { localStorage.removeItem(KEY); } catch {}
}
