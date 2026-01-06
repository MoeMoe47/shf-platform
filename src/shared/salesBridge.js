// Employer → Sales intent sync. Uses API if present; falls back to local queue.
const KEY = "sales:leadQueue";

export async function salesLeadSync(payload) {
  try {
    const res = await fetch("/api/sales/lead-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("No backend handler");
  } catch {
    const q = JSON.parse(localStorage.getItem(KEY) || "[]");
    q.push({ ...payload, _local: true });
    localStorage.setItem(KEY, JSON.stringify(q));
    window.dispatchEvent(new CustomEvent("sales:leadQueue:updated"));
  }
}
