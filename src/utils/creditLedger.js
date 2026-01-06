// src/utils/creditLedger.js
const LS_KEY = "shf.credit.ledger.v1";

/* ---------------- storage utils ---------------- */
function load() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) ?? []; } catch { return []; }
}
function save(arr) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(arr)); } catch {}
}
function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function hashStr(s) {
  let h = 2166136261; // FNV-ish
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return (h >>> 0).toString(16);
}
function lastHash(ledger) {
  return ledger.length ? ledger[ledger.length - 1].hash : "genesis";
}

/* ---------------- public API ---------------- */
export function getLedger() { return load(); }
export function clearLedger() { save([]); }

/**
 * Append a canonical entry.
 * @param {Object} partial
 *  - actorId, actorRole, action
 *  - credits (score credits), tokens (map), currencyDelta (SHF delta, +mint / -spend)
 *  - meta (free-form)
 */
export function appendEntry(partial = {}) {
  const ledger = load();
  const base = {
    id: makeId(),
    ts: Date.now(),
    actorId: partial.actorId ?? "anon",
    actorRole: partial.actorRole ?? "student",
    action: partial.action ?? "misc",
    credits: Number(partial.credits || 0),
    tokens: partial.tokens ?? {},
    currencyDelta: Number(partial.currencyDelta || 0),
    meta: partial.meta ?? {},
    prev: lastHash(ledger),
  };
  const hash = hashStr(JSON.stringify(base));
  const entry = { ...base, hash };
  ledger.push(entry);
  save(ledger);
  return entry;
}

/** Aggregate balances (optionally filtered by actorId) */
export function balances(actorId) {
  const l = load();
  const tokens = {};
  let currency = 0;
  for (const e of l) {
    if (actorId && e.actorId !== actorId) continue;
    if (e.tokens) {
      for (const [k, v] of Object.entries(e.tokens)) {
        tokens[k] = (tokens[k] || 0) + Number(v || 0);
      }
    }
    currency += Number(e.currencyDelta || 0);
  }
  return { tokens, currency };
}

/** Export raw ledger (optionally filtered by actorId) */
export function exportLedger(actorId) {
  const l = load();
  return actorId ? l.filter((e) => e.actorId === actorId) : l;
}

/* ---------------- debts & disputes (light scaffolds) ---------------- */
export const listDebts = (actorId) =>
  exportLedger(actorId).filter((e) => String(e.action || "").startsWith("debt."));

export const openDebt = ({ actorId, actorRole = "student", usd, meta = {} }) =>
  appendEntry({ actorId, actorRole, action: "debt.open", meta: { usd, ...meta } });

export const payDebt = ({ actorId, amount, meta = {} }) =>
  appendEntry({ actorId, action: "debt.payment", currencyDelta: -Math.abs(Number(amount || 0)), meta });

export const openDispute = ({ actorId, targetId, reason }) =>
  appendEntry({ actorId, action: "dispute.open", meta: { targetId, reason } });

export const resolveDispute = ({ actorId, targetId, outcome }) =>
  appendEntry({ actorId, action: "dispute.resolve", meta: { targetId, outcome } });

/** Basic stats over a time window */
export function stats({ sinceDays = 30 } = {}) {
  const cutoff = Date.now() - sinceDays * 86400000;
  const l = getLedger().filter((e) => e.ts >= cutoff);
  const users = new Set();
  let credits = 0, minted = 0, spent = 0;
  const byAction = {};
  for (const e of l) {
    users.add(e.actorId);
    credits += Number(e.credits || 0);
    if (e.currencyDelta > 0) minted += e.currencyDelta;
    if (e.currencyDelta < 0) spent += Math.abs(e.currencyDelta);
    byAction[e.action] = (byAction[e.action] || 0) + 1;
  }
  return { actors: users.size, credits, minted, spent, byAction, entries: l.length };
}

/* ---------------- back-compat shims ----------------
   keep existing code working (CreditProvider calls readLogs/appendLog/clearLogs)
----------------------------------------------------*/
export function readLogs() { return getLedger(); }

export function appendLog(entry = {}) {
  // Map previous shape → canonical
  // prior fields: { type, action, rewards, scoreDelta, shfGain, in, meta, ... }
  const { type, action, rewards, scoreDelta, shfGain } = entry;
  const tokensIn = entry.in || rewards || {};
  const mapped = {
    action: action || (type === "convert" ? "convert.to.shf" : (type || "misc")),
    credits: Number(scoreDelta || 0),
    tokens: tokensIn,
    currencyDelta: Number(shfGain || 0),
    meta: entry.meta || entry,
  };
  return appendEntry(mapped);
}

export function clearLogs() { return clearLedger(); }
