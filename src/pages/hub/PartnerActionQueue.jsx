import React from "react";
import usePartnerQueue from "../../lib/hub/usePartnerQueue";
import "./hub.css";

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function PartnerActionQueue() {
  const { items, loading, error } = usePartnerQueue();

  return (
    <div className="hub-page-shell">
      <div className="hub-page-header">
        <div>
          <div className="hub-eyebrow">SHS Hub Collaboration Layer</div>
          <h1 className="hub-page-title">Partner Action Queue</h1>
          <p className="hub-page-subtitle">
            Live referral queue powered by the SHS API.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="hub-state-card">Loading partner queue…</div>
      ) : error ? (
        <div className="hub-state-card hub-state-card--error">
          Failed to load partner queue: {error}
        </div>
      ) : items.length === 0 ? (
        <div className="hub-state-card">No referrals found.</div>
      ) : (
        <div className="hub-queue-grid">
          {items.map((item) => (
            <div className="hub-queue-card" key={item.case_id}>
              <div className="hub-queue-card__top">
                <div>
                  <div className="hub-queue-card__label">Referral ID</div>
                  <div className="hub-queue-card__value">{item.case_id}</div>
                </div>
                <div className="hub-pill">{item.status}</div>
              </div>

              <div className="hub-queue-card__meta">
                <div>
                  <span className="hub-queue-card__meta-label">Sender:</span>{" "}
                  {item.sendingOrganization || item.organization_id}
                </div>
                <div>
                  <span className="hub-queue-card__meta-label">Priority:</span>{" "}
                  {item.priority || "—"}
                </div>
                <div>
                  <span className="hub-queue-card__meta-label">Created:</span>{" "}
                  {formatDate(item.created_at)}
                </div>
                <div>
                  <span className="hub-queue-card__meta-label">Assigned User:</span>{" "}
                  {item.assigned_user_id || "Unassigned"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
