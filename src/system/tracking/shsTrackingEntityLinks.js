export function createTrackingEntityLinks(events = []) {
  const links = [];
  events.forEach((event) => {
    [
      ["client", event.client_id],
      ["project", event.project_id],
      ["report", event.report_id],
      ["agent", event.agent_id],
      ["workflow", event.workflow_id],
      [event.entity_type || "unknown", event.entity_id],
    ].forEach(([entity_type, entity_id]) => {
      if (!entity_id) return;
      links.push({
        link_id: `${event.tracking_event_id}:${entity_type}:${entity_id}`,
        tracking_event_id: event.tracking_event_id,
        entity_type,
        entity_id,
        visibility: event.visibility || "internal_only",
        safety_status: event.safety_status || "allowed",
      });
    });
  });
  return links;
}

export function filterTrackingEvents(events = [], filters = {}) {
  return events.filter((event) => {
    if (filters.stream_id && event.metadata?.stream_id !== filters.stream_id) return false;
    if (filters.client_id && event.client_id !== filters.client_id) return false;
    if (filters.project_id && event.project_id !== filters.project_id) return false;
    if (filters.report_id && event.report_id !== filters.report_id) return false;
    if (filters.agent_id && event.agent_id !== filters.agent_id) return false;
    return true;
  });
}

export function summarizeEntityLinks(events = []) {
  const links = createTrackingEntityLinks(events);
  return {
    link_count: links.length,
    client_count: new Set(links.filter((link) => link.entity_type === "client").map((link) => link.entity_id)).size,
    project_count: new Set(links.filter((link) => link.entity_type === "project").map((link) => link.entity_id)).size,
    report_count: new Set(links.filter((link) => link.entity_type === "report").map((link) => link.entity_id)).size,
    agent_count: new Set(links.filter((link) => link.entity_type === "agent").map((link) => link.entity_id)).size,
    links,
  };
}

