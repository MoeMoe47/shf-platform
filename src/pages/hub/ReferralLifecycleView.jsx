import React, { useMemo, useState } from "react";
import HubAdminShell from "../../components/hub/HubAdminShell.jsx";
import useReferrals from "../../lib/hub/useReferrals";
import { transitionReferral } from "../../lib/hub/api";

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

function nextActionsForStatus(status) {
  const s = String(status || "").toLowerCase();
  if (s === "open") return [{ label: "Assign", next: "assigned" }];
  if (s === "assigned") return [{ label: "Start Review", next: "in_review" }];
  if (s === "in_review") {
    return [
      { label: "Put On Hold", next: "on_hold" },
      { label: "Resolve", next: "resolved" },
    ];
  }
  if (s === "resolved") return [{ label: "Close", next: "closed" }];
  return [];
}

export default function ReferralLifecycleView() {
  const { items, loading, error } = useReferrals();
  const [busyId, setBusyId] = useState("");
  const [flash, setFlash] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);

  const grouped = useMemo(() => {
    const seed = Object.fromEntries(STATUS_COLUMNS.map((c) => [c.key, []]));
    for (const item of items || []) {
      const key = String(item.status || "open").toLowerCase();
      if (!seed[key]) seed[key] = [];
      seed[key].push(item);
    }
    return seed;
  }, [items, refreshTick]);

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

  async function handleTransition(item, nextStatus) {
    try {
      setBusyId(item.case_id);
      setFlash("");
      await transitionReferral(
        item.case_id,
        item.status,
        nextStatus,
        `Transitioned from ${item.status} to ${nextStatus}`
      );
      setFlash(`Referral ${item.case_id} moved to ${nextStatus}.`);
      window.location.reload();
    } catch (err) {
      setFlash(err?.message || "Failed to transition referral.");
    } finally {
      setBusyId("");
      setRefreshTick((n) => n + 1);
    }
  }

  return (
    <HubAdminShell
      title="Referral Lifecycle View"
      subtitle="Lifecycle surface for tracking referral movement from intake through routing, service progression, and verified completion."
    >
      {flash ? (
        <div
          className="rg-error"
          style={{
            maxWidth: 1200,
            marginBottom: 14,
            borderColor: "rgba(70,180,110,0.30)",
            background: "rgba(70,180,110,0.10)",
          }}
        >
          {flash}
        </div>
      ) : null}

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
                      colItems.map((item) => {
                        const actions = nextActionsForStatus(item.status);
                        return (
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

                            {actions.length ? (
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                                {actions.map((action) => (
                                  <button
                                    key={action.next}
                                    className={`ar-btn ${busyId === item.case_id ? "ar-btnLocked" : ""}`}
                                    type="button"
                                    disabled={busyId === item.case_id}
                                    onClick={() => handleTransition(item, action.next)}
                                  >
                                    {busyId === item.case_id ? "Updating…" : action.label}
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        );
                      })
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
