// src/pages/fuel/Submit.jsx
import React from "react";
import { APP } from "@/router/paths.js";

export default function FuelSubmit() {
  const sp   = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const from = sp.get("from");
  const slug = sp.get("slug") || "lesson";
  const title = sp.get("title") || "";
  const back = from || `${APP.curriculum}/lessons/${slug}`;

  const [name, setName] = React.useState(title);
  const [desc, setDesc] = React.useState("");

  return (
    <div className="ft-pad" style={{ padding: 16 }}>
      <h1 style={{ marginBottom: 8 }}>Submit to Fuel Tank</h1>
      <p style={{ color: "var(--ft-dim,#667085)", marginTop: 0 }}>
        Share your project pitch with the panel and community.
      </p>

      <div className="ft-panel" style={{ border:"1px solid var(--ft-line,#e7e5e4)", borderRadius: 12, background: "#fff", padding: 12 }}>
        <label style={{ display:"grid", gap: 6, marginBottom: 12 }}>
          <span>Project Title</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., SignBridge"
            style={{ padding:"8px 10px", border:"1px solid var(--ft-line,#e7e5e4)", borderRadius: 8 }}
          />
        </label>

        <label style={{ display:"grid", gap: 6, marginBottom: 12 }}>
          <span>Short Description</span>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={5}
            placeholder="What problem do you solve? What's your plan?"
            style={{ padding:"8px 10px", border:"1px solid var(--ft-line,#e7e5e4)", borderRadius: 8 }}
          />
        </label>

        <div style={{ display:"flex", gap: 8 }}>
          <button
            className="ft-ghost"
            onClick={() => console.log("submit pitch", { name, desc, slug, from })}
            style={{ border:"1px solid var(--ft-line,#e7e5e4)", background:"#fff", borderRadius: 10, padding:"8px 12px" }}
          >
            Submit Pitch
          </button>

          <a
            href={back}
            className="ft-ghost"
            style={{ marginLeft:"auto", border:"1px solid var(--ft-line,#e7e5e4)", background:"#fff", borderRadius: 10, padding:"8px 12px", textDecoration:"none" }}
          >
            ← Back to Curriculum
          </a>
        </div>
      </div>
    </div>
  );
}
