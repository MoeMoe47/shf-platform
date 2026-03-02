/**
 * Growth Observation Tower — Dopamine Layer
 * - Minimal, local-first, non-invasive
 * - Later: swap events to Watchtower/Postgres truth
 */

const KEY = "shf.growthObs.dopamine.v1";

const now = () => Date.now();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function save(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function initDopamine() {
  const s = load();
  const t = now();

  // Basic streak logic: if visit within 36h, keep streak; if >36h, reset.
  if (!s) {
    const fresh = {
      xp: 25,
      level: 1,
      streak: 1,
      lastVisitAt: t,
      lastSignalAt: 0,
      lastAttestationAt: 0,
      lastExportAt: 0,
    };
    save(fresh);
    return fresh;
  }

  const hours = (t - (s.lastVisitAt || 0)) / (1000 * 60 * 60);
  const streak = hours <= 36 ? (s.streak || 1) : 1;

  const bumped = {
    ...s,
    streak,
    lastVisitAt: t,
  };

  // Small “return reward”
  bumped.xp = (bumped.xp || 0) + 10;

  // Level-up every 250 XP
  const level = Math.max(1, Math.floor((bumped.xp || 0) / 250) + 1);
  bumped.level = level;

  save(bumped);
  return bumped;
}

export function addXP(amount = 10) {
  const s = load() || initDopamine();
  const next = { ...s, xp: (s.xp || 0) + amount };
  next.level = Math.max(1, Math.floor((next.xp || 0) / 250) + 1);
  save(next);
  return next;
}

export function markEvent(kind) {
  const s = load() || initDopamine();
  const t = now();
  const next = { ...s };

  if (kind === "signal") next.lastSignalAt = t;
  if (kind === "attestation") next.lastAttestationAt = t;
  if (kind === "export") next.lastExportAt = t;

  save(next);
  return next;
}

export function getDopamine() {
  return load() || initDopamine();
}

export function resetDopamine() {
  localStorage.removeItem(KEY);
}
