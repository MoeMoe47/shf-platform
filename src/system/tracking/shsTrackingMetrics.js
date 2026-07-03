import { SHS_TRACKING_STREAMS_V1 } from "./shsTrackingStreams";
import { summarizeEntityLinks } from "./shsTrackingEntityLinks";
import { generateTrackingSignals, summarizeTrackingSignals } from "./shsTrackingSignals";

function countBy(events, getter) {
  return events.reduce((acc, event) => {
    const key = getter(event) || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

export function calculateTrackingMetrics(events = [], reviewedSignals = []) {
  // tracking readiness score is calculated in shsTrackingReadiness.js.
  const activeEvents = events.filter((event) => !event.archived);
  const signals = generateTrackingSignals(activeEvents, reviewedSignals);
  const signalSummary = summarizeTrackingSignals(signals);
  const entitySummary = summarizeEntityLinks(activeEvents);

  return {
    event_count: activeEvents.length,
    event_count_by_stream: countBy(activeEvents, (event) => event.metadata?.stream_id),
    event_count_by_client: countBy(activeEvents, (event) => event.client_id),
    event_count_by_project: countBy(activeEvents, (event) => event.project_id),
    open_blockers: activeEvents.filter((event) => event.metadata?.blocker || event.risk_level === "critical").length,
    report_usage_count: activeEvents.filter((event) => event.event_type === "report").length,
    proof_readiness_count: activeEvents.filter((event) => event.event_type === "direct_connect" && event.metadata?.proof_ready !== false).length,
    agent_activity_count: activeEvents.filter((event) => event.event_type === "agent").length,
    qa_readiness_count: activeEvents.filter((event) => event.event_type === "qa").length,
    upgrade_signal_count: signalSummary.upgrade_opportunity_count,
    renewal_risk_count: signalSummary.renewal_risk_count,
    governance_attention_count: signalSummary.governance_attention_count,
    stream_count: SHS_TRACKING_STREAMS_V1.length,
    entity_link_count: entitySummary.link_count,
    signal_count: signals.length,
  };
}
