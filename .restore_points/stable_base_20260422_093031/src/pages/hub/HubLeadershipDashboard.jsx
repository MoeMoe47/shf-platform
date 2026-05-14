import React from "react";
import useReferrals from "@/lib/hub/useReferrals";
import useOrganizations from "@/lib/hub/useOrganizations";
import { getFocusedSourceId } from "@/system/routing/hash-query";
import "./hub.css";

function SummaryCard({ title, value, label, summary }) {
  return (
    <article className="hub-card">
      <h3>{title}</h3>
      <div className="hub-card-value">{value}</div>
      <div className="hub-card-chip">{label}</div>
      <div className="hub-card-meta">
        <span>SUMMARY</span>
        <strong>{summary}</strong>
      </div>
    </article>
  );
}

export default function HubLeadershipDashboard() {
  const focusedSourceId = getFocusedSourceId();
  const { items: referrals = [], loading: referralsLoading, error: referralsError } = useReferrals();
  const { items: organizations = [], loading: orgsLoading, error: orgsError } = useOrganizations();

  const loading = referralsLoading || orgsLoading;
  const error = referralsError || orgsError;

  const totalReferrals = referrals.length;
  const completedFlow = referrals.filter((item) =>
    ["resolved", "closed", "completed"].includes(String(item.status || "").toLowerCase())
  ).length;

  const activeFlow = referrals.filter((item) =>
    ["open", "assigned", "in_review", "in-review", "review"].includes(
      String(item.status || "").toLowerCase()
    )
  ).length;

  const likelyUnmetNeeds = referrals.filter((item) => {
    const status = String(item.status || "").toLowerCase();
    const priority = String(item.priority || item.urgency_level || "").toLowerCase();
    return (status === "open" || status === "unassigned") && priority === "high";
  }).length;

  const unassignedWork = referrals.filter(
    (item) =>
      !item.assigned_user_id &&
      !item.assignedUserId &&
      !item.assigned_to &&
      !item.assignee
  ).length;

  const highPriority = referrals.filter((item) => {
    const priority = String(item.priority || item.urgency_level || "").toLowerCase();
    return priority === "high";
  }).length;

  const focusedReferral = focusedSourceId
    ? referrals.find(
        (item) =>
          item.case_id === focusedSourceId ||
          item.id === focusedSourceId ||
          item.referral_id === focusedSourceId
      )
    : null;

  return (
    <main className="hub-leadership-dashboard">
      {focusedSourceId ? (
        <div
          style={{
            margin: "0 0 20px",
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(34, 197, 94, 0.72)",
            background: "rgba(34, 197, 94, 0.18)",
            color: "rgba(20, 83, 45, 0.98)",
            fontSize: 14,
            fontWeight: 700,
            lineHeight: 1.5,
            boxShadow: "0 8px 24px rgba(34, 197, 94, 0.14)",
          }}
        >
          Focused source: <strong>{focusedSourceId}</strong>
          {focusedReferral ? (
            <>
              {" "} | Status: <strong>{String(focusedReferral.status || "unknown")}</strong>
            </>
          ) : null}
        </div>
      ) : null}

      <section className="hub-hero">
        <div>
          <p className="hub-eyebrow">SHS Hub Collaboration Layer</p>
          <h1>Hub Leadership Dashboard</h1>
          <p>
            Leadership view for network coordination, referral activity, unmet-need visibility,
            and verified collaboration outcomes.
          </p>
        </div>
      </section>

      {error ? (
        <div
          style={{
            marginBottom: 20,
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(239, 68, 68, 0.22)",
            background: "rgba(127, 29, 29, 0.12)",
            color: "rgba(254, 202, 202, 0.98)",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          Failed to load hub leadership summary: {error}
        </div>
      ) : null}

      <section className="hub-grid">
        <SummaryCard
          title="Referrals In Stream"
          value={loading ? "…" : totalReferrals}
          label="Operational"
          summary="Total live referrals across the hub collaboration layer"
        />
        <SummaryCard
          title="Active Flow"
          value={loading ? "…" : activeFlow}
          label="Live"
          summary="Open + Assigned + In Review referrals currently moving through the hub"
        />
        <SummaryCard
          title="Completed Flow"
          value={loading ? "…" : completedFlow}
          label="Verified Path"
          summary="Resolved + Closed referrals now counted as completed movement"
        />
        <SummaryCard
          title="Likely Unmet Needs"
          value={loading ? "…" : likelyUnmetNeeds}
          label="Pressure Signal"
          summary="Open + high-priority referrals treated as early unmet-need pressure"
        />
        <SummaryCard
          title="Unassigned Work"
          value={loading ? "…" : unassignedWork}
          label="Queue Risk"
          summary="Referrals still waiting for clear ownership"
        />
        <SummaryCard
          title="Organizations Online"
          value={loading ? "…" : organizations.length}
          label="Network Live"
          summary="Organizations currently loaded into the hub partner layer"
        />
        <SummaryCard
          title="High Priority Referrals"
          value={loading ? "…" : highPriority}
          label="Urgent"
          summary="High-priority cases requiring faster coordination response"
        />
        <SummaryCard
          title="Hub Status"
          value={error ? "At Risk" : "Operational"}
          label="Build Active"
          summary="Leadership summary now reading live referral and organization streams"
        />
      </section>

      {focusedReferral ? (
        <section className="hub-card" style={{ marginTop: 20 }}>
          <h3>Focused Source Detail</h3>
          <div className="hub-card-meta" style={{ marginTop: 12 }}>
            <span>CASE ID</span>
            <strong>{focusedReferral.case_id || focusedReferral.id || focusedSourceId}</strong>
          </div>
          <div className="hub-card-meta">
            <span>STATUS</span>
            <strong>{String(focusedReferral.status || "unknown")}</strong>
          </div>
          <div className="hub-card-meta">
            <span>PRIORITY</span>
            <strong>{String(focusedReferral.priority || focusedReferral.urgency_level || "unknown")}</strong>
          </div>
          <div className="hub-card-meta">
            <span>RECEIVER</span>
            <strong>
              {focusedReferral.receiving_organization_id ||
                focusedReferral.receivingOrganizationId ||
                "—"}
            </strong>
          </div>
          <div className="hub-card-meta">
            <span>NEED CATEGORY</span>
            <strong>{focusedReferral.need_category || focusedReferral.needCategory || "—"}</strong>
          </div>
          <div className="hub-card-meta">
            <span>ASSIGNED</span>
            <strong>
              {focusedReferral.assigned_user_id ||
                focusedReferral.assignedUserId ||
                focusedReferral.assigned_to ||
                "Unassigned"}
            </strong>
          </div>
        </section>
      ) : null}
    </main>
  );
}
