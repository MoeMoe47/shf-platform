export function createTrackingTimeline(events = []) {
  return [...events]
    .filter((event) => !event.archived)
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
    .map((event) => ({
      timeline_id: `timeline_${event.tracking_event_id}`,
      tracking_event_id: event.tracking_event_id,
      timestamp: event.timestamp,
      label: event.event_name,
      source: event.event_source,
      action: event.event_action,
      stream_id: event.metadata?.stream_id || "unknown",
      entity: {
        entity_type: event.entity_type,
        entity_id: event.entity_id,
        client_id: event.client_id,
        project_id: event.project_id,
        report_id: event.report_id,
        agent_id: event.agent_id,
      },
      risk_level: event.risk_level,
      safety_status: event.safety_status,
      visibility: event.visibility,
    }));
}

export function groupTimelineByStream(events = []) {
  return createTrackingTimeline(events).reduce((acc, item) => {
    const key = item.stream_id;
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});
}

