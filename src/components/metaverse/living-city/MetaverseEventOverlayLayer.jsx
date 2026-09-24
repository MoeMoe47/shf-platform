import React from "react";

export default function MetaverseEventOverlayLayer({ events = [], zones = [] }) {
  const activeEvents = events.filter((event) => event?.status && !/closed|inactive|expired/i.test(event.status));
  if (!activeEvents.length) return null;
  return (
    <div className="met-living-layer met-living-layer--events" aria-label="Source-backed city event markers">
      {activeEvents.slice(0, 5).map((event, index) => {
        const zone = zones.find((item) => item.districtId === event.district_id) || zones[index % Math.max(zones.length, 1)];
        if (!zone) return null;
        return (
          <span
            key={event.event_id}
            className="met-living-event"
            style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
            data-state-classification="SOURCE_BACKED"
            aria-label={`${event.title}. ${event.source} source. ${event.status}.`}
          >
            <span aria-hidden="true" />
          </span>
        );
      })}
    </div>
  );
}
