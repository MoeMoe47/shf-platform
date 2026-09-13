export const EXPERIENCE_STATUS = Object.freeze({ OFFERED: "OFFERED", STARTED: "STARTED", PAUSED: "PAUSED", SKIPPED: "SKIPPED", DISMISSED: "DISMISSED", COMPLETED: "COMPLETED" });

const TERMINAL = new Set([EXPERIENCE_STATUS.SKIPPED, EXPERIENCE_STATUS.DISMISSED, EXPERIENCE_STATUS.COMPLETED]);

export function experienceStorageKey(scope) {
  return ["ogl", "experience", scope?.userId || "anonymous", scope?.organizationId || "unknown-org", scope?.orientationId, scope?.orientationVersion, scope?.tourId || "orientation", scope?.tourVersion || 1].join(":");
}

export function createExperienceState(input = {}) {
  return { status: EXPERIENCE_STATUS.OFFERED, currentStepId: null, lastRoute: null, lastDestinationId: null, replayCount: 0, whatsChangedSeen: false, ...input };
}

export function transitionExperienceState(current, action, patch = {}) {
  const state = createExperienceState(current);
  if (state.status === EXPERIENCE_STATUS.COMPLETED && action !== "RESTART" && action !== "WHATS_CHANGED_SEEN") return state;
  const nextStatus = { OFFER: "OFFERED", START: "STARTED", PROGRESS: "STARTED", PAUSE: "PAUSED", RESUME: "STARTED", SKIP: "SKIPPED", DISMISS: "DISMISSED", COMPLETE: "COMPLETED", RESTART: "STARTED" }[action];
  if (!nextStatus && action !== "WHATS_CHANGED_SEEN") throw new Error("EXPERIENCE_ACTION_INVALID");
  return createExperienceState({ ...state, ...patch, status: nextStatus || state.status, replayCount: state.replayCount + (action === "RESTART" ? 1 : 0), whatsChangedSeen: action === "WHATS_CHANGED_SEEN" ? true : state.whatsChangedSeen });
}

export function isTerminalExperienceState(state) { return TERMINAL.has(state?.status); }
export function isStaleExperienceState(state, orientationVersion, tourVersion) { return Number(state?.orientationVersion) !== Number(orientationVersion) || Number(state?.tourVersion || 1) !== Number(tourVersion || 1); }

export function readExperienceState(scope) {
  if (typeof window === "undefined") return null;
  try { const raw = window.localStorage.getItem(experienceStorageKey(scope)); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export function writeExperienceState(scope, state) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(experienceStorageKey(scope), JSON.stringify(state)); } catch { /* storage is an optional UX enhancement */ }
}
