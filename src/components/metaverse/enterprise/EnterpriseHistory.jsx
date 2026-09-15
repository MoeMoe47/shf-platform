import React from "react";

const EVENT_LABEL = {
  FORMED: "Formed",
  SUBMITTED_FOR_APPROVAL: "Submitted for approval",
  APPROVED: "Approved",
  RETURNED: "Returned for revision",
  PAUSED: "Paused",
  RESUMED: "Resumed",
  SUSPENDED: "Suspended",
  CLOSED: "Closed",
  ARCHIVED: "Archived",
  CATALOG_ITEM_ADDED: "Catalog item added",
  MARKET_LISTING_PUBLISHED: "Market listing published",
  OPPORTUNITY_BID_SUBMITTED: "Opportunity bid submitted",
  OPPORTUNITY_AWARDED: "Opportunity awarded",
  PROJECT_STARTED: "Project started",
  PROJECT_SUBMITTED: "Project submitted",
  PROJECT_ACCEPTED: "Project accepted",
  ORDER_FULFILLED: "Order fulfilled",
  SHOWCASE_COMPLETED: "Showcase completed",
};

// MET-12 — history is a plain source-backed timeline. No score, ranking,
// or leaderboard is computed from it (build brief §Phase L).
export default function EnterpriseHistory({ entries }) {
  return (
    <section className="met-enterprise__history" aria-label="Enterprise history">
      <h3>History</h3>
      {(entries || []).length === 0 ? <p>No history yet.</p> : null}
      <ol>
        {(entries || []).map((entry) => (
          <li key={entry.historyId}>
            <strong>{EVENT_LABEL[entry.eventType] || entry.eventType}</strong>
            <span className="met-enterprise__meta"> · {entry.occurredAt}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
