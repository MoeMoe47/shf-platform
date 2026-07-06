import { SHS_EVENT_CHANNELS } from "./shsEventBusTypes";

export const SHS_EVENT_DEFAULT_SUBSCRIBERS = Object.freeze([
  { subscriber_id: "orchestrator.local", layer: "SHS System Orchestrator", channel_id: "orchestrator.events", active: true },
  { subscriber_id: "tracking.local", layer: "SHS Tracking Intelligence", channel_id: "tracking.events", active: true },
  { subscriber_id: "persistence.local", layer: "SHS Durable Persistence", channel_id: "persistence.events", active: true },
  { subscriber_id: "registry.local", layer: "SHS System Registry", channel_id: "registry.events", active: true },
  { subscriber_id: "governance.local", layer: "Governance", channel_id: "governance.events", active: true },
  { subscriber_id: "system.local", layer: "SHS BOS System", channel_id: "system.events", active: true },
]);

export function createSubscriber(input = {}) {
  const channel = SHS_EVENT_CHANNELS.find((item) => item.channel_id === input.channel_id) || SHS_EVENT_CHANNELS[9];
  return {
    subscriber_id: input.subscriber_id || `${channel.event_type}.local.${Date.now()}`,
    layer: input.layer || channel.owner_layer,
    channel_id: channel.channel_id,
    active: input.active !== false,
    local_only: true,
    delivery_mode: "in_memory_preview",
  };
}

export function listSubscribersForChannel(subscribers = [], channelId = "") {
  return subscribers.filter((subscriber) => subscriber.active && subscriber.channel_id === channelId);
}

