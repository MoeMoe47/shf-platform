const KEY = "audit:log:v1";
const MAX = 2000;
export function audit(evt, data = {}) {
  try {
    const t = new Date().toISOString();
    const row = { t, evt, ...data };
    const prev = JSON.parse(localStorage.getItem(KEY) || "[]");
    prev.push(row);
    if (prev.length > MAX) prev.splice(0, prev.length - MAX);
    localStorage.setItem(KEY, JSON.stringify(prev));
  } catch {}
}
export function readAudit() { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } }
export function clearAudit() { localStorage.removeItem(KEY); }
