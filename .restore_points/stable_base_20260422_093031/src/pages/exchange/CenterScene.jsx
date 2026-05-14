import React from "react";

export default function CenterScene() {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "560px",
        borderRadius: 14,
        overflow: "hidden",
        background: "#02060d"
      }}
    >

      {/* starfield */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 10% 20%, #ffffff 1px, transparent 2px), radial-gradient(circle at 40% 10%, #ffffff 1px, transparent 2px), radial-gradient(circle at 80% 30%, #ffffff 1px, transparent 2px), radial-gradient(circle at 70% 70%, #ffffff 1px, transparent 2px)",
          opacity: 0.4
        }}
      />

      {/* globe */}
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg"
        style={{
          position: "absolute",
          width: "900px",
          left: "50%",
          top: "52%",
          transform: "translate(-50%,-50%)",
          borderRadius: "50%",
          filter: "brightness(.9) contrast(1.1)",
          boxShadow:
            "0 0 120px rgba(80,160,255,.45), 0 0 280px rgba(80,160,255,.25)"
        }}
      />

      {/* nodes */}
      <Node left={160} top={260} title="Workforce Pool" sub="funding rail" />
      <Node left={300} top={340} title="Franklin County" sub="23 participants" strong />
      <Node right={180} top={260} title="Workforce Program" sub="outcome track" />
      <Node right={160} top={400} title="Hamilton County" sub="regional node" />
      <Node left={220} bottom={70} title="Workforce Funding Pool" sub="$2,500 escrow" />

    </div>
  );
}

function Node({ title, sub, strong, ...pos }) {
  return (
    <div
      style={{
        position: "absolute",
        padding: "10px 14px",
        borderRadius: 12,
        background: "rgba(40,55,75,.55)",
        border: "1px solid rgba(200,220,255,.15)",
        backdropFilter: "blur(10px)",
        color: "#eaf2ff",
        fontWeight: strong ? 700 : 600,
        ...pos
      }}
    >
      <div>{title}</div>
      <div style={{ fontSize: 12, opacity: .7 }}>{sub}</div>
    </div>
  );
}
