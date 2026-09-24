import React, { useCallback, useRef } from "react";
import {
  isProgressOccluded,
  sampleRouteSpline,
} from "@/system/metaverse/traffic/metaverseTrafficAuthoringModel.js";
import { publicAssetUrl } from "@/system/metaverse/metaverseNavigationModel.js";

// MET-16A — Manual Traffic Authoring Tool: in-world overlay.
//
// Mounted inside the SAME transformed box `MetaverseCamera.jsx` uses for
// `.met-camera__world`/`.met-camera__markers` (via MetaverseLivingCityLayer,
// exactly like MetaverseRoadTraceDebugLayer/MetaverseRiverFlowDebugLayer),
// with `viewBox="0 0 100 100"` so its own coordinate space IS the shared
// live-city scene-percentage coordinate system — no separate projection
// math, no separate static-image viewer. A click here is converted to a
// scene x/y via this SVG element's own `getBoundingClientRect()`, which
// reflects the city's current pan/zoom because it is the same transformed
// element the background image and every marker already use.
//
// LOCKED PRINCIPLE: this component only records what the owner clicks. It
// never inspects the background image, infers a road, or auto-generates
// points — see metaverseTrafficAuthoringModel.js for the full note.
//
// Dev-build + explicit `?trafficAuthor=1` gated (see resolveTrafficAuthoringEnabled
// in the model and MetaverseLivingCityLayer.jsx) — never rendered for a
// normal learner or in a production build.

const START_COLOR = "#4ade80";
const END_COLOR = "#f87171";
const HANDLE_COLOR = "#f8fafc";
const ROUTE_COLOR = "#f59e0b";
const GHOST_COLOR = "#38bdf8";
const OCCLUSION_PENDING_COLOR = "#c4b5fd";


function toSvgPoints(points) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

// Splits a sampled spline into alternating visible/hidden runs based on each
// sample's own progress along total arc length, so occluded stretches can
// render as a dashed line without affecting the underlying route geometry.
function splitByOcclusion(samples, occlusionSegments) {
  if (!occlusionSegments?.length) return [{ hidden: false, points: samples }];
  const cumulative = [0];
  for (let i = 1; i < samples.length; i += 1) {
    cumulative.push(cumulative[i - 1] + Math.hypot(samples[i].x - samples[i - 1].x, samples[i].y - samples[i - 1].y));
  }
  const total = cumulative[cumulative.length - 1] || 1;
  const runs = [];
  let current = null;
  samples.forEach((sample, index) => {
    const t = cumulative[index] / total;
    const hidden = isProgressOccluded(occlusionSegments, t);
    if (!current || current.hidden !== hidden) {
      current = { hidden, points: [sample] };
      runs.push(current);
    } else {
      current.points.push(sample);
    }
  });
  return runs;
}

function RouteArrow({ point, headingDeg, color }) {
  return (
    <polygon
      points="0,-1.1 2.6,0 0,1.1"
      fill={color}
      transform={`translate(${point.x} ${point.y}) rotate(${headingDeg})`}
      vectorEffect="non-scaling-stroke"
    />
  );
}

function RenderedRoute({ route, isActive, controller, overlayOptions, onSelectHandle, onDragHandle }) {
  const { mode, selectedPointIndex, occlusionPick, ghostPosition } = controller;
  const { showRouteLine, showControlPoints, showGhost } = overlayOptions;
  const samples = sampleRouteSpline(route.points);
  const runs = isActive ? splitByOcclusion(samples, route.occlusion_segments) : [{ hidden: false, points: samples }];
  const canEdit = isActive && mode === "EDIT";
  const opacity = isActive ? 1 : 0.35;

  return (
    <g data-route-id={route.id} data-route-status={route.status} opacity={opacity}>
      {showRouteLine &&
        runs.map((run, index) => (
          <polyline
            key={index}
            points={toSvgPoints(run.points)}
            fill="none"
            stroke={ROUTE_COLOR}
            strokeWidth={0.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={run.hidden ? "1.4 1" : undefined}
            vectorEffect="non-scaling-stroke"
          />
        ))}

      {showRouteLine && samples.length >= 2 && [0.15, 0.5, 0.85].map((t) => {
        const index = Math.min(samples.length - 1, Math.round(t * (samples.length - 1)));
        const a = samples[Math.max(0, index - 1)];
        const b = samples[index];
        const headingDeg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
        return <RouteArrow key={t} point={b} headingDeg={headingDeg} color={isActive ? ROUTE_COLOR : "#9ca3af"} />;
      })}

      {isActive && showControlPoints &&
        route.points.map((point, index) => {
          const isStart = index === 0;
          const isEnd = index === route.points.length - 1 && route.points.length > 1;
          const isSelected = selectedPointIndex === index;
          const color = isStart ? START_COLOR : isEnd ? END_COLOR : HANDLE_COLOR;
          return (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={isSelected ? 1.6 : 1.1}
              fill={color}
              stroke={isSelected ? "#f59e0b" : "#0f172a"}
              strokeWidth={0.25}
              vectorEffect="non-scaling-stroke"
              style={{ cursor: canEdit ? "grab" : "default", pointerEvents: canEdit ? "auto" : "none" }}
              onPointerDown={(event) => {
                event.stopPropagation();
                onSelectHandle(index);
                if (!canEdit) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                const move = (moveEvent) => onDragHandle(index, moveEvent);
                const up = (upEvent) => {
                  onDragHandle(index, upEvent);
                  window.removeEventListener("pointermove", move);
                  window.removeEventListener("pointerup", up);
                };
                window.addEventListener("pointermove", move);
                window.addEventListener("pointerup", up);
              }}
            />
          );
        })}

      {isActive && mode === "OCCLUSION" && occlusionPick.startT !== null ? (
        <PendingOcclusionMarker points={route.points} t={occlusionPick.startT} />
      ) : null}

      {isActive && showGhost && ghostPosition ? (
        <circle
          cx={ghostPosition.x}
          cy={ghostPosition.y}
          r={1.3 * (ghostPosition.scale || 1)}
          fill={GHOST_COLOR}
          opacity={ghostPosition.occluded ? 0.15 : 0.95}
          stroke="#0f172a"
          strokeWidth={0.25}
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
    </g>
  );
}

// Renders the in-progress occlusion "start" marker while the owner is
// picking the segment end — a plain sampled-spline lookup, not a new
// sampling method (the real arc-length-accurate sampling lives in the
// model's sampleRouteAtProgress, used by the ghost marker above).
function PendingOcclusionMarker({ points, t }) {
  if (!points || points.length < 2) return null;
  const samples = sampleRouteSpline(points);
  const index = Math.round(t * (samples.length - 1));
  const point = samples[Math.max(0, Math.min(samples.length - 1, index))];
  if (!point) return null;
  return <circle cx={point.x} cy={point.y} r={1.4} fill="none" stroke={OCCLUSION_PENDING_COLOR} strokeWidth={0.4} vectorEffect="non-scaling-stroke" />;
}

// MET-16B real-vehicle-assets patch — a real, moving vehicle marker driven
// entirely by useMetaverseTrafficLivePreview's per-frame appearance
// (position, smoothed + base-rotation-corrected heading, combined
// perspective x global preview scale, occlusion, and the per-route vehicle
// asset/footprint it already resolved). This component only draws what it
// is given; it never samples the route or picks a vehicle class itself.
function VehicleMarker({ vehicle }) {
  if (vehicle.occluded) return null;
  const scale = vehicle.scale || 1;
  const length = (vehicle.vehicleLength || 2.3) * scale;
  const width = (vehicle.vehicleWidth || 1.05) * scale;
  const assetHref = vehicle.vehicleAsset ? publicAssetUrl(vehicle.vehicleAsset) : null;
  return (
    <g
      transform={`translate(${vehicle.x} ${vehicle.y}) rotate(${vehicle.headingDeg})`}
      data-vehicle-route-id={vehicle.routeId}
      data-vehicle-type={vehicle.vehicleType}
      data-perspective-calibrated={vehicle.perspectiveCalibrated ? "true" : "false"}
    >
      {/* Section 7 — a restrained, non-directional ground-contact shadow.
          Omit-if-it-hurts-alignment was the instruction; a plain low-opacity
          ellipse under the footprint reads as "grounded" without any
          lighting-direction math. */}
      <ellipse cx={0} cy={0} rx={length * 0.55} ry={width * 0.55} fill="#000000" opacity={0.22} />
      {assetHref ? (
        <image
          href={assetHref}
          x={-length / 2}
          y={-width / 2}
          width={length}
          height={width}
          preserveAspectRatio="none"
        />
      ) : (
        // Defensive fallback only — should be unreachable, since every
        // TRAFFIC_PREVIEW_VEHICLE_VISUALS entry carries an asset path.
        <rect x={-length / 2} y={-width / 2} width={length} height={width} rx={width * 0.3} fill="#1f2937" />
      )}
      {!vehicle.perspectiveCalibrated ? (
        // Section 9 — "PERSPECTIVE NOT CALIBRATED": a visible dashed amber
        // outline around the asset rather than a silent, unflagged fallback
        // scale (the fallback scale value itself lives in the model).
        <rect
          x={-length / 2}
          y={-width / 2}
          width={length}
          height={width}
          rx={width * 0.3}
          fill="none"
          stroke="#facc15"
          strokeWidth={0.3}
          strokeDasharray="0.4 0.3"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
    </g>
  );
}

const DEFAULT_OVERLAY_OPTIONS = { showRouteLine: true, showControlPoints: true, showGhost: false };

export default function MetaverseTrafficAuthoringOverlay({ controller, previewController = null }) {
  const svgRef = useRef(null);

  const sceneCoordinatesFromEvent = useCallback((event) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    return { x, y };
  }, []);

  if (!controller || !controller.enabled) return null;

  const { mode, activeRoute, routes, showAllRoutes, actions } = controller;
  const interactive = mode === "DRAW" || mode === "EDIT" || mode === "OCCLUSION" || mode === "PERSPECTIVE";

  const handleBackgroundPointerDown = (event) => {
    const coords = sceneCoordinatesFromEvent(event);
    if (!coords || !activeRoute) return;
    if (mode === "DRAW") {
      actions.addPoint(coords.x, coords.y);
    } else if (mode === "OCCLUSION") {
      actions.pickOcclusionPoint(coords.x, coords.y);
    } else if (mode === "PERSPECTIVE") {
      actions.captureProgressFromClick(coords.x, coords.y);
    } else if (mode === "EDIT") {
      actions.setSelectedPointIndex(null);
    }
  };

  const handleDragHandle = (index, event) => {
    const coords = sceneCoordinatesFromEvent(event);
    if (!coords) return;
    if (event.shiftKey) {
      // Lightweight manual helper (no image recognition/AI): Shift
      // constrains the drag to the point's original horizontal line.
      const original = activeRoute.points[index];
      actions.moveActivePoint(index, coords.x, original.y);
      return;
    }
    actions.moveActivePoint(index, coords.x, coords.y);
  };

  const visibleRoutes = showAllRoutes ? routes : routes.filter((route) => route.id === activeRoute?.id);
  const overlayOptions = previewController
    ? {
        showRouteLine: previewController.showRouteLine,
        showControlPoints: previewController.showControlPoints,
        showGhost: previewController.showGhost,
      }
    : DEFAULT_OVERLAY_OPTIONS;
  // Section 18 — draft routes remain fully testable, but must visibly warn
  // while a vehicle is actually previewing on them.
  const draftRouteIdsInPreview = new Set(
    (previewController?.activeRoutes || []).filter((route) => route.status === "DRAFT").map((route) => route.id),
  );

  return (
    <div className="met-living-layer met-traffic-author" aria-hidden="true" data-dev-only="true" data-mode={mode}>
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="met-traffic-author__svg"
        style={{ pointerEvents: interactive ? "auto" : "none" }}
        onPointerDown={handleBackgroundPointerDown}
      >
        {visibleRoutes.map((route) => (
          <RenderedRoute
            key={route.id}
            route={route}
            isActive={route.id === activeRoute?.id}
            controller={controller}
            overlayOptions={overlayOptions}
            onSelectHandle={(index) => actions.setSelectedPointIndex(index)}
            onDragHandle={handleDragHandle}
          />
        ))}
        {/* MET-16B live vehicles — a flat list already carrying routeId, so
            it renders independently of visibleRoutes/showAllRoutes: a
            vehicle previews on whatever routes the Live Traffic Preview
            scope selected, even if the authoring panel is only showing the
            active route's geometry. */}
        {previewController?.showRealVehicle
          ? previewController.renderedVehicles.map((vehicle) => <VehicleMarker key={vehicle.key} vehicle={vehicle} />)
          : null}
      </svg>
      {/* Route name/status labels render as HTML, not SVG <text>, because
          preserveAspectRatio="none" on a non-square viewBox stretches SVG
          text glyphs non-uniformly (huge and distorted) — the same reason
          MetaverseRoadTraceDebugLayer/MetaverseRiverFlowDebugLayer render
          their labels as an absolutely-positioned HTML list instead. */}
      <ul className="met-traffic-author__labels">
        {visibleRoutes
          .filter((route) => route.points.length)
          .map((route) => (
            <li
              key={route.id}
              className="met-traffic-author__label"
              style={{ left: `${route.points[0].x}%`, top: `${route.points[0].y}%` }}
              data-active={route.id === activeRoute?.id ? "true" : "false"}
            >
              {route.name} — {route.status}
              {draftRouteIdsInPreview.has(route.id) ? (
                <span className="met-traffic-author__draft-warning"> — DRAFT ROUTE — NOT READY FOR PRODUCTION</span>
              ) : null}
            </li>
          ))}
      </ul>
    </div>
  );
}
