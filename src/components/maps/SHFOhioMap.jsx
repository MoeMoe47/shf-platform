import React, { useState } from "react";
import "./shf-ohio-map.css";

const COUNTY_POINTS = [
  { name: "Franklin", x: 52, y: 58, active: true },
  { name: "Cuyahoga", x: 70, y: 20 },
  { name: "Hamilton", x: 38, y: 78 },
  { name: "Summit", x: 66, y: 32 },
  { name: "Montgomery", x: 45, y: 68 },
  { name: "Lucas", x: 72, y: 8 },
];

export default function SHFOhioMap() {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="shf-map-root">

      <img
        src="/assets/maps/ohio-base.png"
        className="shf-map-base"
        alt="Ohio Map"
      />

      <div className="shf-map-grid" />

      {COUNTY_POINTS.map((c) => (
        <div
          key={c.name}
          className={`shf-node ${c.active ? "active" : ""}`}
          style={{ left: `${c.x}%`, top: `${c.y}%` }}
          onMouseEnter={() => setHovered(c)}
          onMouseLeave={() => setHovered(null)}
        >
          <div className="shf-node-core" />
          <div className="shf-node-pulse" />
        </div>
      ))}

      {hovered && (
        <div className="shf-map-tooltip">
          <strong>{hovered.name} County</strong>
          <div>Programs Active: 5</div>
          <div>People Served: 3,824</div>
          <div>Funding: $4.5M</div>
          <div>Outcome: 82%</div>
        </div>
      )}
    </div>
  );
}
