// src/pages/Settings.jsx
import React from "react";
import ExternalCalendarConnections from "@/pages/career/settings/ExternalCalendarConnections.jsx";

export default function Settings() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className="card card--pad">
        <h1 style={{ marginTop: 0 }}>Settings</h1>
        <p>Account, notifications, accessibility — coming soon.</p>
      </div>
      <ExternalCalendarConnections />
    </div>
  );
}
