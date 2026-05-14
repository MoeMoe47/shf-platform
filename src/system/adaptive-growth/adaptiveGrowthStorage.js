import { ADAPTIVE_GROWTH_KEYS } from "./growthSignalTypes.js";

export function readStorage(key, fallback = []) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage may be unavailable in some environments
  }
}

export function appendStorageEvent(key, event, limit = 200) {
  const previous = readStorage(key, []);
  const next = [event, ...previous].slice(0, limit);
  writeStorage(key, next);
  return next;
}

export function createAdaptiveGrowthEvent(eventType, payload = {}) {
  return {
    id: `ago_evt_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    surface: "adaptive_growth_optimization_layer",
    eventType,
    signalId: payload.signalId || null,
    source: payload.source || "hub",
    sourcePartnerName: payload.sourcePartnerName || null,
    recommendedLanes: payload.recommendedLanes || [],
    selectedLane: payload.selectedLane || null,
    metadata: payload.metadata || {},
    timestamp: new Date().toISOString(),
  };
}

export function saveSignalScores(scores) {
  writeStorage(ADAPTIVE_GROWTH_KEYS.signalScores, scores);
}

export function readFeedbackEvents() {
  return readStorage(ADAPTIVE_GROWTH_KEYS.feedbackEvents, []);
}

export function appendFeedbackEvent(eventType, payload = {}) {
  const event = createAdaptiveGrowthEvent(eventType, payload);
  appendStorageEvent(ADAPTIVE_GROWTH_KEYS.feedbackEvents, event);
  appendStorageEvent(ADAPTIVE_GROWTH_KEYS.adaptiveEvents, {
    ...event,
    surface: "partner_growth_engine",
  });
  return event;
}
