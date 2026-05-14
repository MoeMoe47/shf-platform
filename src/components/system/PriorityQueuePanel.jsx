import React, { useState } from "react";
import { sendOracleAction } from "@/pages/admin/reporting/oracle-action-adapter";
import { fetchOraclePriority } from "@/pages/admin/reporting/oracle-priority-adapter";
import { useSelectedEntity } from "@/system/context/SelectedEntityContext";

function getRankIcon(rank, readinessStatus) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (String(readinessStatus || "").toLowerCase() === "blocked") return "⚠️";
  return "•";
}

export default function PriorityQueuePanel({
  priorityData,
  setPriorityData,
  onAfterAction,
}) {
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const { setSelectedEntityId, notifyEntityAction } = useSelectedEntity();

  async function handleAction(entityId, action) {
    try {
      setActionError("");
      setActionMessage("");
      setBusyKey(`${entityId}:${action}`);
      setSelectedEntityId(entityId);

      const result = await sendOracleAction(entityId, action);

      setActionMessage(result?.message || "Action accepted.");

      notifyEntityAction?.({
        entityId,
        action,
        message: result?.message || "Action accepted.",
        createdAt: new Date().toISOString(),
      });

      const ids = priorityData?.ranked?.map((r) => r.entityId).filter(Boolean) || [];
      if (ids.length && setPriorityData) {
        const refreshed = await fetchOraclePriority(ids);
        if (refreshed) {
          setPriorityData(refreshed);
        }
      }

      if (onAfterAction) {
        await onAfterAction();
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyKey("");
    }
  }

  if (!priorityData) {
    return (
      <div className="section-card">
        <h3 style={{ marginBottom: 12 }}>Priority Queue</h3>
        <p style={{ color: "#94a3b8" }}>No priority data available.</p>
      </div>
    );
  }

  const ranked = Array.isArray(priorityData.ranked) ? priorityData.ranked : [];

  return (
    <div className="section-card">
      <h3
        style={{
          marginBottom: 12,
          color: "#f8fafc",
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: "0.01em",
        }}
      >
        Priority Queue
      </h3>

      {priorityData.summary ? (
        <div
          style={{
            marginBottom: 12,
            marginTop: 4,
            padding: "14px 18px",
            borderRadius: 14,
            background:
              "linear-gradient(90deg, rgba(16,185,129,0.25), rgba(2,6,23,1))",
            border: "1px solid rgba(16,185,129,0.65)",
            boxShadow: "0 0 24px rgba(16,185,129,0.18)",
            color: "#ffffff",
            fontWeight: 800,
            lineHeight: 1.6,
          }}
        >
          ⚡ SYSTEM DECISION — {priorityData.summary}
        </div>
      ) : null}

      {actionMessage ? (
        <div
          style={{
            marginBottom: 12,
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid rgba(34,197,94,0.28)",
            background: "rgba(34,197,94,0.10)",
            color: "rgba(220,252,231,0.98)",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {actionMessage}
        </div>
      ) : null}

      {actionError ? (
        <div
          style={{
            marginBottom: 12,
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid rgba(239,68,68,0.28)",
            background: "rgba(239,68,68,0.10)",
            color: "rgba(254,226,226,0.98)",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {actionError}
        </div>
      ) : null}

      <div>
        {ranked.map((item) => {
          const isTop = item.rank === 1;
          const isRisk = String(item.readinessStatus || "").toLowerCase() === "blocked";
          const busy = busyKey === `${item.entityId}:review`;

          return (
            <div
              key={item.entityId}
              onClick={() => setSelectedEntityId(item.entityId)}
              style={{
                cursor: "pointer",
                marginBottom: 14,
                padding: 14,
                borderRadius: 14,
                background: isRisk
                  ? "linear-gradient(180deg, rgba(2,6,23,0.96), rgba(30,0,0,0.35))"
                  : "rgba(2,6,23,0.96)",
                border: isTop
                  ? "1px solid rgba(16,185,129,0.55)"
                  : "1px solid rgba(148,163,184,0.16)",
                boxShadow: isTop
                  ? "0 0 24px rgba(16,185,129,0.12)"
                  : "0 10px 24px rgba(2,6,23,0.22)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <div style={{ color: "#f8fafc", fontWeight: 700 }}>
                  {getRankIcon(item.rank, item.readinessStatus)} #{item.rank} — {item.label || item.entityId}
                </div>
                <div style={{ color: "#cbd5e1", fontSize: 12 }}>
                  {item.readinessStatus || "unknown"}
                </div>
              </div>

              {item.recommendedNextAction ? (
                <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 10 }}>
                  {item.recommendedNextAction}
                </div>
              ) : null}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(item.entityId, "review");
                  }}
                  disabled={busy}
                  style={{
                    border: "1px solid rgba(16,185,129,0.35)",
                    background: "rgba(16,185,129,0.12)",
                    color: "#dcfce7",
                    borderRadius: 10,
                    padding: "8px 12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {busy ? "Working..." : "Review"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
