import React from "react";

export default function SimulationControls({
  isPaused,
  setIsPaused,
  tickMs,
  setTickMs,
  onStep,
}) {
  const speeds = [
    { label: "Slow", value: 8000 },
    { label: "Normal", value: 5000 },
    { label: "Fast", value: 2000 },
  ];

  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid rgba(92,140,198,0.12)",
        background: "rgba(8,15,24,0.68)",
        padding: "12px 13px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          color: "#7fd8ff",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginRight: 6,
        }}
      >
        Simulation Controls
      </div>

      <button
        onClick={() => setIsPaused?.(!isPaused)}
        style={{
          padding: "6px 10px",
          borderRadius: 8,
          border: "1px solid rgba(92,140,198,0.2)",
          background: "#0f172a",
          color: "#e2e8f0",
          cursor: "pointer",
          fontSize: 12,
        }}
      >
        {isPaused ? "Resume" : "Pause"}
      </button>

      <button
        onClick={() => onStep?.()}
        style={{
          padding: "6px 10px",
          borderRadius: 8,
          border: "1px solid rgba(92,140,198,0.2)",
          background: "#0f172a",
          color: "#e2e8f0",
          cursor: "pointer",
          fontSize: 12,
        }}
      >
        Step
      </button>

      <div style={{ display: "flex", gap: 6 }}>
        {speeds.map((speed) => (
          <button
            key={speed.value}
            onClick={() => setTickMs?.(speed.value)}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid rgba(92,140,198,0.2)",
              background: tickMs === speed.value ? "#1e293b" : "#0f172a",
              color: "#e2e8f0",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            {speed.label}
          </button>
        ))}
      </div>
    </div>
  );
}
