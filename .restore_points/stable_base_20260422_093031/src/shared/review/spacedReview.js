// Lightweight spaced-review (Leitner-style) that stores cards in localStorage.
// API:
//   seedReview(cards[])            -> store/merge cards for the current user
//   getDue(now=Date.now())         -> returns [{id,kind,prompt,answer,lessonId, box, dueAt}, ...]
//   scheduleNext(id, rating)       -> updates box/dueAt (rating: 0..3)
//   getAllCards()                  -> all cards (for totals / debug)
//   clearReview()                  -> (optional) wipe everything
//
// Back-compat adapters (from previous SM-2ish version):
//   getDueReviews(limit)           -> alias over getDue()
//   recordOutcome(id, outcome)     -> alias over scheduleNext()

const NEW_KEY = "review:cards";           // new store
const OLD_KEY = "civic:review:items";     // legacy SM-2ish store (we'll migrate once)

/* ────────────────────────────────────────────────────────────────
   Storage helpers + one-time migration from OLD_KEY → NEW_KEY
   (keeps user’s prior progress)
   Legacy item shape (approx):
     { id, kind?, prompt?, answer?, lessonId?, ef, interval, rep, due }
   Leitner shape:
     { id, kind, prompt, answer, lessonId, box, dueAt, seen, correct }
----------------------------------------------------------------- */
function readAllRaw() {
  try {
    const raw = localStorage.getItem(NEW_KEY);
    const arr = JSON.parse(raw || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeAll(arr) {
  try { localStorage.setItem(NEW_KEY, JSON.stringify(arr || [])); } catch {}
}

function migrateOnceIfNeeded() {
  // If new store already exists/non-empty, skip.
  const existing = readAllRaw();
  if (existing.length > 0) return;

  // Pull old store; if missing, nothing to migrate.
  let old = [];
  try {
    const raw = localStorage.getItem(OLD_KEY);
    old = Array.isArray(JSON.parse(raw || "[]")) ? JSON.parse(raw || "[]") : [];
  } catch {
    old = [];
  }
  if (!old.length) return;

  // Map SM-2ish to Leitner best-effort.
  // - due -> dueAt
  // - interval/rep -> approximate box
  //     interval < 1d  -> box 1
  //     < 3d           -> box 2
  //     < 7d           -> box 3
  //     < 15d          -> box 4
  //     >= 15d         -> box 5
  const dayMs = 24 * 60 * 60 * 1000;
  const mapped = old
    .filter(c => c && c.id)
    .map(c => {
      const intervalDays = Number(c.interval || 0);
      let box = 1;
      if (intervalDays >= 15) box = 5;
      else if (intervalDays >= 7) box = 4;
      else if (intervalDays >= 3) box = 3;
      else if (intervalDays >= 1) box = 2;
      else box = 1;

      return {
        id: String(c.id),
        kind: String(c.kind || ""),
        prompt: String(c.prompt || ""),
        answer: String(c.answer || ""),
        lessonId: String(c.lessonId || ""),
        box,
        dueAt: Number(c.due || Date.now()),
        seen: Number(c.rep || 0),
        correct: 0, // can't infer; leave at 0
      };
    });

  // De-dup by id (prefer latest dueAt if duplicates).
  const byId = Object.create(null);
  for (const m of mapped) {
    const prev = byId[m.id];
    if (!prev || Number(m.dueAt || 0) > Number(prev.dueAt || 0)) byId[m.id] = m;
  }

  const merged = Object.values(byId);
  if (merged.length) writeAll(merged);
}

// Ensure migration happens once on first import.
migrateOnceIfNeeded();

/* ────────────────────────────────────────────────────────────────
   Public API — Leitner model
----------------------------------------------------------------- */
export function seedReview(cards = []) {
  if (!Array.isArray(cards) || cards.length === 0) return;
  const now = Date.now();

  const current = readAllRaw();
  const byId = Object.create(null);
  current.forEach(c => { byId[c.id] = c; });

  for (const c of cards) {
    if (!c || !c.id) continue;
    if (byId[c.id]) {
      // Update surface fields (prompt/answer/lessonId/kind), keep progress
      byId[c.id] = {
        ...byId[c.id],
        kind: c.kind ?? byId[c.id].kind ?? "",
        prompt: c.prompt ?? byId[c.id].prompt ?? "",
        answer: c.answer ?? byId[c.id].answer ?? "",
        lessonId: String(c.lessonId ?? byId[c.id].lessonId ?? ""),
      };
    } else {
      byId[c.id] = {
        id: String(c.id),
        kind: String(c.kind || ""),
        prompt: String(c.prompt || ""),
        answer: String(c.answer || ""),
        lessonId: String(c.lessonId || ""),
        // Leitner progress:
        box: 1,              // 1..5
        dueAt: now,          // next review time (ms)
        seen: 0,             // attempts
        correct: 0,          // self-marked corrects
      };
    }
  }

  writeAll(Object.values(byId));
}

export function getDue(now = Date.now()) {
  return readAllRaw()
    .filter(c => Number(c.dueAt || 0) <= now)
    .sort((a, b) => (a.dueAt || 0) - (b.dueAt || 0));
}

export function scheduleNext(id, rating = 0) {
  const all = readAllRaw();
  const i = all.findIndex(c => c.id === id);
  if (i === -1) return;

  const c = all[i];
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const r = clamp(Number(rating || 0), 0, 3);

  // Leitner rule:
  //   0 (wrong)  -> box = 1
  //   1 (hard)   -> box stays
  //   2 (good)   -> box +1
  //   3 (easy)   -> box +2
  let nextBox = Number(c.box || 1);
  if (r === 0) nextBox = 1;
  if (r === 1) nextBox = nextBox;
  if (r === 2) nextBox = nextBox + 1;
  if (r === 3) nextBox = nextBox + 2;
  nextBox = clamp(nextBox, 1, 5);

  // Intervals for boxes 1..5 (hours). Tune freely.
  const HOURS = { 1: 6, 2: 24, 3: 72, 4: 168, 5: 360 }; // 6h, 1d, 3d, 7d, 15d
  const ms = (HOURS[nextBox] || 24) * 60 * 60 * 1000;

  all[i] = {
    ...c,
    box: nextBox,
    dueAt: Date.now() + ms,
    seen: Number(c.seen || 0) + 1,
    correct: Number(c.correct || 0) + (r > 0 ? 1 : 0),
  };

  writeAll(all);
}

export function getAllCards() {
  return readAllRaw();
}

export function clearReview() {
  try { localStorage.removeItem(NEW_KEY); } catch {}
}

/* ────────────────────────────────────────────────────────────────
   Back-compat shims so existing calls won’t break
   - getDueReviews(limit) returns up to 'limit' due cards (like before)
   - recordOutcome(id, outcome) maps to scheduleNext (0..3)
----------------------------------------------------------------- */
export function getDueReviews(limit = 20) {
  const due = getDue();
  return Number.isFinite(limit) ? due.slice(0, Math.max(0, Number(limit))) : due;
}

export function recordOutcome(id, outcome = 2) {
  // Old code passed 0..3 (again, hard, good, easy). Same as our rating scale.
  scheduleNext(id, outcome);
}
