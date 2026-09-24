import React from "react";
import {
  METAVERSE_BUS_ROUTES,
  getBusRouteContinuityReport,
  getRoadTracesForScene,
  resolveBusRouteSegments,
} from "@/system/metaverse/metaverseRoadTraceRegistry.js";

const PATH_TYPE_COLORS = {
  FREEWAY: "#7adfc0",
  MAJOR_ROAD: "#66d9ff",
  DISTRICT_CONNECTOR: "#ffd27a",
  BRIDGE: "#f2b35b",
};

function colorForPathTypes(pathTypes) {
  return PATH_TYPE_COLORS[pathTypes?.[0]] || "#ffffff";
}

function toSvgPoints(points) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

// Development-only visualization for verifying MET-15B/15C road-trace and
// bus-route continuity alignment against the production city plate. Never
// renders in a production build (import.meta.env.DEV is statically false
// there) and requires an explicit ?roadTraceDebug=1 opt-in even in
// development, so it never appears as ambient dashboard clutter. Purely
// decorative/inspection tooling — draws no authority, grants no unlock, and
// implements no vehicle/bus/streak motion (every mark below is static).
export default function MetaverseRoadTraceDebugLayer({ sceneId, enabled }) {
  if (!import.meta.env.DEV || !enabled) return null;

  const roadTraces = getRoadTracesForScene(sceneId);
  const busRoutes = METAVERSE_BUS_ROUTES.filter((route) => route.sceneId === sceneId);

  if (!roadTraces.length && !busRoutes.length) return null;

  return (
    <div className="met-living-layer met-road-trace-debug" aria-hidden="true" data-dev-only="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="met-road-trace-debug__svg">
        {roadTraces.map((path) => (
          <g key={path.id} data-path-id={path.id} data-provisional={path.provisional ? "true" : "false"}>
            <polyline
              points={toSvgPoints(path.points)}
              fill="none"
              stroke={colorForPathTypes(path.pathTypes)}
              strokeWidth={path.pathTypes.includes("FREEWAY") ? 0.6 : 0.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity={path.provisional ? 0.45 : 1}
              strokeDasharray={path.provisional ? "0.8 0.8" : undefined}
              vectorEffect="non-scaling-stroke"
            />
            {/* MET-15H Task 16 — every real control point (traced waypoint),
                not just the polyline itself, so lane-centerline accuracy can
                be inspected point-by-point against the background. */}
            {path.points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r={0.35}
                fill={colorForPathTypes(path.pathTypes)}
                fillOpacity={0.9}
                vectorEffect="non-scaling-stroke"
                data-control-point-index={index}
              />
            ))}
          </g>
        ))}

        {busRoutes.map((route) => {
          const segments = resolveBusRouteSegments(route.id);
          const continuity = getBusRouteContinuityReport(route.id);
          return (
            <g key={route.id} data-bus-route-id={route.id} data-route-continuous={continuity.continuous ? "true" : "false"} data-route-provisional={route.provisional ? "true" : "false"}>
              {segments.map((segment, index) => (
                <polyline
                  key={`${route.id}-${index}`}
                  points={toSvgPoints(segment.points)}
                  fill="none"
                  stroke="#ff8ac2"
                  strokeWidth={0.28}
                  strokeDasharray="1.2 1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  data-segment-path-id={segment.pathId}
                  data-segment-direction={segment.direction}
                  data-segment-index={index}
                />
              ))}
              {/* Segment-boundary join markers: green = within continuity
                  tolerance, red = exceeds it (a real, honestly-reported gap
                  — see getBusRouteContinuityReport / provisional/reviewReason
                  on the route). Static circles only, no motion. */}
              {continuity.gaps.map((gap, index) => (
                gap.fromPoint && gap.toPoint ? (
                  <g key={`${route.id}-gap-${index}`} data-gap-index={index} data-gap-within-tolerance={gap.withinTolerance ? "true" : "false"}>
                    <circle cx={gap.fromPoint.x} cy={gap.fromPoint.y} r={0.6} fill={gap.withinTolerance ? "#4ade80" : "#f87171"} vectorEffect="non-scaling-stroke" />
                    <circle cx={gap.toPoint.x} cy={gap.toPoint.y} r={0.6} fill={gap.withinTolerance ? "#4ade80" : "#f87171"} vectorEffect="non-scaling-stroke" />
                    {!gap.withinTolerance ? (
                      <line
                        x1={gap.fromPoint.x} y1={gap.fromPoint.y} x2={gap.toPoint.x} y2={gap.toPoint.y}
                        stroke="#f87171" strokeWidth={0.2} strokeDasharray="0.4 0.4" vectorEffect="non-scaling-stroke"
                      />
                    ) : null}
                  </g>
                ) : null
              ))}
              {/* Route start marker (direction origin). */}
              {segments[0]?.points?.[0] ? (
                <circle cx={segments[0].points[0].x} cy={segments[0].points[0].y} r={0.9} fill="none" stroke="#ff8ac2" strokeWidth={0.3} vectorEffect="non-scaling-stroke" />
              ) : null}
            </g>
          );
        })}
      </svg>
      <ul className="met-road-trace-debug__labels">
        {roadTraces.map((path) => (
          <li
            key={path.id}
            className="met-road-trace-debug__label"
            style={{ left: `${path.points[0].x}%`, top: `${path.points[0].y}%` }}
            data-path-id={path.id}
          >
            {path.id}{path.provisional ? " (provisional)" : ""}
          </li>
        ))}
        {busRoutes.map((route) => {
          const first = route.segments[0];
          const firstPath = roadTraces.find((path) => path.id === first?.pathId);
          if (!firstPath) return null;
          const anchor = first.direction === "REVERSE" ? firstPath.points[firstPath.points.length - 1] : firstPath.points[0];
          const continuity = getBusRouteContinuityReport(route.id);
          return (
            <li
              key={route.id}
              className="met-road-trace-debug__label met-road-trace-debug__label--route"
              style={{ left: `${anchor.x}%`, top: `${anchor.y}%` }}
              data-bus-route-id={route.id}
            >
              {route.id}{route.provisional ? " (provisional)" : continuity.continuous ? " (continuous)" : " (gap!)"}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
