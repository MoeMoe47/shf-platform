import React from "react";
import SHFOhioMapEngine from "./SHFOhioMapEngine";

export default function SHFOhioMapEngineTest() {
  return (
    <div style={{ minHeight: "100vh", background: "#efe7dc", padding: "24px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div
          style={{
            border: "1px solid rgba(183,154,128,0.35)",
            borderRadius: "18px",
            background: "rgba(255,255,255,0.34)",
            overflow: "hidden",
            height: "560px",
            boxShadow: "0 8px 18px rgba(76, 92, 64, 0.10)"
          }}
        >
          <SHFOhioMapEngine />
        </div>
      </div>
    </div>
  );
}
