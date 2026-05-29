import React from "react";

export default function ReportsBriefingsPanel({ items = [], onExportClick }) {
  return (
    <div className="shf-panel shf-reports-briefings" data-tour-section="reports">
      <div className="shf-panel__header">
        <h2>Reports & Briefings</h2>
        <span className="shf-panel__small-label">Last 12 Months</span>
      </div>

      <div className="shf-export-list">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            className="shf-export-row"
            onClick={() => onExportClick?.(item)}
          >
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </button>
        ))}
      </div>
    </div>
  );
}
