// src/utils/familyEngagement.js
const SESSIONS = "sh:family:sessions";   // [{ ts, lessonSlug, coachRole }]
const BADGES   = "sh:family:badges";     // ["parent_mentor_v1", ...]

export function logCoachSession({ lessonSlug = "", coachRole = "parent" } = {}) {
  const list = read(SESSIONS, []);
  list.unshift({ ts: Date.now(), lessonSlug, coachRole });
  write(SESSIONS, list.slice(0, 500));
  maybeAwardParentMentor();
  // TODO: webhook/ledger emit here
}

export function getCoachSessions() {
  return read(SESSIONS, []);
}

export function getBadges() {
  return read(BADGES, []);
}

function maybeAwardParentMentor() {
  const badges = new Set(read(BADGES, []));
  if (badges.has("parent_mentor_v1")) return;
  const sessions = read(SESSIONS, []);
  const parentGuides = sessions.filter(s => s.coachRole === "parent").length;
  if (parentGuides >= 10) {
    badges.add("parent_mentor_v1");
    write(BADGES, [...badges]);
    // TODO: call your certificate minter / Polygon write
    console.log("[family] awarded badge: parent_mentor_v1");
  }
}

function read(k, f) {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch { return f; }
}
function write(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}
