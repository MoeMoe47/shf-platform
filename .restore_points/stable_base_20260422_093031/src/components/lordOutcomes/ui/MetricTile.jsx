import React from "react";

export default function MetricTile({ label, value, hint }) {
  return (
    <div className="looTile">
      <div style={{
        fontSize: 13,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "rgba(255,255,255,0.55)"
      }}>
        {label}
      </div>

      <div style={{
        fontSize: 34,
        fontWeight: 800,
        letterSpacing: "-0.02em",
        marginTop: 6
      }}>
        {value}
      </div>

      {hint && (
        <div style={{
          marginTop: 6,
          fontSize: 12,
          color: "rgba(255,255,255,0.45)"
        }}>
          {hint}
        </div>
      )}
    </div>
  );
}
