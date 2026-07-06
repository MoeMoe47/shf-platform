import { SHS_EVENT_CHANNELS } from "./shsEventBusTypes";

export function calculateEventBusMetrics(events = [], subscribers = []) {
  const blocked = events.filter((event) => event.safety_status === "blocked").length;
  const byChannel = SHS_EVENT_CHANNELS.map((channel) => ({
    channel_id: channel.channel_id,
    event_count: events.filter((event) => event.channel_id === channel.channel_id).length,
    subscriber_count: subscribers.filter((subscriber) => subscriber.active && subscriber.channel_id === channel.channel_id).length,
  }));
  return {
    channel_count: SHS_EVENT_CHANNELS.length,
    event_count: events.length,
    subscriber_count: subscribers.filter((subscriber) => subscriber.active).length,
    blocked_event_count: blocked,
    allowed_event_count: events.filter((event) => event.safety_status === "allowed").length,
    needs_review_count: events.filter((event) => event.safety_status === "needs_review").length,
    by_channel: byChannel,
  };
}

