import React, { useMemo } from "react";
import HubAdminShell from "../../components/hub/HubAdminShell.jsx";
import useReferrals from "../../lib/hub/useReferrals";

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function severityPillClass(kind) {
  if (kind === "high") return "rg-pill rg-pillOk";
  if (kind === "good") return "rg-pill rg-pillGood";
  return "rg-pill";
}

export default function UnmetNeedsQueue() {
  const { items, loading, error } = useReferrals();

  const metrics = useMemo(() => {
    const referrals = items || [];
    const total = referrals.length;
    const open = referrals.filter((r) => String(r.status || "").toLowerCase() === "open");
    const highPriority = referrals.filter((r) => String(r.priority || "").toLowerCase() === "high");
    const unassigned = referrals.filter((r) => !r.assigned_user_id);
    const likelyUnmet = referrals.filter((r) => {
      const status = String(r.status || "").toLowerCase();
      const priority = String(r.priority || "").toLowerCase();
      return status === "open" && priority === "high";
    });

    return {
      total,
      openCount: open.length,
      highPriorityCount: highPriority.length,
      unassignedCount: unassigned.length,
      likelyUnmetCount: likelyUnmet.length,
      likelyUnmet,
      unassigned,
    };
  }, [items]);

  return (
    <HubAdminShell
      title="Unmet Needs Queue"
      subtitle="Operational queue for unmet-need signals, unresolved barriers, capacity gaps, and funder-relevant demand visibility."
    >
      {loading ? (
        <div className="rg-error" style={{ maxWidth: 1200 }}>
          Loading unmet-need signals…
        </div>
      ) : error ? (
        <div className="rg-error" style={{ maxWidth: 1200 }}>
          Failed to load unmet-need signals: {error}
        </div>
      ) : (
        <>
          <div className="ar-grid" style={{ marginTop: 0, marginBottom: 18 }}>
            <div className="ar-card">
              <div className="ar-top">
                <div className="ar-nameRow">
                  <div className="ar-name">Likely Unmet Need Candidates</div>
                  <span className={severityPillClass("high")}>
                    {metrics.likelyUnmetCount}
                  </span>
                </div>
                <div className="ar-meta">
                  <span className="ar-mono">Open + High Priority</span>
                </div>
              </div>
              <div className="ar-body">
                <div className="ar-row">
                  <div className="ar-label">Rule</div>
                  <div className="ar-value">
                    High-priority referrals still open are treated as early unmet-need candidates.
                  </div>
                </div>
              </div>
            </div>

            <div className="ar-card">
              <div className="ar-top">
                <div className="ar-nameRow">
                  <div className="ar-name">Open Referral Pressure</div>
                  <span className="rg-pill">{metrics.openCount}</span>
                </div>
                <div className="ar-meta">
                  <span className="ar-mono">Current unresolved intake load</span>
                </div>
              </div>
              <div className="ar-body">
                <div className="ar-row">
                  <div className="ar-label">Total</div>
                  <div className="ar-value">{metrics.total} referrals in stream</div>
                </div>
              </div>
            </div>

            <div className="ar-card">
              <div className="ar-top">
                <div className="ar-nameRow">
                  <div className="ar-name">Unassigned Work</div>
                  <span className={severityPillClass("high")}>
                    {metrics.unassignedCount}
                  </span>
                </div>
                <div className="ar-meta">
                  <span className="ar-mono">Referrals without an assigned user</span>
                </div>
              </div>
              <div className="ar-body">
                <div className="ar-row">
                  <div className="ar-label">Signal</div>
                  <div className="ar-value">
                    Unassigned referrals can indicate coordination lag or capacity risk.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 18,
            }}
          >
            <div className="ar-card">
              <div className="ar-top">
                <div className="ar-nameRow">
                  <div className="ar-name">Likely Unmet Need Queue</div>
                </div>
                <div className="ar-meta">
                  <span className="ar-mono">
                    Live referrals inferred from status + priority
                  </span>
                </div>
              </div>

              <div className="ar-body">
                {metrics.likelyUnmet.length === 0 ? (
                  <div className="ar-row">
                    <div className="ar-label">Queue</div>
                    <div className="ar-value">No likely unmet-need candidates right now.</div>
                  </div>
                ) : (
                  metrics.likelyUnmet.map((item) => (
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
                        <div className="ar-label">Status</div>
                        <div className="ar-value">{item.status || "—"}</div>
                      </div>
                      <div className="ar-row">
                        <div className="ar-label">Created</div>
                        <div className="ar-value">{formatDate(item.created_at)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="ar-card">
              <div className="ar-top">
                <div className="ar-nameRow">
                  <div className="ar-name">Interpretation Notes</div>
                </div>
              </div>

              <div className="ar-body">
                <div className="ar-row">
                  <div className="ar-label">Current Rule</div>
                  <div className="ar-value">
                    This page is currently using referral status and priority as an early unmet-need proxy.
                  </div>
                </div>
                <div className="ar-row">
                  <div className="ar-label">Next Upgrade</div>
                  <div className="ar-value">
                    Add true unmet-need objects, need-category rollups, and barrier reasons from the backend.
                  </div>
                </div>
                <div className="ar-row">
                  <div className="ar-label">Why It Matters</div>
                  <div className="ar-value">
                    Even early inference helps leadership see demand pressure, unresolved high-priority needs, and capacity gaps.
                  </div>
                </div>
                <div className="ar-row">
                  <div className="ar-label">Status</div>
                  <div className="ar-value">
                    Phase 1 intelligence view is now reading the live referral stream.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </HubAdminShell>
  );
}
