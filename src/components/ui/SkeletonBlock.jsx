import React from "react";

/** Minimal, dependency-free skeleton block */
export default function SkeletonBlock({ height = 16, style }) {
  return (
    <div
      aria-hidden
      style={{
        height,
        borderRadius: 6,
        background:
          "linear-gradient(90deg, rgba(0,0,0,0.06), rgba(0,0,0,0.12), rgba(0,0,0,0.06))",
        backgroundSize: "200% 100%",
        animation: "skl 1.2s ease-in-out infinite",
        ...style,
      }}
      className="skl"
    />
  );
}
