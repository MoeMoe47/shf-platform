// src/utils/zoomAccess.js
// Zoom access + approvals + meeting links (localStorage-backed)
//
// Storage keys
// - zoom:reqs         -> [{ userId, name, ts, note? }]
// - zoom:approvals    -> [{ userId, approved, approver?, note?, expiresAt? }]
// - zoom:approved     -> ["userId", ...]            (legacy allow-list; kept for compat)
// - zoom:allow:<id>   -> "1" when approved          (legacy per-user flag; kept for compat)
// - zoom:ops          -> meeting url
// - zoom:incident     -> meeting url
// - zoom:lockdown     -> "1" blocks non-admin joins

const PENDING_KEY   = "zoom:reqs";
const APPROVALS_KEY = "zoom:approvals";
const APPROVED_KEY  = "zoom:approved";
const ALLOW_PREFIX  = "zoom:allow:";
const LOCKDOWN_KEY  = "zoom:lockdown";

/* ---------------- Permission gate ---------------- */
export function canJoinZoom({ userId = "", role = "student" } = {}) {
  const isAdmin = /^(admin|staff|instructor|ops|support)$/i.test(String(role || ""));
  if (isAdmin) return true;
  if (getLockdown()) return false;
  return hasZoomAccess(userId);
}
export function hasZoomAccess(userId = "") {
  if (!userId) return false;
  // modern: check active approval record
  const a = listZoomApprovals().find(x => x.userId === userId);
  if (a && a.approved && (!a.expiresAt || a.expiresAt > Date.now())) return true;
  // legacy flags
  try { if (localStorage.getItem(keyAllow(userId)) === "1") return true; } catch {}
  return getApproved().includes(userId);
}

/* ---------------- Requests (student flow) ---------------- */
export function requestZoomAccess({ userId, name, note } = {}) {
  if (!userId) return snapshot();
  // if already approved, no-op
  if (hasZoomAccess(userId)) return snapshot();

  const reqs = readJSON(PENDING_KEY, []);
  if (!reqs.some(r => r.userId === userId)) {
    reqs.push({ userId, name: name || userId, ts: Date.now(), note });
    writeJSON(PENDING_KEY, reqs);
    touch(PENDING_KEY);
  }
  return snapshot();
}

/* ---------------- Admin: lists ---------------- */
export function listZoomRequests() {
  // shape expected by AdminAlerts: { userId, ts, note? }
  const reqs = readJSON(PENDING_KEY, []);
  return reqs
    .slice()
    .sort((a, b) => (b.ts || 0) - (a.ts || 0))
    .map(r => ({ userId: r.userId, ts: r.ts, note: r.note }));
}

export function listZoomApprovals() {
  // shape: { userId, approved, approver?, note?, expiresAt? }
  const list = readJSON(APPROVALS_KEY, []);
  // sort: active first, then by soonest expiry
  return list.slice().sort((a, b) => {
    const aw = (a.approved ? 0 : 1), bw = (b.approved ? 0 : 1);
    if (aw !== bw) return aw - bw;
    return (a.expiresAt || 0) - (b.expiresAt || 0);
  });
}

/* ---------------- Admin: actions ---------------- */
export function approveZoomAccess(userId = "", { approver, hours = 4, note } = {}) {
  if (!userId) return snapshot();

  // legacy allow flags (for older components)
  try { localStorage.setItem(keyAllow(userId), "1"); } catch {}
  const approvedIds = new Set(readJSON(APPROVED_KEY, []));
  approvedIds.add(userId);
  writeJSON(APPROVED_KEY, [...approvedIds]);

  // upsert approval record
  const approvals = readJSON(APPROVALS_KEY, []);
  const idx = approvals.findIndex(a => a.userId === userId);
  const expiresAt = Date.now() + Math.max(0, Number(hours) || 0) * 3600 * 1000;
  const rec = { userId, approved: true, approver, note, expiresAt };
  if (idx >= 0) approvals[idx] = { ...approvals[idx], ...rec };
  else approvals.push(rec);
  writeJSON(APPROVALS_KEY, approvals);

  // remove any pending request
  const nextReqs = readJSON(PENDING_KEY, []).filter(r => r.userId !== userId);
  writeJSON(PENDING_KEY, nextReqs);

  touch(APPROVALS_KEY); touch(PENDING_KEY); touch(keyAllow(userId));
  return snapshot();
}

export function revokeZoomAccess(userId = "", note) {
  if (!userId) return snapshot();

  // clear legacy allow + approved list
  try { localStorage.removeItem(keyAllow(userId)); } catch {}
  const approvedIds = new Set(readJSON(APPROVED_KEY, []));
  approvedIds.delete(userId);
  writeJSON(APPROVED_KEY, [...approvedIds]);

  // mark approval record as revoked
  const approvals = readJSON(APPROVALS_KEY, []);
  const idx = approvals.findIndex(a => a.userId === userId);
  if (idx >= 0) {
    approvals[idx] = { ...approvals[idx], approved: false, note, expiresAt: null };
  } else {
    approvals.push({ userId, approved: false, note, expiresAt: null });
  }
  writeJSON(APPROVALS_KEY, approvals);

  // also remove any pending request for this user
  const nextReqs = readJSON(PENDING_KEY, []).filter(r => r.userId !== userId);
  writeJSON(PENDING_KEY, nextReqs);

  touch(APPROVALS_KEY); touch(PENDING_KEY);
  return snapshot();
}

/* ---------------- Meeting links ---------------- */
export function getOpsLink()            { return localStorage.getItem("zoom:ops") || ""; }
export function setOpsLink(url = "")    { try { localStorage.setItem("zoom:ops", url); } catch {} touch("zoom:ops"); }
export function getIncidentLink()       { return localStorage.getItem("zoom:incident") || ""; }
export function setIncidentLink(url="") { try { localStorage.setItem("zoom:incident", url); } catch {} touch("zoom:incident"); }

/* ---------------- Lockdown switch ---------------- */
export function getLockdown() {
  try { return localStorage.getItem(LOCKDOWN_KEY) === "1"; } catch { return false; }
}
export function setLockdown(on = false) {
  try { on ? localStorage.setItem(LOCKDOWN_KEY, "1") : localStorage.removeItem(LOCKDOWN_KEY); } catch {}
  touch(LOCKDOWN_KEY);
}

/* ---------------- Back-compat aliases ---------------- */
// older Admin pages / components
export const approveZoom = (...args) => approveZoomAccess(...args);
export const denyZoom    = (userId, note) => revokeZoomAccess(userId, note);
export const getPending  = () => listZoomRequests();
export function getApproved() {
  // active approvals (not expired) + legacy allow flags + legacy list
  const active = listZoomApprovals()
    .filter(a => a.approved && (!a.expiresAt || a.expiresAt > Date.now()))
    .map(a => a.userId);

  const legacyIds = new Set(readJSON(APPROVED_KEY, []));
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(ALLOW_PREFIX) && localStorage.getItem(k) === "1") {
        legacyIds.add(k.slice(ALLOW_PREFIX.length));
      }
    }
  } catch {}
  return Array.from(new Set([...active, ...legacyIds]));
}
export const listRequests      = () => listZoomRequests();
export const listZoomApprovalsRaw = () => readJSON(APPROVALS_KEY, []);
export const approveZoomAccessRaw = approveZoomAccess;
export const revokeZoomAccessRaw  = revokeZoomAccess;

/* ---------------- internals ---------------- */
function keyAllow(userId) { return `${ALLOW_PREFIX}${userId}`; }
function readJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); }
  catch { return fallback; }
}
function writeJSON(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
function touch(key) { try { localStorage.setItem(`${key}:ts`, String(Date.now())); } catch {} }
function snapshot() { return { pending: listZoomRequests(), approved: getApproved() }; }
