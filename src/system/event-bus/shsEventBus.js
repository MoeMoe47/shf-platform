import { SHS_EVENT_CHANNELS } from "./shsEventBusTypes";
import {
  archiveLocalEvent,
  createSampleSafeEvent,
  getEventBusEvents,
  getEventBusSubscribers,
  loadSeedEventBusEvents,
  publishLocalEvent,
  subscribeLocalLayer,
  unsubscribeLocalLayer,
} from "./shsEventStorage";
import { listEventRoutes } from "./shsEventRouter";
import { summarizeReplayPreview } from "./shsEventReplay";
import { calculateEventBusMetrics } from "./shsEventMetrics";
import { calculateEventBusReadiness } from "./shsEventReadiness";

export function getEventBusState() {
  const events = loadSeedEventBusEvents();
  const subscribers = getEventBusSubscribers();
  const metrics = calculateEventBusMetrics(events, subscribers);
  return {
    channels: SHS_EVENT_CHANNELS,
    events,
    subscribers,
    routes: listEventRoutes(subscribers),
    replay: summarizeReplayPreview(events),
    metrics,
    readiness: calculateEventBusReadiness({ events, subscribers }),
  };
}

export {
  archiveLocalEvent,
  createSampleSafeEvent,
  getEventBusEvents,
  getEventBusSubscribers,
  publishLocalEvent,
  subscribeLocalLayer,
  unsubscribeLocalLayer,
};

