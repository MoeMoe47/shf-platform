import React, { useMemo } from "react";
import HubAdminShell from "../../components/hub/HubAdminShell.jsx";
import useReferrals from "../../lib/hub/useReferrals";

const STATUS_COLUMNS = [
  { key: "open", title: "Open" },
  { key: "assigned", title: "Assigned" },
  { key: "in_review", title: "In Review" },
  { key: "on_hold", title: "On Hold" },
  { key: "resolved", title: "Resolved" },
  { key: "closed", title: "Closed" },
];

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function statusClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "resolved" || s === "closed") return "rg-pill rg-pillGood";
  if (s === "on_hold") return "rg-pill rg-pillOk";
  return "rg-pill";
}

export default function ReferralLifecycleView() {
  const { items, loading, error } = useReferrals();

  const grouped = useMemo(() => {
    const seed = Object.fromEntries(STATUS_COLUMNS.map((c) => [c.key, []]));
    for (const item of items || []) {
      const key = String(item.status || "open").toLowerCase();
      if (!seed[key]) seed[key] = [];
      seed[key].push(item);
    }
    return seed;
  }, [items]);

  const summary = useMemo(() => {
    const total = (items || []).length;
    const open = grouped.open?.length || 0;
    const assigned = grouped.assigned?.length || 0;
    const inReview = grouped.in_review?.length || 0;
    const onHold = grouped.on_hold?.length || 0;
    const resolved = grouped.resolved?.length || 0;
    const closed = grouped.closed?.length || 0;
    return { total, open, assigned, inReview, onHold, resolved, closed };
  }, [items, grouped]);

  return (
    <HubAdminShell
      title="Referral Lifecycle View"
      subtitle="Lifecycle surface for tracking referral movement from intake through routing, service progression, and verified completion."
    >
      {loading ? (
        <div className="rg-error" style={{ maxWidth: 1200 }}>
          Loading referral lifecycle…
        </div>
      ) : error ? (
        <div className="rg-error" style={{ maxWidth: 1200 }}>
          Failed to load referrals: {error}
        </div>
      ) : (
        <>
          <div className="ar-grid" style={{ marginTop: 0, marginBottom: 18 }}>
            <div className="ar-card">
              <div className="ar-top">
                <div className="ar-nameRow">
                  <div className="ar-name">Total Referrals</div>
                </div>
                <div className="ar-meta">
                  <span className="ar-mono">{summary.total}</span>
                </div>
              </div>
              <div className="ar-body">
                <div className="ar-row">
                  <div className="ar-label">Status</div>
                  <div className="ar-value">Live API count</div>
                </div>
              </div>
            </div>

            <div className="ar-card">
              <div className="ar-top">
                <div className="ar-nameRow">
                  <div className="ar-name">Active Flow</div>
                </div>
                <div className="ar-meta">
                  <span className="ar-mono">
                    {summary.open + summary.assigned + summary.inReview}
                  </span>
                </div>
              </div>
              <div className="ar-body">
                <div className="ar-row">
                  <div className="ar-label">Definition</div>
                  <div className="ar-value">Open + Assigned + In Review</div>
                </div>
              </div>
            </div>

            <div className="ar-card">
              <div className="ar-top">
                <div className="ar-nameRow">
                  <div className="ar-name">Completed Flow</div>
                </div>
                <div className="ar-meta">
                  <span className="ar-mono">
                    {summary.resolved + summary.closed}
                  </span>
                </div>
              </div>
              <div className="ar-body">
                <div className="ar-row">
                  <div className="ar-label">Definition</div>
                  <div className="ar-value">Resolved + Closed</div>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 18,
            }}
          >
            {STATUS_COLUMNS.map((column) => {
              const colItems = grouped[column.key] || [];
              return (
                <div key={column.key} className="ar-card" style={{ alignSelf: "start" }}>
                  <div className="ar-top">
                    <div className="ar-nameRow">
                      <div className="ar-name">{column.title}</div>
                      <span className={statusClass(column.key)}>
                        {colItems.length}
                      </span>
                    </div>
                  </div>

                  <div className="ar-body">
                    {colItems.length === 0 ? (
                      <div className="ar-row">
                        <div className="ar-label">Queue</div>
                        <div className="ar-value">No referrals in this stage.</div>
                      </div>
                    ) : (
                      colItems.map((item) => (
                        <div
                          key={item.case_id}
                          style={{
                            borderTop: "1px solid rgba(20,20,20,0.08)",
                            paddingTop: 10,
                            marginTop: 10,
                          }}
                        >
                          <div className="ar-row">
                            <div className="ar-label">Referral</div>
                            <div className="ar-value ar-mono">{item.case_id}</div>
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
                            <div className="ar-value">{item.assigned_user_id || "Unassigned"}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </HubAdminShell>
  );
}
