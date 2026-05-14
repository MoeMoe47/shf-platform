import React from "react";

export default function ImpactGuidancePanel({ guidanceGroups = [] }) {
  return (
    <div className="shf-panel shf-analyst-panel">
      <div className="shf-panel__header">
        <div>
          <h2>Impact Guidance</h2>
          <p className="shf-panel__helper">
            AI-assisted recommendations for follow-up, reporting, and opportunity.
          </p>
        </div>
      </div>

      <div className="shf-analyst-panel__section-title">Priority Guidance</div>

      <div className="shf-guidance-groups">
        {guidanceGroups.map((group) => (
          <div key={group.title} className="shf-guidance-group">
            <div className="shf-guidance-group__title">{group.title}</div>
            <ul className="shf-guidance-list">
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
