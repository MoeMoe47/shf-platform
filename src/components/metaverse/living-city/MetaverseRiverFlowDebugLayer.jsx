import React from "react";
import {
  METAVERSE_WATER_EXCLUSION_ZONES,
  getRiverFlowPathsForScene,
  getWaterZonesForScene,
  resolveWaterZoneGeometryPoints,
} from "@/system/metaverse/metaverseRiverFlowRegistry.js";
import { getRoadTraceById } from "@/system/metaverse/metaverseRoadTraceRegistry.js";
import { resolvePolylinePosition } from "@/system/metaverse/metaverseVehicleMotion.js";

const ZONE_TYPE_COLORS = {
  RAPIDS_ZONE: "#38bdf8",
  TURBULENCE_ZONE: "#a78bfa",
  CALM_WATER: "#67e8f9",
  FLOWING_WATER: "#0ea5e9",
  BRIDGE_DISTURBANCE: "#f59e0b",
  NO_EFFECT_BUFFER: "#f87171",
};

const FLOW_TYPE_COLORS = {
  MAIN_FLOW: "#38bdf8",
  SECONDARY_FLOW: "#7dd3fc",
  RAPIDS_FLOW: "#facc15",
  TURBULENCE_FLOW: "#c4b5fd",
};

function toSvgPoints(points) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

// A small static triangle at a flow path's end point, rotated to the
// path's own heading — "flow direction arrows" per MET-15E1 Phase 14.
// Static only (no animation) — this is inspection tooling, not the actual
// water-motion presentation (see MetaverseRiverMotionLayer for that).
function FlowArrow({ path, color }) {
  if (path.points.length < 2) return null;
  const end = path.points[path.points.length - 1];
  const heading = resolvePolylinePosition(path.points, 1)?.headingDeg ?? 0;
  return (
    <polygon
      points="0,-1.1 2.4,0 0,1.1"
      fill={color}
      transform={`translate(${end.x} ${end.y}) rotate(${heading})`}
      data-flow-arrow-for={path.id}
    />
  );
}

function exclusionRectPoints(exclusion) {
  if (exclusion.approxRegion) {
    const [x0, x1] = exclusion.approxRegion.x;
    const [y0, y1] = exclusion.approxRegion.y;
    return [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];
  }
  if (exclusion.pathId) return getRoadTraceById(exclusion.pathId)?.points || [];
  return [];
}

// Development-only visualization for verifying MET-15E0 river-flow/water-
// zone geometry against the production city plate. Never renders in a
// production build (import.meta.env.DEV is statically false there) and
// requires an explicit ?riverFlowDebug=1 opt-in even in development, so it
// never appears as ambient dashboard clutter — mirrors the MET-15B
// roadTraceDebug pattern exactly, as its own separately-toggleable concern.
// Purely decorative/inspection tooling — draws no authority, implements no
// water/rapids animation (every mark below is static).
export default function MetaverseRiverFlowDebugLayer({ sceneId, enabled }) {
  if (!import.meta.env.DEV || !enabled) return null;

  const zones = getWaterZonesForScene(sceneId);
  const flowPaths = getRiverFlowPathsForScene(sceneId);

  if (!zones.length && !flowPaths.length) return null;

  return (
    <div className="met-living-layer met-river-flow-debug" aria-hidden="true" data-dev-only="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="met-river-flow-debug__svg">
        {zones.map((zone) => {
          const points = resolveWaterZoneGeometryPoints(zone);
          if (points.length < 2) return null;
          const color = ZONE_TYPE_COLORS[zone.type] || "#ffffff";
          const isBand = zone.geometry.shape === "band";
          return (
            <polyline
              key={zone.id}
              points={toSvgPoints(points)}
              fill={isBand ? "none" : `${color}33`}
              stroke={color}
              strokeWidth={zone.type === "NO_EFFECT_BUFFER" ? 0.3 : 0.35}
              strokeDasharray={zone.type === "NO_EFFECT_BUFFER" || zone.type === "BRIDGE_DISTURBANCE" ? "1 0.8" : undefined}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              data-zone-id={zone.id}
              data-zone-type={zone.type}
              data-rapids-allowed={zone.rapidsAssetsAllowed ? "true" : "false"}
            />
          );
        })}
        {flowPaths.map((path) => {
          const color = FLOW_TYPE_COLORS[path.waterType] || "#ffffff";
          return (
            <g key={path.id}>
              <polyline
                points={toSvgPoints(path.points)}
                fill="none"
                stroke={color}
                strokeWidth={0.25}
                strokeDasharray="0.6 0.6"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                data-flow-path-id={path.id}
                data-water-type={path.waterType}
              />
              <FlowArrow path={path} color={color} />
            </g>
          );
        })}
        {METAVERSE_WATER_EXCLUSION_ZONES.map((exclusion) => {
          const points = exclusionRectPoints(exclusion);
          if (points.length < 2) return null;
          return (
            <polyline
              key={exclusion.id}
              points={toSvgPoints(points) + (exclusion.approxRegion ? ` ${points[0].x},${points[0].y}` : "")}
              fill="none"
              stroke="#f87171"
              strokeWidth={0.2}
              strokeDasharray="0.5 0.5"
              strokeOpacity={0.6}
              vectorEffect="non-scaling-stroke"
              data-exclusion-id={exclusion.id}
              data-excluded-as={exclusion.excludedAs}
            />
          );
        })}
      </svg>
      <ul className="met-river-flow-debug__labels">
        {zones.map((zone) => {
          const points = resolveWaterZoneGeometryPoints(zone);
          if (!points.length) return null;
          return (
            <li
              key={zone.id}
              className="met-river-flow-debug__label"
              style={{ left: `${points[0].x}%`, top: `${points[0].y}%` }}
              data-zone-id={zone.id}
            >
              {zone.id}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
