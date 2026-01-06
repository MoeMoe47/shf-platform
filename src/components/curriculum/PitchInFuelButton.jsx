// src/components/curriculum/PitchInFuelButton.jsx
import React from "react";
import { APP } from "@/paths.js";

function enc(x = "") {
  try { return encodeURIComponent(String(x)); } catch { return ""; }
}

export default function PitchInFuelButton({ title, slug, from }) {
  // Best-effort fallbacks
  const _title = title || (typeof document !== "undefined" ? document.title : "My Project");
  const _slug  = slug  || (typeof window !== "undefined" ? (window.location.hash.split("/").pop() || "untitled") : "untitled");
  const _from  = from  || (typeof window !== "undefined" ? window.location.href : "");

  const href = `${APP.fuel}/submit?title=${enc(_title)}&slug=${enc(_slug)}&from=${enc(_from)}`;

  return (
    <a
      className="btn pill"
      href={href}
      title="Pitch this in Fuel Tank"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        border: "1px solid var(--ring, #e5e7eb)",
        borderRadius: 999,
        background: "#fff",
        textDecoration: "none",
        fontWeight: 600,
      }}
    >
      🚀 Pitch in Fuel Tank
    </a>
  );
}
