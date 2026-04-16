import React, { useEffect, useMemo, useState } from "react";
import { assignReferral, fetchReferrals, transitionReferral } from "../../lib/hub/api";
import useOrganizations from "../../lib/hub/useOrganizations";
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

function previewNotes(text) {
  if (!text) return "—";
  return text.length > 120 ? `${text.slice(0, 120)}…` : text;
}

export default function PartnerActionQueue() {
  const orgs = useOrganizations();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [flash, setFlash] = useState("");

  const orgMap = useMemo(
    () =>
      Object.fromEntries(
        (orgs.items || []).map((org) => [
          org.organization_id,
          org.organization_name || org.display_name || org.legal_name || org.organization_id,
        ])
      ),
    [orgs.items]
  );

  async function loadQueue() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchReferrals();
      setItems(data?.items || []);
    } catch (err) {
      setError(err?.message || "Failed to load partner queue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQueue();
  }, []);

  async function handleAssignToMe(item) {
    try {
      setBusyId(item.case_id);
      setFlash("");
      setError("");
      await assignReferral(item.case_id, {
        assigned_user_id: "user_admin_001",
        reason_text: "Assigned from hub queue to current operator",
      });
      setFlash(`Referral ${item.case_id} assigned to user_admin_001.`);
      await loadQueue();
    } catch (err) {
      setError(err?.message || "Failed to assign referral.");
    } finally {
      setBusyId("");
    }
  }

  async function handleTransition(item, nextStatus) {
    try {
      setBusyId(item.case_id);
      setFlash("");
      setError("");
      await transitionReferral(
        item.case_id,
        item.status,
        nextStatus,
        `Transitioned from ${item.status} to ${nextStatus}`
      );
      setFlash(`Referral ${item.case_id} moved to ${nextStatus}.`);
      await loadQueue();
    } catch (err) {
      setError(err?.message || "Failed to transition referral.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="ar-wrap">
      <header className="ar-head">
        <div>
          <div className="ar-kicker">SHS Hub Collaboration Layer</div>
          <h1 className="ar-title">Partner Action Queue</h1>
          <div className="ar-sub">Live referral queue powered by the SHS API.</div>
        </div>
        <div className="ar-actions">
          <button className="ar-btn ar-btnGhost" type="button" onClick={loadQueue}>
            Refresh
          </button>
        </div>
      </header>

      {flash ? (
        <div
          className="rg-error"
          style={{
            maxWidth: 1200,
            marginBottom: 14,
            borderColor: "rgba(70,180,110,0.30)",
            background: "rgba(70,180,110,0.10)"
          }}
        >
          {flash}
        </div>
      ) : null}

      {loading || orgs.loading ? (
        <div className="rg-error" style={{ maxWidth: 1200 }}>
          Loading partner queue…
        </div>
      ) : error || orgs.error ? (
        <div className="rg-error" style={{ maxWidth: 1200 }}>
          Failed to load partner queue: {error || orgs.error}
        </div>
      ) : items.length === 0 ? (
        <div className="rg-error" style={{ maxWidth: 1200 }}>
          No referrals found.
        </div>
      ) : (
        <div className="ar-grid">
          {items.map((item) => {
            const actions = nextActionsForStatus(item.status);
            const canAssignToMe = !item.assigned_user_id && item.status !== "closed";
            return (
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
                      {orgMap[item.organization_id] || item.organization_id || "—"}
                    </div>
                  </div>

                  <div className="ar-row">
                    <div className="ar-label">Receiver</div>
                    <div className="ar-value">
                      {orgMap[item.receiving_organization_id] || item.receiving_organization_id || "—"}
                    </div>
                  </div>

                  <div className="ar-row">
                    <div className="ar-label">Need Category</div>
                    <div className="ar-value">{item.need_category || "—"}</div>
                  </div>

                  <div className="ar-row">
                    <div className="ar-label">Urgency</div>
                    <div className="ar-value">{item.urgency_level || item.priority || "—"}</div>
                  </div>

                  <div className="ar-row">
                    <div className="ar-label">Created</div>
                    <div className="ar-value">{formatDate(item.created_at)}</div>
                  </div>

                  <div className="ar-row">
                    <div className="ar-label">Assigned</div>
                    <div className="ar-value">{item.assigned_user_id || "Unassigned"}</div>
                  </div>

                  <div className="ar-row">
                    <div className="ar-label">Notes</div>
                    <div className="ar-value">{previewNotes(item.notes)}</div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                    {canAssignToMe ? (
                      <button
                        className={`ar-btn ${busyId === item.case_id ? "ar-btnLocked" : ""}`}
                        type="button"
                        disabled={busyId === item.case_id}
                        onClick={() => handleAssignToMe(item)}
                      >
                        {busyId === item.case_id ? "Assigning…" : "Assign to Me"}
                      </button>
                    ) : null}

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
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
