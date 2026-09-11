// EvidenceTimelinePanel.jsx — Timeline tab: evidence lifecycle from
// requirement opened through status assignment. A vertical rail-and-
// dot list, no chart library — same pattern as Outcome Detail's
// OutcomeTimelinePanel.jsx. Each event shows a date, status, and a
// public-safe authority/source string. DEMO / FRAME DATA (see
// ../../evidenceSummaryMockData.js).
import React from "react";
import StatusBadge from "../StatusBadge.jsx";

export default function EvidenceTimelinePanel({ evidence }) {
  return (
    <div className="cse-evs-panel" role="tabpanel" id="cse-evs-tabpanel-timeline" aria-labelledby="cse-evs-tab-timeline">
      <ol className="cse-evs-timeline" aria-label={`Lifecycle events for ${evidence.name} (demo data)`}>
        {evidence.timeline.map((event) => (
          <li key={event.key} className="cse-evs-timeline__item">
            <span className="cse-evs-timeline__dot" aria-hidden="true" />
            <div className="cse-evs-timeline__content">
              <div className="cse-evs-timeline__head">
                <span className="cse-evs-timeline__date">{event.date}</span>
                <StatusBadge state={event.status} />
              </div>
              <p className="cse-evs-timeline__event">{event.event}</p>
              <p className="cse-evs-timeline__authority">{event.authority}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
