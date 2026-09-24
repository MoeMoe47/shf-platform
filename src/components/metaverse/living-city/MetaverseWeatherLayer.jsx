import React from "react";

export default function MetaverseWeatherLayer({ weather = "CLEAR", reducedMotion = false }) {
  if (weather === "CLEAR") return null;
  return (
    <div
      className="met-living-layer met-living-layer--weather"
      data-weather={weather.toLowerCase()}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      data-state-classification="DECORATIVE"
      aria-hidden="true"
    />
  );
}
