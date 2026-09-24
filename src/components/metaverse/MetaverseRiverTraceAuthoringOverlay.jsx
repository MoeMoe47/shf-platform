import React, { useCallback, useRef } from "react";
import { getRiverRenderSamples, sampleRiverAtProgress } from "@/system/metaverse/metaverseRiverTraceModel.js";

const GEOMETRY_COLORS = { CENTERLINE: "#67e8f9", LEFT_BANK: "#a5f3fc", RIGHT_BANK: "#38bdf8" };

function toSvgPoints(points) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function DirectionIndicators({ points }) {
  if (points.length < 2) return null;
  return Array.from({ length: 12 }, (_, index) => {
    const sample = sampleRiverAtProgress(points, (index + 1) / 13);
    if (!sample) return null;
    return (
      <polygon
        key={`direction-${index}`}
        points="0,-0.8 1.8,0 0,0.8"
        fill="#d9faff"
        opacity="0.76"
        transform={`translate(${sample.x} ${sample.y}) rotate(${sample.headingDeg})`}
        vectorEffect="non-scaling-stroke"
        data-river-direction="true"
      />
    );
  });
}

function FlowParticles({ particles }) {
  return particles.map((particle) => (
    <line
      key={particle.id}
      x1={particle.x - Math.cos((particle.headingDeg * Math.PI) / 180) * 0.9}
      y1={particle.y - Math.sin((particle.headingDeg * Math.PI) / 180) * 0.9}
      x2={particle.x + Math.cos((particle.headingDeg * Math.PI) / 180) * (particle.zoneType === "RAPIDS" ? 1.5 : 1.1)}
      y2={particle.y + Math.sin((particle.headingDeg * Math.PI) / 180) * (particle.zoneType === "RAPIDS" ? 1.5 : 1.1)}
      stroke={particle.zoneType === "RAPIDS" ? "#ffffff" : "#a5f3fc"}
      strokeWidth={particle.zoneType === "RAPIDS" ? 0.48 : 0.34}
      strokeLinecap="round"
      opacity={particle.zoneType === "RAPIDS" ? 0.92 : 0.58}
      vectorEffect="non-scaling-stroke"
      data-river-particle="true"
      data-zone-type={particle.zoneType}
    />
  ));
}

export default function MetaverseRiverTraceAuthoringOverlay({
  enabled,
  mode,
  state,
  geometryType,
  selectedPointIndex,
  onAddPoint,
  onSelectPoint,
  onMovePoint,
  onDeletePoint,
  onPickProgress,
  previewController,
}) {
  const svgRef = useRef(null);
  const draggingIndexRef = useRef(null);
  const points = geometryType === "CENTERLINE" ? state.centerline : geometryType === "LEFT_BANK" ? state.banks.left : state.banks.right;

  const sceneCoordinatesFromEvent = useCallback((event) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect?.width || !rect?.height) return null;
    return { x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 };
  }, []);

  const beginPointDrag = (event, index) => {
    if (mode !== "TRACE") return;
    event.stopPropagation();
    onSelectPoint(index);
    draggingIndexRef.current = index;
    svgRef.current?.setPointerCapture?.(event.pointerId);
  };

  if (!enabled) return null;
  const centerlineSamples = getRiverRenderSamples(state.centerline);
  const lineSamples = getRiverRenderSamples(points);
  return (
    <div className="met-river-trace-author" data-dev-only="true" data-mode={mode} data-geometry-type={geometryType} data-zone-type={state.zones.length ? state.zones[state.zones.length - 1].type : "NONE"}>
      <svg
        ref={svgRef}
        className="met-river-trace-author__svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ pointerEvents: mode === "TRACE" || mode === "ZONE" ? "auto" : "none" }}
        onPointerDown={(event) => {
          event.stopPropagation();
          const point = sceneCoordinatesFromEvent(event);
          if (!point) return;
          if (mode === "TRACE") onAddPoint(point);
        }}
        onPointerMove={(event) => {
          if (draggingIndexRef.current === null || mode !== "TRACE") return;
          const point = sceneCoordinatesFromEvent(event);
          if (point) onMovePoint(draggingIndexRef.current, point);
        }}
        onPointerUp={(event) => {
          if (mode === "ZONE") {
            const point = sceneCoordinatesFromEvent(event);
            if (point) onPickProgress(point);
          }
          draggingIndexRef.current = null;
        }}
        onPointerCancel={() => { draggingIndexRef.current = null; }}
        onKeyDown={(event) => {
          if (event.key === "Delete" || event.key === "Backspace") {
            event.preventDefault();
            if (selectedPointIndex !== null) onDeletePoint();
          }
        }}
        tabIndex={mode === "TRACE" || mode === "ZONE" ? 0 : -1}
      >
        {previewController?.showBanks && state.banks.left.length > 1 ? <polyline points={toSvgPoints(getRiverRenderSamples(state.banks.left))} fill="none" stroke="#a5f3fc" strokeWidth="0.3" strokeDasharray="1.2 0.8" opacity="0.7" vectorEffect="non-scaling-stroke" data-river-bank="left" /> : null}
        {previewController?.showBanks && state.banks.right.length > 1 ? <polyline points={toSvgPoints(getRiverRenderSamples(state.banks.right))} fill="none" stroke="#38bdf8" strokeWidth="0.3" strokeDasharray="1.2 0.8" opacity="0.7" vectorEffect="non-scaling-stroke" data-river-bank="right" /> : null}
        {centerlineSamples.length > 1 ? <polyline points={toSvgPoints(centerlineSamples)} fill="none" stroke="#67e8f9" strokeWidth="0.55" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" vectorEffect="non-scaling-stroke" data-river-centerline="true" /> : null}
        {previewController?.showDirection ? <DirectionIndicators points={state.centerline} /> : null}
        {previewController?.showIndicators ? <FlowParticles particles={previewController.particles} /> : null}
        {state.zones.map((zone) => {
          const start = sampleRiverAtProgress(state.centerline, zone.startT);
          const end = sampleRiverAtProgress(state.centerline, zone.endT);
          if (!start || !end) return null;
          return <g key={zone.id} data-river-zone={zone.type}><circle cx={start.x} cy={start.y} r="1" fill={zone.type === "RAPIDS" ? "#fff" : "#fbbf24"} vectorEffect="non-scaling-stroke" /><circle cx={end.x} cy={end.y} r="1" fill={zone.type === "RAPIDS" ? "#fff" : "#fbbf24"} vectorEffect="non-scaling-stroke" /></g>;
        })}
        {lineSamples.length > 1 && geometryType !== "CENTERLINE" ? <polyline points={toSvgPoints(lineSamples)} fill="none" stroke={GEOMETRY_COLORS[geometryType]} strokeWidth="0.48" strokeDasharray="1.2 0.8" vectorEffect="non-scaling-stroke" /> : null}
        {points.map((point, index) => (
          <circle
            key={`${geometryType}-${point.x}-${point.y}-${index}`}
            cx={point.x}
            cy={point.y}
            r={selectedPointIndex === index ? 1.5 : 1}
            fill={index === 0 ? "#4ade80" : selectedPointIndex === index ? "#fef08a" : "#f8fafc"}
            stroke={GEOMETRY_COLORS[geometryType]}
            strokeWidth="0.35"
            vectorEffect="non-scaling-stroke"
            data-river-point-index={index}
            onPointerDown={(event) => beginPointDrag(event, index)}
          />
        ))}
      </svg>
    </div>
  );
}
