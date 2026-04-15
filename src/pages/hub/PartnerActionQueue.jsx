import React from "react";
import usePartnerQueue from "../../lib/hub/usePartnerQueue";
import "@/styles/admin.appRegistry.css";

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function statusPillClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "open" || s === "assigned" || s === "in_review") return "rg-pill rg-pillGood";
  if (s === "on_hold") return "rg-pill rg-pillOk";
  return "rg-pill";
}

export default function PartnerActionQueue() {
  const { items, loading, error } = usePartnerQueue();

  return (
    <div className="ar-wrap">
      <header className="ar-head">
        <div>
          <div className="ar-kicker">SHS Hub Collaboration Layer</div>
          <h1 className="ar-title">Partner Action Queue</h1>
          <div className="ar-sub">
            Live referral queue powered by the SHS API.
          </div>
        </div>
      </header>

      {loading ? (
        <div className="rg-error" style={{ maxWidth: 1200 }}>
          Loading partner queue…
        </div>
      ) : error ? (
        <div className="rg-error" style={{ maxWidth: 1200 }}>
          Failed to load partner queue: {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rg-error" style={{ maxWidth: 1200 }}>
          No referrals found.
        </div>
      ) : (
        <div className="ar-grid">
          {items.map((item) => (
            <div className="ar-card" key={item.case_id}>
              <div className="ar-top">
                <div className="ar-nameRow">
                  <div className="ar-name">Referral</div>
                  <span className={statusPillClass(item.status)}>
                    {String(item.status || "unknown").toUpperCase()}
                  </span>
                </div>

                <div className="ar-meta">
                  <span className="ar-mono">{item.case_id}</span>
                </div>
              </div>

              <div className="ar-body">
                <div className="ar-row">
                  <div className="ar-label">Sender</div>
                  <div className="ar-value">
                    {item.sendingOrganization || item.organization_id || "—"}
                  </div>
                </div>

                <div className="ar-row">
                  <div className="ar-label">Priority</div>
                  <div className="ar-value">{item.priority || "—"}</div>
                </div>

                <div className="ar-row">
                  <div className="ar-label">Created</div>
                  <div className="ar-value">{formatDate(item.created_at)}</div>
                </div>

                <div className="ar-row">
                  <div className="ar-label">Assigned</div>
                  <div className="ar-value">
                    {item.assigned_user_id || "Unassigned"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
