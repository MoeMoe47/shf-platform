import React from "react";

export default function MetaverseTimeOfDayLayer({ timeOfDay = "DUSK" }) {
  return (
    <div
      className="met-living-layer met-living-layer--time"
      data-time-of-day={timeOfDay.toLowerCase()}
      data-state-classification="DECORATIVE"
      aria-hidden="true"
    />
  );
}
