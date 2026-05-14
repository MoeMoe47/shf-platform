export const HUB_EVENT_KEYS = {
  growth: "shs_hub_growth_network_events_v1",
  intelligence: "shs_hub_intelligence_feedback_v1",
  bundles: "shs_hub_bundle_recommendations_v1",
  opportunities: "shs_hub_opportunity_events_v1",
  sales: "shs_hub_sales_pipeline_events_v1",
};

export function safeReadJson(key, fallback = []) {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function safeWriteJson(key, value) {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function readHubEvents(lane) {
  const key = HUB_EVENT_KEYS[lane];
  if (!key) return [];
  return safeReadJson(key, []);
}

export function writeHubEvents(lane, events) {
  const key = HUB_EVENT_KEYS[lane];
  if (!key) return false;
  return safeWriteJson(key, events);
}

export function createHubEvent(type, payload = {}) {
  return {
    id: `hub_event_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    createdAt: new Date().toISOString(),
    ...payload,
  };
}

export function addHubEvent(lane, type, payload = {}, limit = 75) {
  const current = readHubEvents(lane);
  const event = createHubEvent(type, payload);
  const next = [event, ...current].slice(0, limit);

  writeHubEvents(lane, next);

  return {
    event,
    events: next,
  };
}

export function clearHubEvents(lane) {
  const key = HUB_EVENT_KEYS[lane];
  if (!key || typeof window === "undefined") return false;

  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function readAllHubEvents() {
  return Object.fromEntries(
    Object.keys(HUB_EVENT_KEYS).map((lane) => [lane, readHubEvents(lane)])
  );
}

export function getHubEventCount(lane) {
  return readHubEvents(lane).length;
}
