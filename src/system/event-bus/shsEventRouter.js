import { SHS_EVENT_CHANNELS } from "./shsEventBusTypes";
import { getEventChannelByType } from "./shsEventSchemas";
import { listSubscribersForChannel } from "./shsEventSubscribers";

export function routeEvent(event = {}, subscribers = []) {
  const channel = getEventChannelByType(event.event_type);
  const matchedSubscribers = listSubscribersForChannel(subscribers, channel.channel_id);
  return {
    event_id: event.event_id,
    route_id: `route_${event.event_id}`,
    channel_id: channel.channel_id,
    routed_to: matchedSubscribers.map((subscriber) => subscriber.layer),
    subscriber_count: matchedSubscribers.length,
    local_only: true,
    network_delivery: false,
    external_broker: false,
    delivery_status: event.safety_status === "blocked" ? "blocked" : "preview_ready",
  };
}

export function listEventRoutes(subscribers = []) {
  return SHS_EVENT_CHANNELS.map((channel) => ({
    channel_id: channel.channel_id,
    event_type: channel.event_type,
    owner_layer: channel.owner_layer,
    subscribers: listSubscribersForChannel(subscribers, channel.channel_id).map((subscriber) => subscriber.layer),
  }));
}

