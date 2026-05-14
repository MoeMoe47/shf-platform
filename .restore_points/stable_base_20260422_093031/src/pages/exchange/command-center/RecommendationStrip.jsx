import React from "react";

export default function RecommendationStrip({ recommendation }) {
  return (
    <div
      style={{
        pointerEvents: "auto",
        width: "min(760px, 100%)",
        borderRadius: 20,
        border: "1px solid rgba(120,170,255,0.18)",
        background:
          "linear-gradient(180deg, rgba(8,15,28,0.76) 0%, rgba(8,15,28,0.56) 100%)",
        backdropFilter: "blur(12px)",
        padding: "18px 20px",
        boxShadow: "0 18px 42px rgba(0,0,0,0.28)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 0.6,
          color: "#88a4c7",
          marginBottom: 8,
        }}
      >
        {recommendation.title}
      </div>
      <div
        style={{
          fontSize: 16,
          lineHeight: 1.5,
          color: "#eef5ff",
        }}
      >
        {recommendation.body}
      </div>
    </div>
  );
}
