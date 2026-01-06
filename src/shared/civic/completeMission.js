// src/shared/civic/completeMission.js
const KEY_ATTEST = "civic:attestations";     // JSON[]
const KEY_WALLET_HIST = "wallet:history";    // JSON[]
const KPI_MICRO_DONE_A = "ns:kpi:microLessonsCompleted";
const KPI_MICRO_DONE_B = "civic:kpi:microDone";

function loadJSON(k, d=[]) { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : d; } catch { return d; } }
function saveJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
function readKPI(k){ try { return Number(localStorage.getItem(k)||"0"); } catch { return 0; } }
function writeKPI(k, v){ try { localStorage.setItem(k, String(Math.max(0, Number(v)||0))); window.dispatchEvent(new StorageEvent("storage", { key:k })); } catch {} }
function bumpKPI(k, d=1){ writeKPI(k, readKPI(k)+Number(d)); }

export function appendWalletHistory(delta, note) {
  const arr = loadJSON(KEY_WALLET_HIST, []);
  arr.push({ at: Date.now(), delta: Number(delta)||0, note: note || "Activity" });
  saveJSON(KEY_WALLET_HIST, arr.slice(-500)); // keep last 500
}

export function showToastSafe(payload) {
  try {
    // if ToastsProvider exists, use event bridge
    window.dispatchEvent(new CustomEvent("toast:show", { detail: payload }));
  } catch {}
}

/**
 * Complete a micro-lesson:
 * - records attestation
 * - awards points + normalized badge "micro:{id}"
 * - logs wallet history
 * - bumps KPIs
 * - fires a toast
 */
export function completeMicroLesson({ id, points = 10 }, rewardsAPI = {}) {
  const lessonId = String(id || "").trim();
  if (!lessonId) return;

  // 1) attestation
  const attest = loadJSON(KEY_ATTEST, []);
  const exists = attest.find((a) => a.eventType === "micro-lesson-complete" && a.lessonId === lessonId);
  if (!exists) {
    attest.push({ eventType: "micro-lesson-complete", lessonId, timestamp: Date.now() });
    saveJSON(KEY_ATTEST, attest);
    window.dispatchEvent(new StorageEvent("storage", { key: KEY_ATTEST, newValue: "updated" }));
  }

  // 2) rewards (points + normalized badge)
  const { addPoints, addBadge, badges = [] } = rewardsAPI || {};
  const badgeId = `micro:${lessonId}`;
  try { addPoints?.(Number(points)||0); } catch {}
  if (!badges?.includes(badgeId)) { try { addBadge?.(badgeId); } catch {} }

  // 3) wallet history log
  appendWalletHistory(points || 0, `Completed micro-lesson ${lessonId}`);

  // 4) KPIs (both keys we track)
  bumpKPI(KPI_MICRO_DONE_A, +1);
  bumpKPI(KPI_MICRO_DONE_B, +1);

  // 5) toast (no alert)
  showToastSafe({ kind: "success", text: `✅ Mission complete — +${points || 0} pts • Badge ${badgeId}` });
}
