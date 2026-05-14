// src/pages/civic/Missions.jsx
import React from "react";
import { Link } from "react-router-dom";
import lessons from "@/data/civic/micro-lessons.v1.json";
import RewardsChip from "@/components/rewards/RewardsChip.jsx";

export default function Missions() {
  const items = lessons.items || [];

  return (
    <section className="crb-main" aria-labelledby="missions-title">
      <header className="db-head">
        <div>
          <h1 id="missions-title" className="db-title">
            Civic Missions
          </h1>
          <p className="db-subtitle">
            Quick practice runs for real-world government decisions.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <RewardsChip />
        </div>
      </header>

      <div className="card card--pad">
        <ul className="db-list">
          {items.map((m) => (
            <li key={m.id} className="db-list-item">
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <strong>{m.title}</strong>
                <span className="db-meta">
                  {m.objective || "Short civic learning mission"}
                </span>
              </div>
              <Link to={`/mission/${m.id}`} className="sh-btn is-ghost">
                Start →
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
