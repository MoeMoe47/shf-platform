/**
 * Shared bridge from Employer flows to Sales queue.
 * Non-UI, safe in all apps. Backward-compatible exports preserved.
 */
import { pushNote } from "@/shared/inbox/inbox.js";

const KEY = "sales:leadQueue";

/* ---------- Storage helpers ---------- */
function readQueue() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function writeQueue(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
}

/* ---------- Queue ops (named exports) ---------- */
export function enqueueLocal(payload) {
  const q = readQueue();
  q.push({ ...payload, ts: Date.now(), status: payload.status || "new" });
  writeQueue(q);
  return q.length;
}

export function dequeue() {
  const q = readQueue();
  const item = q.shift();
  writeQueue(q);
  return item || null;
}

export function getQueue() {
  return readQueue();
}

/**
 * Primary handoff used by employer → sales proposal flow.
 * - Enqueues payload for Sales app processing.
 * - Drops a note into the shared inbox for visibility.
 */
export function handoffToSalesProposal(payload) {
  const len = enqueueLocal({ type: payload?.type || "proposal", ...payload });
  try {
    pushNote({
      channel: "sales",
      title: "New Proposal Handoff",
      body: payload?.summary || "A proposal was handed off from Employer flow.",
      meta: { len, leadId: payload?.leadId, source: payload?.source || "employer" },
    });
  } catch {}
  return { ok: true, length: len };
}

/* Back-compat aliases for older callers */
export function bridgeToSales(payload) {
  return handoffToSalesProposal(payload);
}

export function salesLeadSync(payload) {
  // Treat as a lead-type handoff but same queue path
  return handoffToSalesProposal({ type: "lead", ...payload, via: "salesLeadSync" });
}
