import React from "react";

const STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "Available", icon: "●" },
  { value: "AWAY", label: "Away", icon: "◐" },
  { value: "DO_NOT_DISTURB", label: "Do not disturb", icon: "◼" },
  { value: "OFFLINE", label: "Appear offline", icon: "○" },
];

export default function MetaversePresenceHud({ counts, districtId, status, onStatusChange, loading }) {
  const totalOnline = (counts || []).reduce((sum, item) => sum + (item.online_count || 0), 0);
  const districtCount = districtId ? (counts || []).find((item) => item.district_id === districtId)?.online_count || 0 : null;

  return (
    <section className="met-presence-hud" aria-label="Online presence" data-loading={loading ? "true" : "false"}>
      <p className="met-presence-hud__count">
        <strong>{totalOnline}</strong> online in Silicon Heartland
      </p>
      {districtId ? (
        <p className="met-presence-hud__district-count">
          <strong>{districtCount}</strong> online in this district
        </p>
      ) : null}
      <label className="met-presence-hud__status">
        <span className="met-presence-hud__status-label">Your status</span>
        <span className="met-presence-hud__status-select">
          <span aria-hidden="true" className={`met-presence-hud__status-icon met-presence-hud__status-icon--${status?.toLowerCase() || "available"}`}>
            {STATUS_OPTIONS.find((item) => item.value === status)?.icon || "●"}
          </span>
          <select value={status} onChange={(event) => onStatusChange(event.target.value)} aria-label="Set your presence status">
            {STATUS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </span>
      </label>
    </section>
  );
}
