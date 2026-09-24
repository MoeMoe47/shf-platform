import React from "react";

export default function MetaversePresenceOverlayLayer({ counts = [], districts = [] }) {
  const aggregateCounts = counts.filter((count) => Number(count.count || count.participant_count || 0) > 0);
  if (!aggregateCounts.length) return null;
  return (
    <div className="met-living-layer met-living-layer--presence" aria-label="Aggregate presence markers">
      {aggregateCounts.slice(0, 6).map((count) => {
        const districtId = count.district_id || count.districtId;
        const district = districts.find((item) => item.id === districtId);
        if (!district) return null;
        const aggregate = count.count || count.participant_count;
        return (
          <span
            key={districtId}
            className="met-living-presence"
            style={{ left: `${district.x}%`, top: `${district.y}%` }}
            data-state-classification="SOURCE_BACKED"
            aria-label={`${district.label}: ${aggregate} aggregate presence`}
          />
        );
      })}
    </div>
  );
}
