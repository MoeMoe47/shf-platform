// OutcomeTimelinePanel.jsx — Timeline tab: outcome lifecycle from
// methodology effective date through report finalization. A vertical
// rail-and-dot list, no chart library — same pattern as Funding
// Detail's Timeline tab. Each event shows a date, status, and a
// public-safe authority/source string. DEMO / FRAME DATA (see
// ../../outcomeDetailMockData.js).
import React from "react";
import StatusBadge from "../StatusBadge.jsx";

export default function OutcomeTimelinePanel({ outcome }) {
  return (
    <div className="cse-otc-panel" role="tabpanel" id="cse-otc-tabpanel-timeline" aria-labelledby="cse-otc-tab-timeline">
      <ol className="cse-otc-timeline" aria-label={`Lifecycle events for the ${outcome.name} outcome (demo data)`}>
        {outcome.timeline.map((event) => (
          <li key={event.key} className="cse-otc-timeline__item">
            <span className="cse-otc-timeline__dot" aria-hidden="true" />
            <div className="cse-otc-timeline__content">
              <div className="cse-otc-timeline__head">
                <span className="cse-otc-timeline__date">{event.date}</span>
                <StatusBadge state={event.status} />
              </div>
              <p className="cse-otc-timeline__event">{event.event}</p>
              <p className="cse-otc-timeline__authority">{event.authority}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
