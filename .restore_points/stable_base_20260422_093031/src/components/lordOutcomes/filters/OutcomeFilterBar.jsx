// src/components/lordOutcomes/filters/OutcomeFilterBar.jsx
import React from "react";

export default function OutcomeFilterBar({
  states,
  selectedState,
  onStateChange,
  label = "State",
}) {
  const options = [{ code: "ALL", name: "All States" }, ...(states || [])];

  return (
    <div className="lord-filter-bar">
      <span className="lord-filter-label">{label}</span>
      <select
        className="lord-filter-select"
        value={selectedState}
        onChange={(e) => onStateChange(e.target.value)}
      >
        {options.map((s) => (
          <option key={s.code} value={s.code}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}
