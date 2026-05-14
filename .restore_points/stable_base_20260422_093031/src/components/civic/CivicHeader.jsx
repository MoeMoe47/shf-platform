// src/components/civic/CivicHeader.jsx
import React from "react";
import RewardsChip from "@/components/rewards/RewardsChip.jsx";

export default function CivicHeader() {
  return (
    <header className="civic-head wash wash--head">
      <div className="civic-head-main">
        <div>
          <h1 className="civic-title">Civic Lab</h1>
          <p className="civic-subtitle">
            Practice real democracy with micro-missions, proposals, and votes.
          </p>
          <p
            style={{
              fontSize: 12,
              marginTop: 4,
              color: "#6b7280",
            }}
          >
            Beta • Student Sandbox
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* you can add a NS button here later if you want */}
          <RewardsChip />
        </div>
      </div>
    </header>
  );
}
