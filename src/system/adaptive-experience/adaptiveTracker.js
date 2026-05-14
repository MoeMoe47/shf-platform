import {
  ADAPTIVE_PRIVACY_BLOCKED_KEYS,
  ADAPTIVE_ROLES,
} from "./adaptiveEvent.types";

const STORAGE_KEY = "shs_adaptive_experience_events_v1";
const SESSION_KEY = "shs_adaptive_session_id";
const MAX_LOCAL_EVENTS = 250;

function safeWindow() {
  return typeof window !== "undefined" ? window : null;
}

function safeNow() {
  return new Date().toISOString();
}

function getSessionId() {
  const win = safeWindow();

  if (!win) return "server_session_unavailable";

  try {
    let sessionId = win.sessionStorage.getItem(SESSION_KEY);

    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      win.sessionStorage.setItem(SESSION_KEY, sessionId);
    }

    return sessionId;
  } catch {
    return "session_unavailable";
  }
}

function sanitizePayload(payload = {}) {
  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => {
      return !ADAPTIVE_PRIVACY_BLOCKED_KEYS.includes(String(key).toLowerCase());
    })
  );
}

function readLocalEvents() {
  const win = safeWindow();

  if (!win) return [];

  try {
    const raw = win.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalEvents(events) {
  const win = safeWindow();

  if (!win) return;

  try {
    const trimmed = events.slice(-MAX_LOCAL_EVENTS);
    win.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Local storage is optional. Never break a dashboard because tracking failed.
  }
}

export function buildAdaptiveEvent({
  eventType,
  surface,
  target,
  role = ADAPTIVE_ROLES.UNKNOWN,
  dashboardVersion = "v1",
  userId = "demo-user",
  organizationId = "demo-org",
  metadata = {},
}) {
  return {
    id: `adaptive_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    timestamp: safeNow(),
    sessionId: getSessionId(),
    eventType,
    surface,
    target,
    role,
    dashboardVersion,
    userId,
    organizationId,
    metadata: sanitizePayload(metadata),
  };
}

export function trackAdaptiveEvent(input) {
  const event = buildAdaptiveEvent(input);
  const existing = readLocalEvents();

  writeLocalEvents([...existing, event]);

  const win = safeWindow();

  if (win) {
    win.dispatchEvent(
      new CustomEvent("shs:adaptive-experience-event", {
        detail: event,
      })
    );
  }

  return event;
}

export function getAdaptiveEvents() {
  return readLocalEvents();
}

export function clearAdaptiveEvents() {
  const win = safeWindow();

  if (!win) return;

  try {
    win.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}

export function summarizeAdaptiveEvents(events = readLocalEvents()) {
  const summary = {
    totalEvents: events.length,
    bySurface: {},
    byEventType: {},
    byTarget: {},
    latestEvent: events[events.length - 1] || null,
  };

  events.forEach((event) => {
    summary.bySurface[event.surface] = (summary.bySurface[event.surface] || 0) + 1;
    summary.byEventType[event.eventType] =
      (summary.byEventType[event.eventType] || 0) + 1;
    summary.byTarget[event.target] = (summary.byTarget[event.target] || 0) + 1;
  });

  return summary;
}
