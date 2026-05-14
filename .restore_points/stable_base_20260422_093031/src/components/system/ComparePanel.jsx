import React, { useEffect, useMemo, useState } from "react";
import { useSelectedEntity } from "@/system/context/SelectedEntityContext";
import { loadCompareOracleData, getCompareItems } from "./compare-oracle-adapter";

function scoreDelta(a, b) {
  if (!a || !b) return 0;
  return (a.confidenceScore || 0) - (b.confidenceScore || 0);
}

export default function ComparePanel({ data, loading, error }) {
  const { setSelectedEntityId, selectedEntityId } = useSelectedEntity();
  const [oracleCompareData, setOracleCompareData] = useState(null);
  const [oracleCompareError, setOracleCompareError] = useState("");
  const oracleCompareItems = useMemo(() => getCompareItems(oracleCompareData), [oracleCompareData]);
  const { strongest, weakest, ranked, summary } = data || {};

  useEffect(() => {
    let cancelled = false;

    async function loadOracleCompare() {
      try {
        const ids = [strongest?.entityId, weakest?.entityId, selectedEntityId].filter(Boolean);
        const data = await loadCompareOracleData(ids);
        if (!cancelled) {
          setOracleCompareData(data);
          setOracleCompareError("");
        }
      } catch (err) {
        if (!cancelled) {
          setOracleCompareError(err instanceof Error ? err.message : "Oracle compare failed");
        }
      }
    }

    loadOracleCompare();
    return () => {
      cancelled = true;
    };
  }, [strongest?.entityId, weakest?.entityId, selectedEntityId]);



  if (loading) return <p>Loading comparison...</p>;
  if (error) return <p>{error}</p>;
  if (!data) return null;

  const delta = scoreDelta(strongest, weakest);

  return (
    <div
      style={{
        marginTop: 20,
        padding: 20,
        borderRadius: 16,
        border: "1px solid rgba(99,102,241,0.25)",
        background: "rgba(2,6,23,0.95)",
        color: "#e2e8f0",
      }}
    >
      <h2 style={{ fontSize: 18, marginBottom: 12 }}>
        Oracle Decision Comparison
      </h2>

      <div
        style={{
          marginBottom: 16,
          padding: 12,
          borderRadius: 10,
          background: "rgba(99,102,241,0.08)",
        }}
      >
        {summary}
      </div>

      <div
        style={{
          padding: 14,
          borderRadius: 12,
          border: "1px solid rgba(34,197,94,0.35)",
          background: "rgba(34,197,94,0.08)",
          marginBottom: 12,
          boxShadow:
            selectedEntityId === strongest?.entityId
              ? "0 0 0 2px rgba(34,197,94,0.35)"
              : "none",
        }}
      >
        <strong>🏆 Strongest Case: {strongest?.entityId}</strong>
        <div style={{ marginTop: 6 }}>
          Readiness: {strongest?.readinessStatus} <br />
          Confidence: {strongest?.confidenceScore} ({strongest?.confidenceBand}) <br />
          Contradictions: {strongest?.contradictionStatus}
        </div>

        <button
          type="button"
          onClick={() => setSelectedEntityId(strongest?.entityId)}
          style={{
            marginTop: 12,
            padding: "10px 14px",
            borderRadius: 8,
            background: "linear-gradient(90deg, #10b981, #065f46)",
            color: "#fff",
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
          }}
        >
          ▶ Promote to Active Case
        </button>
      </div>

      <div
        style={{
          padding: 14,
          borderRadius: 12,
          border: "1px solid rgba(245,158,11,0.35)",
          background: "rgba(245,158,11,0.08)",
          marginBottom: 12,
          boxShadow:
            selectedEntityId === weakest?.entityId
              ? "0 0 0 2px rgba(245,158,11,0.35)"
              : "none",
        }}
      >
        <strong>⚠️ Weakest Case: {weakest?.entityId}</strong>
        <div style={{ marginTop: 6 }}>
          Readiness: {weakest?.readinessStatus} <br />
          Confidence: {weakest?.confidenceScore} ({weakest?.confidenceBand}) <br />
          Contradictions: {weakest?.contradictionStatus}
        </div>
      </div>

      <div
        style={{
          marginBottom: 16,
          fontSize: 13,
          opacity: 0.85,
        }}
      >
        Confidence Gap: <strong>{delta}</strong>
      </div>

      <div>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Priority Ranking</h3>
        {ranked.map((item, i) => (
          <div
            key={item.entityId}
            onClick={() => setSelectedEntityId(item.entityId)}
            style={{
              padding: 10,
              borderBottom: "1px solid rgba(148,163,184,0.1)",
              cursor: "pointer",
              background:
                selectedEntityId === item.entityId
                  ? "rgba(59,130,246,0.10)"
                  : "transparent",
            }}
          >
            {i + 1}. {item.entityId} — {item.readinessStatus} — {item.confidenceScore}
          </div>
        ))}
      </div>
    </div>
  );
}
