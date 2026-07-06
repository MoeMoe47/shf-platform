import { getEventBusEvents } from "./shsEventStorage";

export function createEventReplayPreview(events = getEventBusEvents(), limit = 8) {
  return events.slice(0, limit).map((event, index) => ({
    replay_step: index + 1,
    event_id: event.event_id,
    event_name: event.event_name,
    channel_id: event.channel_id,
    source_layer: event.source_layer,
    routed_to: event.route?.routed_to || [],
    safety_status: event.safety_status,
    timestamp: event.timestamp,
    preview_only: true,
  }));
}

export function summarizeReplayPreview(events = getEventBusEvents()) {
  const preview = createEventReplayPreview(events);
  return {
    preview_count: preview.length,
    blocked_count: preview.filter((item) => item.safety_status === "blocked").length,
    allowed_count: preview.filter((item) => item.safety_status === "allowed").length,
    replay_mode: "preview_only",
    production_mutation: false,
    preview,
  };
}

