import React from "react";

const container = {
  position: "relative",
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

const sphere = {
  width: 520,
  height: 520,
  borderRadius: "50%",
  position: "relative",
  background:
    "radial-gradient(circle at 35% 30%, rgba(59,130,246,.25), rgba(2,6,23,1) 70%)",
  boxShadow:
    "0 0 80px rgba(37,99,235,.35), inset 0 0 120px rgba(15,23,42,.9)",
  border: "1px solid rgba(148,163,184,.25)"
};

const atmosphere = {
  position: "absolute",
  inset: -20,
  borderRadius: "50%",
  boxShadow: "0 0 80px rgba(56,189,248,.35)"
};

const orbitRing = {
  position: "absolute",
  inset: 20,
  borderRadius: "50%",
  border: "1px dashed rgba(148,163,184,.2)"
};

const node = (x, y, color = "#38bdf8") => ({
  position: "absolute",
  left: x,
  top: y,
  width: 14,
  height: 14,
  borderRadius: "50%",
  background: color,
  boxShadow: `0 0 12px ${color}`
});

export default function CommandSphere() {
  return (
    <div style={container}>
      <div style={sphere}>
        <div style={atmosphere} />
        <div style={orbitRing} />

        <div style={node("62%", "30%")} />
        <div style={node("35%", "65%", "#f97316")} />
        <div style={node("70%", "75%", "#22c55e")} />

        <div style={{
          position: "absolute",
          left: "64%",
          top: "26%",
          color: "#cbd5f5",
          fontSize: 12
        }}>
          Workforce Pilot
        </div>

        <div style={{
          position: "absolute",
          left: "32%",
          top: "62%",
          color: "#e5e7eb",
          fontSize: 12
        }}>
          Franklin County
        </div>

      </div>
    </div>
  );
}
