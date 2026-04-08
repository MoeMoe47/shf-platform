import React from "react";
import "./OhioMap.css";

export default function OhioCountyGeoLayer() {
  const isActive = feature?.properties?.NAME === "Franklin County";

return (
    <div className="map-root">

      {/* 🔥 BASE TEXTURE */}
      <img
        src="/textures/ohio-neutral-base.png"
        className="map-base"
        alt="Ohio Terrain"
      />

      {/* 🔥 COUNTY LINES */}
      <svg
        viewBox="0 0 1000 600"
        className="map-svg"
      >
        {/* your existing county paths go here */}
      </svg>

      {/* 🔥 GLOW LAYER (future dynamic) */}
      <div className="map-glow" />

    </div>
  );
}
