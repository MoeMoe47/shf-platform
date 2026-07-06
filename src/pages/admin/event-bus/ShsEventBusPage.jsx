import React from "react";
import { SHS_EVENT_CHANNELS } from "@/system/event-bus/shsEventBusTypes";
import { createDangerousPayloadPreview } from "@/system/event-bus/shsEventStorage";
import {
  archiveLocalEvent,
  createSampleSafeEvent,
  getEventBusState,
  subscribeLocalLayer,
  unsubscribeLocalLayer,
} from "@/system/event-bus/shsEventBus";
import { summarizeReplayPreview } from "@/system/event-bus/shsEventReplay";
import { calculateEventBusMetrics } from "@/system/event-bus/shsEventMetrics";
import { calculateEventBusReadiness } from "@/system/event-bus/shsEventReadiness";
import EventBusOverviewPanel from "./components/EventBusOverviewPanel";
import EventChannelPanel from "./components/EventChannelPanel";
import EventTimelinePanel from "./components/EventTimelinePanel";
import EventSubscriberPanel from "./components/EventSubscriberPanel";
import EventReplayPanel from "./components/EventReplayPanel";
import EventSafetyPanel from "./components/EventSafetyPanel";
import EventReadinessPanel from "./components/EventReadinessPanel";
import "./shsEventBus.css";

export default function ShsEventBusPage() {
  const initialState = React.useMemo(() => getEventBusState(), []);
  const [events, setEvents] = React.useState(initialState.events);
  const [subscribers, setSubscribers] = React.useState(initialState.subscribers);
  const [channelFilter, setChannelFilter] = React.useState("");
  const [selectedChannel, setSelectedChannel] = React.useState("orchestrator.events");
  const [safetyResult, setSafetyResult] = React.useState(() => createDangerousPayloadPreview());

  const filteredEvents = React.useMemo(() => {
    if (!channelFilter) return events;
    return events.filter((event) => event.channel_id === channelFilter);
  }, [events, channelFilter]);

  const metrics = React.useMemo(() => calculateEventBusMetrics(events, subscribers), [events, subscribers]);
  const replay = React.useMemo(() => summarizeReplayPreview(filteredEvents), [filteredEvents]);
  const readiness = React.useMemo(() => calculateEventBusReadiness({ events, subscribers, safetyResult }), [events, subscribers, safetyResult]);

  function refreshFromState(next = getEventBusState()) {
    setEvents([...next.events]);
    setSubscribers([...next.subscribers]);
  }

  function handleSamplePublish() {
    const result = createSampleSafeEvent();
    setEvents([...result.events]);
  }

  function handleSubscribe() {
    const channel = SHS_EVENT_CHANNELS.find((item) => item.channel_id === selectedChannel) || SHS_EVENT_CHANNELS[0];
    setSubscribers(subscribeLocalLayer({
      subscriber_id: `${channel.event_type}.local.preview`,
      layer: `${channel.owner_layer} Local Preview`,
      channel_id: channel.channel_id,
    }));
  }

  function handleUnsubscribe(subscriberId) {
    setSubscribers(unsubscribeLocalLayer(subscriberId));
  }

  function handleSafetyScan() {
    setSafetyResult(createDangerousPayloadPreview());
  }

  function handleArchive(eventId) {
    setEvents(archiveLocalEvent(eventId));
  }

  return (
    <main className="shs-event-bus-page">
      <section className="event-bus-hero">
        <div>
          <p>SHS BOS Event Bus / Message Fabric V1</p>
          <h1>Event Bus</h1>
          <span>Local-first internal message fabric for structured SHS BOS events, subscribers, route previews, replay previews, and safety guardrails.</span>
        </div>
        <div className="event-bus-actions">
          <button type="button" onClick={handleSamplePublish}>Publish Sample Safe Event</button>
          <button type="button" onClick={() => refreshFromState()}>Refresh Local Fabric</button>
          <button type="button" onClick={handleSafetyScan}>Run Safety Scan</button>
        </div>
      </section>

      <section className="event-bus-toolbar">
        <label>
          Channel filter
          <select value={channelFilter} onChange={(event) => setChannelFilter(event.target.value)}>
            <option value="">All channels</option>
            {SHS_EVENT_CHANNELS.map((channel) => (
              <option key={channel.channel_id} value={channel.channel_id}>{channel.channel_id}</option>
            ))}
          </select>
        </label>
        <label>
          Subscriber channel
          <select value={selectedChannel} onChange={(event) => setSelectedChannel(event.target.value)}>
            {SHS_EVENT_CHANNELS.map((channel) => (
              <option key={channel.channel_id} value={channel.channel_id}>{channel.channel_id}</option>
            ))}
          </select>
        </label>
        <button type="button" onClick={handleSubscribe}>Subscribe Local Layer</button>
      </section>

      <section className="event-bus-grid">
        <EventBusOverviewPanel metrics={metrics} />
        <EventReadinessPanel readiness={readiness} />
        <EventChannelPanel channels={SHS_EVENT_CHANNELS} metrics={metrics} onSelectChannel={setChannelFilter} />
        <EventTimelinePanel events={filteredEvents} onArchiveEvent={handleArchive} />
        <EventSubscriberPanel subscribers={subscribers} onUnsubscribe={handleUnsubscribe} />
        <EventReplayPanel replay={replay} />
        <EventSafetyPanel safetyResult={safetyResult} />
      </section>
    </main>
  );
}

