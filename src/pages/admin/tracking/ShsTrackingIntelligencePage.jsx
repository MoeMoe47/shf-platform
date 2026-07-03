import React from "react";
import { SHS_TRACKING_STREAMS_V1 } from "@/system/tracking/shsTrackingStreams";
import {
  archiveTrackingEvent,
  createLocalSampleTrackingEvent,
  getReviewedTrackingSignals,
  getTrackingEvents,
  markTrackingSignalReviewed,
  resetTrackingEvents,
} from "@/system/tracking/shsTrackingStorage";
import { calculateTrackingMetrics } from "@/system/tracking/shsTrackingMetrics";
import { generateTrackingSignals } from "@/system/tracking/shsTrackingSignals";
import { createTrackingTimeline } from "@/system/tracking/shsTrackingTimeline";
import { createTrackingEntityLinks, filterTrackingEvents } from "@/system/tracking/shsTrackingEntityLinks";
import { calculateTrackingReadiness } from "@/system/tracking/shsTrackingReadiness";
import { scanTrackingEventSafety } from "@/system/tracking/shsTrackingSafety";
import TrackingOverviewPanel from "./components/TrackingOverviewPanel";
import TrackingStreamPanel from "./components/TrackingStreamPanel";
import TrackingEventTimeline from "./components/TrackingEventTimeline";
import TrackingSignalPanel from "./components/TrackingSignalPanel";
import TrackingEntityLinkPanel from "./components/TrackingEntityLinkPanel";
import TrackingReadinessPanel from "./components/TrackingReadinessPanel";
import TrackingSafetyPanel from "./components/TrackingSafetyPanel";
import TrackingReportUsePanel from "./components/TrackingReportUsePanel";
import "./shsTrackingIntelligence.css";

export default function ShsTrackingIntelligencePage() {
  const [events, setEvents] = React.useState(() => getTrackingEvents());
  const [reviewedSignals, setReviewedSignals] = React.useState(() => getReviewedTrackingSignals());
  const [streamFilter, setStreamFilter] = React.useState("");
  const [entityFilter, setEntityFilter] = React.useState("");
  const [safetyResult, setSafetyResult] = React.useState(() => scanTrackingEventSafety({ metadata: {} }));

  const filteredEvents = React.useMemo(() => {
    const streamEvents = filterTrackingEvents(events, { stream_id: streamFilter });
    if (!entityFilter) return streamEvents;
    return streamEvents.filter((event) => [
      event.client_id,
      event.project_id,
      event.report_id,
      event.agent_id,
      event.workflow_id,
      event.entity_id,
    ].includes(entityFilter));
  }, [events, streamFilter, entityFilter]);
  const timeline = React.useMemo(() => createTrackingTimeline(filteredEvents), [filteredEvents]);
  const entityLinks = React.useMemo(() => createTrackingEntityLinks(filteredEvents), [filteredEvents]);
  const signals = React.useMemo(() => generateTrackingSignals(filteredEvents, reviewedSignals), [filteredEvents, reviewedSignals]);
  const metrics = React.useMemo(() => calculateTrackingMetrics(events, reviewedSignals), [events, reviewedSignals]);
  const readiness = React.useMemo(() => calculateTrackingReadiness({
    streams: SHS_TRACKING_STREAMS_V1,
    events,
    entityLinks,
    timeline,
    signals,
  }), [events, entityLinks, timeline, signals]);

  function refresh(nextEvents = getTrackingEvents()) {
    setEvents([...nextEvents]);
    setReviewedSignals(getReviewedTrackingSignals());
  }

  function handleCreateSampleEvent() {
    const result = createLocalSampleTrackingEvent();
    refresh(result.events);
  }

  function handleArchiveEvent(eventId) {
    refresh(archiveTrackingEvent(eventId));
  }

  function handleSignalReviewed(signalId) {
    setReviewedSignals(markTrackingSignalReviewed(signalId));
  }

  function handleSafetyScan() {
    setSafetyResult(scanTrackingEventSafety({
      event_name: "tracking_safety_scan",
      visibility: "internal_only",
      metadata: { sample: true },
    }));
  }

  function handleReset() {
    refresh(resetTrackingEvents());
    setStreamFilter("");
    setEntityFilter("");
  }

  return (
    <main className="shs-tracking-page">
      <section className="tracking-hero">
        <div>
          <p>SHS Tracking Intelligence Layer V1</p>
          <h1>Tracking Intelligence</h1>
          <span>Internal-only event spine for SHS operations, reports, agents, orchestrator, persistence, proof, revenue, ROI, and governance signals.</span>
        </div>
        <div className="tracking-hero-actions">
          <button type="button" onClick={handleCreateSampleEvent}>Create Sample Internal Event</button>
          <button type="button" onClick={handleReset}>Load Sample Events</button>
        </div>
      </section>

      <section className="tracking-grid">
        <TrackingOverviewPanel metrics={metrics} readiness={readiness} />
        <TrackingSafetyPanel safetyResult={safetyResult} onSafetyScan={handleSafetyScan} />
        <TrackingStreamPanel
          streams={SHS_TRACKING_STREAMS_V1}
          selectedStreamId={streamFilter}
          onSelectStream={setStreamFilter}
        />
        <TrackingEventTimeline events={timeline} onArchiveEvent={handleArchiveEvent} />
        <TrackingSignalPanel signals={signals} onSignalReviewed={handleSignalReviewed} />
        <TrackingEntityLinkPanel links={entityLinks} entityFilter={entityFilter} onEntityFilter={setEntityFilter} />
        <TrackingReadinessPanel readiness={readiness} />
        <TrackingReportUsePanel streams={SHS_TRACKING_STREAMS_V1} signals={signals} metrics={metrics} />
      </section>
    </main>
  );
}
