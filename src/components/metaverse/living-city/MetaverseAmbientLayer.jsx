import React from "react";

export default function MetaverseAmbientLayer({ effects = [], weather = "CLEAR", timeOfDay = "DUSK", performanceMode = "STANDARD" }) {
  if (!effects.length) return null;
  return (
    <div
      className="met-living-layer met-living-layer--ambient"
      aria-hidden="true"
      data-weather={weather.toLowerCase()}
      data-time-of-day={timeOfDay.toLowerCase()}
      data-performance-mode={performanceMode}
    >
      {effects.map((effect) => (
        <span
          key={effect.effectId}
          className={`met-living-ambient met-living-ambient--${effect.type.toLowerCase().replace(/_/g, "-")}`}
          data-state-classification={effect.stateClassification}
        />
      ))}
    </div>
  );
}
