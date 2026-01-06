// src/pages/fuel/Submit.jsx
import React from "react";
import { APP } from "@/paths.js";

export default function FuelSubmit() {
  const sp   = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const from = sp.get("from");
  const slug = sp.get("slug") || "lesson";
  const back = from || `${APP.curriculum}/lessons/${slug}`;

  return (
    <div className="ft-pad" style={{ padding: 16 }}>
      {/* ...your form... */}
      <a href={back} className="ft-ghost" style={{ border:"1px solid var(--ft-line,#e7e5e4)", padding:"8px 12px", borderRadius:10, textDecoration:"none" }}>
        ← Back to Curriculum
      </a>
    </div>
  );
}
