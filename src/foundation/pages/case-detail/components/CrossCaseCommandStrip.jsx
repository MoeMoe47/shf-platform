import React, { useEffect, useMemo, useRef, useState } from "react";

function getRiskSignal(item) {
  if (!item) {
    return {
      label: "Unknown",
      color: "#6b7280",
      bg: "rgba(107,114,128,0.08)",
      border: "rgba(107,114,128,0.18)",
    };
  }

  const readiness = item?.readinessStatus || "unknown";
  const confidence = Number(item?.confidenceScore ?? 0);

  if (readiness === "blocked" || confidence < 60) {
    return {
      label: "High Risk",
      color: "#991b1b",
      bg: "rgba(239,68,68,0.08)",
      border: "rgba(239,68,68,0.20)",
    };
  }

  if (readiness === "verification_hold" || confidence < 85) {
    return {
      label: "Medium Risk",
      color: "#92400e",
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.20)",
    };
  }

  return {
    label: "Low Risk",
    color: "#065f46",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.20)",
  };
}

export default function CrossCaseCommandStrip({
  priorityState,
  currentPriority,
  safeEntityId,
  buttonStyle,
  cardStyle,
  SectionLabel,
}) {
  const [rankPulse, setRankPulse] = useState(false);
  const lastRankRef = useRef(currentPriority?.rank ?? "—");

  const summary = useMemo(() => {
    const ranked = priorityState?.ranked || [];
    const currentIndex = ranked.findIndex((c) => c.entityId === safeEntityId);

    const previousCase =
      currentIndex > 0
        ? ranked[currentIndex - 1]?.entityId
        : ranked[ranked.length - 1]?.entityId;

    const nextCase =
      ranked.length > 0
        ? ranked[(currentIndex + 1) % ranked.length]?.entityId
        : null;

    return {
      executionMode: ranked.filter((c) => c.readinessStatus === "execution_mode").length,
      blocked: ranked.filter((c) => c.readinessStatus === "blocked").length,
      verificationHold: ranked.filter((c) => c.readinessStatus === "verification_hold").length,
      internallyReady: ranked.filter((c) => c.readinessStatus === "internally_ready").length,
      topPriority: ranked[0]?.entityId || "—",
      currentRank: currentPriority?.rank ?? "—",
      total: ranked.length,
      previousCase,
      nextCase,
      risk: getRiskSignal(currentPriority),
    };
  }, [priorityState, currentPriority, safeEntityId]);

  useEffect(() => {
    const nextRank = currentPriority?.rank ?? "—";
    if (lastRankRef.current !== nextRank) {
      setRankPulse(true);
      const t = setTimeout(() => setRankPulse(false), 1200);
      lastRankRef.current = nextRank;
      return () => clearTimeout(t);
    }
  }, [currentPriority?.rank]);

  function jumpToCase(id) {
    if (!id) return;
    window.location.hash = `#/case/${id}`;
  }

  return (
    <div style={{
      ...cardStyle,
      border: rankPulse
        ? "1px solid rgba(16,185,129,0.30)"
        : "1px solid rgba(165,132,97,0.14)",
      padding: 18
    }}>
      <SectionLabel>Cross-Case Command Strip</SectionLabel>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10 }}>
        <div>Exec: {summary.executionMode}</div>
        <div>Blocked: {summary.blocked}</div>
        <div>Hold: {summary.verificationHold}</div>
        <div>Ready: {summary.internallyReady}</div>
        <div>Top: {summary.topPriority}</div>
        <div>Rank: #{summary.currentRank}</div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <button onClick={() => jumpToCase(summary.previousCase)} style={buttonStyle}>←</button>
        <button onClick={() => jumpToCase(summary.topPriority)} style={buttonStyle}>Top</button>
        <button onClick={() => jumpToCase(summary.nextCase)} style={buttonStyle}>→</button>
      </div>
    </div>
  );
}
