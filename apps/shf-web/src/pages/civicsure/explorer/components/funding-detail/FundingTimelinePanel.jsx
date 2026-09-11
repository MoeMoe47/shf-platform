// FundingTimelinePanel.jsx — Timeline tab: the funding lifecycle from
// authorization through current status. DEMO / FRAME DATA (see
// ../../fundingDetailMockData.js). A vertical rail-and-dot list — no
// chart library.
import React from "react";
import StatusBadge from "../StatusBadge.jsx";

export default function FundingTimelinePanel({ funding }) {
  return (
    <div className="cse-fnd-panel" role="tabpanel" id="cse-fnd-tabpanel-timeline" aria-labelledby="cse-fnd-tab-timeline">
      <ol className="cse-fnd-timeline">
        {funding.timeline.map((event) => (
          <li key={event.key} className="cse-fnd-timeline__item">
            <span className="cse-fnd-timeline__dot" aria-hidden="true" />
            <div className="cse-card cse-fnd-timeline__card">
              <div className="cse-fnd-timeline__head">
                <span className="cse-fnd-timeline__date">{event.date}</span>
                <StatusBadge state={event.status} />
              </div>
              <h3 className="cse-fnd-timeline__event">{event.event}</h3>
              <p className="cse-fnd-timeline__meta">
                {event.actor} | {event.related}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
