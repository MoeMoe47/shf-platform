import React from "react";

function hasRealActivity(effect, activity = {}) {
  if (effect.source === "opportunity_count") return (activity.opportunityCountsByFacility?.[effect.facilityId] || 0) > 0;
  if (effect.source === "market_activity") return (activity.marketCountsByFacility?.[effect.facilityId] || 0) > 0;
  if (effect.source === "simulation_activity") return (activity.missionCountsByFacility?.[effect.facilityId] || 0) > 0;
  if (effect.source === "enterprise_activity") return (activity.enterpriseCountsByFacility?.[effect.facilityId] || 0) > 0;
  if (effect.source === "civic_state") return Boolean(activity.civicActive);
  return false;
}

export default function MetaverseBuildingActivityLayer({ effects = [], activity = {} }) {
  if (!effects.length) return null;
  return (
    <div className="met-living-layer met-living-layer--buildings" aria-label="Source-backed building activity markers">
      {effects.map((effect) => {
        const active = hasRealActivity(effect, activity);
        return (
          <span
            key={`${effect.facilityId}:${effect.kind}`}
            className={`met-living-building met-living-building--${effect.kind}`}
            style={{ left: `${effect.x}%`, top: `${effect.y}%` }}
            data-active={active ? "true" : "false"}
            data-state-classification={effect.stateClassification}
            aria-label={active ? `${effect.facilityId.replace(/-/g, " ")} has source-backed activity` : `${effect.facilityId.replace(/-/g, " ")} ambient marker`}
          />
        );
      })}
    </div>
  );
}
