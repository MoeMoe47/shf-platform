import { emitDopamine, onDopamine } from "./bus";

const KEY = "shf.growth_observatory.dopamine.v1";

function now() { return Date.now(); }

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
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
}

function makeDefault() {
  return {
    version: 1,
    tower: { score: 0, level: 1, streak: 0, updatedAt: now() },
    agents: {
      // agentId: { score, streak, rank, wins, losses, updatedAt }
    },
  };
}

/**
 * Rank rule:
 * - Simple and stable: rank is derived from score buckets.
 * - You can replace with ELO later without breaking the UI.
 */
function scoreToRank(score) {
  if (score >= 2500) return "S";
  if (score >= 1600) return "A";
  if (score >= 900)  return "B";
  if (score >= 400)  return "C";
  return "D";
}

function scoreToLevel(score) {
  // smooth-ish leveling: +1 level each 500 points
  return Math.max(1, Math.floor(score / 500) + 1);
}

let state = load() || makeDefault();

export function getDopamineState() {
  return state;
}

/**
 * Apply an event to the store.
 * Game theory-friendly: events can be emitted by agents or system.
 */
export function applyDopamineEvent(evt) {
  const e = { ts: now(), points: 0, intensity: 0.4, ...evt };

  // Tower always updates
  const tower = state.tower;
  tower.score = Math.max(0, (tower.score || 0) + (e.points || 0));
  tower.level = scoreToLevel(tower.score);
  tower.streak = Math.max(0, (tower.streak || 0) + (e.points ? (e.points > 0 ? 1 : -1) : 0));
  tower.updatedAt = e.ts;

  // Optional agent update
  if (e.agentId) {
    const a = state.agents[e.agentId] || {
      score: 0, streak: 0, rank: "D", wins: 0, losses: 0, updatedAt: e.ts
    };

    a.score = Math.max(0, a.score + (e.points || 0));
    a.rank = scoreToRank(a.score);

    if (e.type === "WIN") { a.wins += 1; a.streak += 1; }
    if (e.type === "LOSS") { a.losses += 1; a.streak = Math.max(0, a.streak - 1); }
    if (e.type === "STREAK") { a.streak = Math.max(0, a.streak + 1); }

    // Generic scoring affects streak slightly too (optional)
    if (e.type === "ATTESTED" || e.type === "SIGNAL") {
      if ((e.points || 0) > 0) a.streak += 1;
    }

    a.updatedAt = e.ts;
    state.agents[e.agentId] = a;
  }

  save(state);
  emitDopamine({ ...e, meta: { ...(e.meta || {}), derived: { towerLevel: tower.level } } });
}

export function resetDopamine() {
  state = makeDefault();
  save(state);
  emitDopamine({ type: "RESET", ts: now(), intensity: 0.2 });
}

/**
 * Optional helper: subscribe to dopamine bus AND get latest store snapshot.
 */
export function subscribeDopamine(fn) {
  return onDopamine((evt) => fn(evt, getDopamineState()));
}
