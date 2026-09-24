import React, { useEffect, useMemo, useRef, useState } from "react";
import RegionalCloudAtmosphereLayer from "@/components/metaverse/RegionalCloudAtmosphereLayer.jsx";
import RegionalForegroundDepthLayer from "@/components/metaverse/RegionalForegroundDepthLayer.jsx";
import RegionalOceanSurfaceLayer from "@/components/metaverse/RegionalOceanSurfaceLayer.jsx";
import useOceanMotionEditor from "@/hooks/metaverse/useOceanMotionEditor.js";
import {
  OCEAN_EDITOR_TOOLS,
  OCEAN_QUALITY_MODES,
  OCEAN_WEATHER_PRESETS,
  getOceanFlowRenderSamples,
  resolveCombinedOceanMotion,
  validateOceanSceneConfig,
} from "@/system/metaverse/oceanMotionEngine.js";
import { CLOUD_MOTION_PREVIEW_MODES, cloneCloudSceneConfig, OIL_RIG_DAY_CLOUD_PRESET } from "@/system/metaverse/regionalCloudAtmosphere.js";
import { getRegionalSceneBySlug } from "@/system/metaverse/regionalSceneRegistry.js";
import { publicAssetUrl } from "@/system/metaverse/metaverseNavigationModel.js";
import "./ocean-engine-dev.css";

const TOOL_LABELS = {
  SELECT: "Select",
  DRAW_FLOW: "Draw Flow",
  EDIT_FLOW: "Edit Flow",
  DRAW_TURBULENCE: "Turbulence",
  DRAW_FOAM: "Foam",
  DRAW_WAKE: "Wake",
  ADD_POINT: "Add Point",
  DELETE: "Delete",
};

const WIND_DIRECTION_PRESETS = [
  { label: "← West", value: 270 },
  { label: "→ East", value: 90 },
  { label: "↑ North", value: 0 },
  { label: "↓ South", value: 180 },
];

const CLOUD_MOTION_PREVIEW_LABELS = {
  NATURAL: "Natural",
  VISIBLE: "Visible",
  EXAGGERATED: "Exaggerated",
};

function createCloudPlaybackHome() {
  return {
    playing: true,
    timeScale: 1,
    restartKey: 0,
    motionPreview: "VISIBLE",
    ignoreReducedMotionForPreview: false,
  };
}

function numberValue(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function SceneCanvas({ config, playback, debug }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    const time = playback.time;
    const qualityStep = playback.quality === "Ultra" ? 10 : playback.quality === "High" ? 14 : playback.quality === "Medium" ? 20 : 28;
    const width = rect.width;
    const height = rect.height;

    ctx.globalCompositeOperation = "screen";
    for (let y = 0; y <= height; y += qualityStep) {
      const sceneY = (y / height) * 100;
      const depth = Math.max(0, Math.min(1, (sceneY - config.global.horizonY) / Math.max(1, config.global.foregroundY - config.global.horizonY)));
      for (let x = 0; x <= width; x += qualityStep) {
        const sceneX = (x / width) * 100;
        const sample = resolveCombinedOceanMotion(config, { x: sceneX, y: sceneY }, time);
        const alpha = Math.min(0.2, sample.opacity * 0.18 * (playback.reducedEffects ? 0.45 : 1));
        if (alpha <= 0.01) continue;
        const length = qualityStep * (0.55 + depth * 1.25 + Math.abs(sample.offsetY) * 0.09);
        ctx.strokeStyle = `rgba(180, 226, 245, ${alpha})`;
        ctx.lineWidth = 1 + depth * 0.65;
        ctx.beginPath();
        ctx.moveTo(x - sample.offsetX * 1.8, y - sample.offsetY);
        ctx.lineTo(x + length + sample.offsetX * 2.4, y + sample.offsetY * 1.8);
        ctx.stroke();
      }
    }

    if (config.shimmer.enabled && !playback.reducedEffects) {
      ctx.globalCompositeOperation = "lighter";
      const shimmerCount = Math.round(28 * config.shimmer.density * (playback.quality === "Low" ? 0.45 : playback.quality === "Ultra" ? 1.45 : 1));
      for (let i = 0; i < shimmerCount; i += 1) {
        const seed = i * 19.137;
        const sx = ((Math.sin(seed + time * config.shimmer.motionSpeed) * 0.5 + 0.5) * 0.9 + 0.05) * width;
        const sy = (0.34 + (Math.cos(seed * 0.73 + time * 0.08) * 0.5 + 0.5) * 0.48) * height;
        const flicker = 0.45 + Math.sin(time * 2.2 + seed) * config.shimmer.flickerAmount;
        ctx.strokeStyle = `rgba(245, 250, 255, ${Math.max(0, config.shimmer.brightness * 0.22 * flicker)})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(sx - 18 * config.shimmer.patchSize, sy);
        ctx.lineTo(sx + 34 * config.shimmer.patchSize, sy - 4);
        ctx.stroke();
      }
    }

    ctx.globalCompositeOperation = "screen";
    config.foamZones.filter((zone) => zone.enabled).forEach((zone) => {
      const cx = (zone.center.x / 100) * width;
      const cy = (zone.center.y / 100) * height;
      const rx = (zone.radiusX / 100) * width;
      const ry = (zone.radiusY / 100) * height;
      const drift = Math.sin(time * 0.45 + zone.center.x) * zone.stretch * 8;
      const gradient = ctx.createRadialGradient(cx + drift, cy, 0, cx + drift, cy, Math.max(rx, ry));
      gradient.addColorStop(0, `rgba(240, 250, 255, ${zone.opacity * zone.density * 0.38})`);
      gradient.addColorStop(0.55, `rgba(190, 226, 235, ${zone.opacity * 0.16})`);
      gradient.addColorStop(1, "rgba(190, 226, 235, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(cx + drift, cy, rx, ry, (zone.driftDirection * Math.PI) / 180, 0, Math.PI * 2);
      ctx.fill();
    });

    config.wakeZones.filter((zone) => zone.enabled).forEach((zone) => {
      const sx = (zone.sourcePosition.x / 100) * width;
      const sy = (zone.sourcePosition.y / 100) * height;
      const radians = (zone.direction * Math.PI) / 180;
      ctx.strokeStyle = `rgba(232, 244, 248, ${0.18 * zone.foamAmount})`;
      ctx.lineWidth = Math.max(1, zone.width * 0.16);
      for (let i = 0; i < 4; i += 1) {
        const offset = (i - 1.5) * zone.width * 1.7;
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(radians + Math.PI / 2) * offset, sy + Math.sin(radians + Math.PI / 2) * offset);
        ctx.lineTo(sx + Math.cos(radians) * 150 * zone.taper + offset * 0.8, sy + Math.sin(radians) * 70 * zone.taper);
        ctx.stroke();
      }
    });

    if (debug.enabled && debug.showVectors) {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(125, 211, 252, 0.72)";
      ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillText(`t=${playback.time.toFixed(2)}s fps=${playback.fps || "--"} quality=${playback.quality}`, 14, 22);
    }
  }, [config, debug, playback]);

  return <canvas ref={canvasRef} className="ocean-dev-scene__motion" aria-hidden="true" />;
}

function scenePointFromEvent(event, element) {
  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  return {
    x: Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100)),
    y: Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100)),
  };
}

function Overlay({ controller }) {
  const svgRef = useRef(null);
  const { config, tool, selection, debug, actions } = controller;
  const interactive = true;

  const pointFromEvent = (event) => {
    if (!svgRef.current) return null;
    return scenePointFromEvent(event, svgRef.current);
  };

  const handlePointerDown = (event) => {
    const point = pointFromEvent(event);
    if (!point) return;
    actions.handleScenePoint(point);
  };

  const startDragPoint = (event, path, index) => {
    event.stopPropagation();
    actions.selectEntity("flow", path.id, index);
    event.currentTarget.setPointerCapture(event.pointerId);
    const move = (moveEvent) => {
      const point = pointFromEvent(moveEvent);
      if (point) actions.moveFlowPoint(path.id, index, point);
    };
    const up = (upEvent) => {
      move(upEvent);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const startDragZone = (event, type, id) => {
    event.stopPropagation();
    actions.selectEntity(type, id);
    event.currentTarget.setPointerCapture(event.pointerId);
    const move = (moveEvent) => {
      const point = pointFromEvent(moveEvent);
      if (point) actions.moveZone(type, id, point);
    };
    const up = (upEvent) => {
      move(upEvent);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <svg
      ref={svgRef}
      className="ocean-dev-scene__overlay"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      data-tool={tool}
      style={{ pointerEvents: interactive ? "auto" : "none" }}
      onPointerDown={handlePointerDown}
      onPointerMove={(event) => {
        const point = pointFromEvent(event);
        if (point) actions.setCursor(point);
      }}
    >
      {debug.showFlow && config.flowPaths.map((path) => {
        const samples = getOceanFlowRenderSamples(path);
        const active = selection.type === "flow" && selection.id === path.id;
        return (
          <g key={path.id} opacity={path.enabled ? 1 : 0.28} data-active={active ? "true" : "false"}>
            <polyline
              points={samples.map((point) => `${point.x},${point.y}`).join(" ")}
              fill="none"
              stroke={path.color}
              strokeWidth={active ? 0.78 : 0.46}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              onPointerDown={(event) => {
                event.stopPropagation();
                actions.selectEntity("flow", path.id);
              }}
            />
            {debug.showInfluence ? (
              <polyline
                points={samples.map((point) => `${point.x},${point.y}`).join(" ")}
                fill="none"
                stroke={path.color}
                strokeWidth={path.width}
                opacity="0.08"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
            {debug.showArrows && samples.length > 3 ? [0.25, 0.5, 0.75].map((t) => {
              const index = Math.max(1, Math.min(samples.length - 1, Math.round(t * (samples.length - 1))));
              const a = samples[index - 1];
              const b = samples[index];
              const heading = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
              return <polygon key={t} points="0,-1 2.2,0 0,1" fill={path.color} transform={`translate(${b.x} ${b.y}) rotate(${heading})`} vectorEffect="non-scaling-stroke" />;
            }) : null}
            {path.points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r={selection.id === path.id && selection.pointIndex === index ? 1.35 : 0.9}
                fill={index === 0 ? "#86efac" : index === path.points.length - 1 ? "#fca5a5" : "#f8fafc"}
                stroke={active ? "#020617" : path.color}
                strokeWidth="0.22"
                vectorEffect="non-scaling-stroke"
                onPointerDown={(event) => startDragPoint(event, path, index)}
              />
            ))}
          </g>
        );
      })}

      {debug.showZones && config.foamZones.map((zone) => (
        <ellipse key={zone.id} cx={zone.center.x} cy={zone.center.y} rx={zone.radiusX} ry={zone.radiusY} fill="rgba(226, 246, 255, 0.1)" stroke="#dbeafe" strokeWidth="0.35" vectorEffect="non-scaling-stroke" onPointerDown={(event) => startDragZone(event, "foam", zone.id)} />
      ))}
      {debug.showZones && config.turbulenceZones.map((zone) => (
        <ellipse key={zone.id} cx={zone.center.x} cy={zone.center.y} rx={zone.radiusX} ry={zone.radiusY} fill="rgba(251, 191, 36, 0.08)" stroke="#fbbf24" strokeWidth="0.38" strokeDasharray="1 0.7" vectorEffect="non-scaling-stroke" onPointerDown={(event) => startDragZone(event, "turbulence", zone.id)} />
      ))}
      {debug.showZones && config.wakeZones.map((zone) => (
        <g key={zone.id} onPointerDown={(event) => startDragZone(event, "wake", zone.id)}>
          <circle cx={zone.sourcePosition.x} cy={zone.sourcePosition.y} r={2.1} fill="rgba(14, 165, 233, 0.18)" stroke="#7dd3fc" strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
          <line x1={zone.sourcePosition.x} y1={zone.sourcePosition.y} x2={zone.sourcePosition.x + Math.cos((zone.direction * Math.PI) / 180) * 11} y2={zone.sourcePosition.y + Math.sin((zone.direction * Math.PI) / 180) * 7} stroke="#7dd3fc" strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
        </g>
      ))}
    </svg>
  );
}

function Labels({ config, debug }) {
  if (!debug.enabled || !debug.showLabels) return null;
  const labels = [
    ...config.flowPaths.filter((item) => item.points[0]).map((item) => ({ id: item.id, label: item.label, point: item.points[0] })),
    ...config.foamZones.map((item) => ({ id: item.id, label: item.label, point: item.center })),
    ...config.turbulenceZones.map((item) => ({ id: item.id, label: item.label, point: item.center })),
    ...config.wakeZones.map((item) => ({ id: item.id, label: item.label, point: item.sourcePosition })),
  ];
  return (
    <ul className="ocean-dev-scene__labels">
      {labels.map((item) => (
        <li key={item.id} style={{ left: `${item.point.x}%`, top: `${item.point.y}%` }}>{item.label}</li>
      ))}
    </ul>
  );
}

function NumericField({ label, value, min = 0, max = 1, step = 0.01, onChange }) {
  return (
    <label className="ocean-field">
      <span>{label}</span>
      <input type="number" value={value} min={min} max={max} step={step} onChange={(event) => onChange(numberValue(event.target.value, value))} />
    </label>
  );
}

function RangeField({ label, value, min = 0, max = 1, step = 0.01, onChange }) {
  return (
    <label className="ocean-field ocean-field--range">
      <span>{label}</span>
      <input type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(numberValue(event.target.value, value))} />
      <b>{Number(value).toFixed(step < 0.1 ? 2 : 1)}</b>
    </label>
  );
}

function CloudDevPanel({ cloudConfig, cloudPlayback, cloudDebug, cloudMotionTrail, cloudSkyBounds, rigDepthMaskEnabled, rigDepthMaskDebug, reducedMotion, actions }) {
  const setConfig = (patch) => actions.setCloudConfig((current) => ({ ...current, ...patch }));
  const setLayerEnabled = (layerId, enabled) => {
    actions.setCloudConfig((current) => ({
      ...current,
      layers: current.layers.map((layer) => (layer.id === layerId ? { ...layer, enabled } : layer)),
    }));
  };
  return (
    <div className="ocean-dev-panel__section" data-cloud-dev-panel="true">
      <h2>Clouds — Oil Rig Day</h2>
      <label className="ocean-check">
        <input type="checkbox" checked={cloudConfig.enabled} onChange={(event) => setConfig({ enabled: event.target.checked })} />
        <span>On / Off</span>
      </label>
      <div className="ocean-dev-panel__row">
        <button type="button" data-active={cloudPlayback.playing ? "true" : "false"} onClick={() => actions.setCloudPlayback((current) => ({ ...current, playing: true }))}>Play</button>
        <button type="button" data-active={!cloudPlayback.playing ? "true" : "false"} onClick={() => actions.setCloudPlayback((current) => ({ ...current, playing: false }))}>Pause</button>
        <button type="button" onClick={() => actions.setCloudPlayback((current) => ({ ...current, restartKey: current.restartKey + 1 }))}>Restart</button>
        <button type="button" onClick={actions.resetClouds}>Reset</button>
      </div>
      <div className="ocean-dev-panel__row" role="group" aria-label="Cloud motion preview">
        {CLOUD_MOTION_PREVIEW_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            data-active={(cloudPlayback.motionPreview || "NATURAL") === mode ? "true" : "false"}
            onClick={() => actions.setCloudPlayback((current) => ({ ...current, motionPreview: mode }))}
          >
            {CLOUD_MOTION_PREVIEW_LABELS[mode]}
          </button>
        ))}
      </div>
      <div className="ocean-dev-panel__row" role="group" aria-label="Wind direction presets">
        {WIND_DIRECTION_PRESETS.map((preset) => (
          <button key={preset.value} type="button" onClick={() => setConfig({ windDirection: preset.value })}>{preset.label}</button>
        ))}
      </div>
      <RangeField label="Wind Direction" value={cloudConfig.windDirection} min={0} max={359} step={1} onChange={(value) => setConfig({ windDirection: value })} />
      <RangeField label="Wind Speed" value={cloudConfig.windSpeed} min={0} max={2} step={0.01} onChange={(value) => setConfig({ windSpeed: value })} />
      <RangeField label="Global Cloud Speed" value={cloudConfig.globalSpeed} min={0} max={2} step={0.01} onChange={(value) => setConfig({ globalSpeed: value })} />
      <RangeField label="Animation Speed" value={cloudPlayback.timeScale} min={0.1} max={4} step={0.05} onChange={(value) => actions.setCloudPlayback((current) => ({ ...current, timeScale: value }))} />
      <RangeField label="Cloud Density" value={cloudConfig.density} min={0} max={1} step={0.01} onChange={(value) => setConfig({ density: value })} />
      <RangeField label="Cloud Opacity" value={cloudConfig.globalOpacity} min={0} max={1.2} step={0.01} onChange={(value) => setConfig({ globalOpacity: value })} />
      <label className="ocean-check">
        <input type="checkbox" checked={cloudConfig.parallaxEnabled} onChange={(event) => setConfig({ parallaxEnabled: event.target.checked })} />
        <span>Parallax</span>
      </label>
      {cloudConfig.layers.map((layer) => (
        <label key={layer.id} className="ocean-check">
          <input type="checkbox" checked={layer.enabled} onChange={(event) => setLayerEnabled(layer.id, event.target.checked)} />
          <span>{layer.label}</span>
        </label>
      ))}
      <label className="ocean-check">
        <input type="checkbox" checked={cloudDebug} onChange={(event) => actions.setCloudDebug(event.target.checked)} />
        <span>Show cloud bounds/debug boxes</span>
      </label>
      <label className="ocean-check">
        <input type="checkbox" checked={cloudMotionTrail} onChange={(event) => actions.setCloudMotionTrail(event.target.checked)} />
        <span>Show Motion Trail</span>
      </label>
      <label className="ocean-check">
        <input type="checkbox" checked={cloudSkyBounds} onChange={(event) => actions.setCloudSkyBounds(event.target.checked)} />
        <span>Show Cloud Sky Bounds</span>
      </label>
      <label className="ocean-check">
        <input type="checkbox" checked={rigDepthMaskEnabled} onChange={(event) => actions.setRigDepthMaskEnabled(event.target.checked)} />
        <span>Rig Depth Mask</span>
      </label>
      <label className="ocean-check">
        <input type="checkbox" checked={rigDepthMaskDebug} onChange={(event) => actions.setRigDepthMaskDebug(event.target.checked)} />
        <span>Show rig mask bounds</span>
      </label>
      <p className="ocean-status">Reduced Motion: {reducedMotion ? "ON" : "OFF"}</p>
      {reducedMotion ? (
        <label className="ocean-check">
          <input
            type="checkbox"
            checked={cloudPlayback.ignoreReducedMotionForPreview}
            onChange={(event) => actions.setCloudPlayback((current) => ({ ...current, ignoreReducedMotionForPreview: event.target.checked }))}
          />
          <span>Ignore Reduced Motion for Preview</span>
        </label>
      ) : null}
      <p className="ocean-status">Preset: {cloudConfig.label}</p>
    </div>
  );
}

function LeftTools({ controller }) {
  const { tool, debug, actions } = controller;
  return (
    <aside className="ocean-dev-panel ocean-dev-panel--left" aria-label="Ocean editor tools">
      <div className="ocean-dev-panel__header">
        <span>Ocean Engine</span>
        <strong>DEV</strong>
      </div>
      <div className="ocean-tool-grid">
        {OCEAN_EDITOR_TOOLS.map((item) => (
          <button key={item} type="button" data-active={tool === item ? "true" : "false"} onClick={() => actions.setTool(item)}>
            {TOOL_LABELS[item]}
          </button>
        ))}
      </div>
      <div className="ocean-dev-panel__section">
        <h2>Layer Visibility</h2>
        {[
          ["showOceanMask", "Show ocean mask"],
          ["showDepthBands", "Show depth bands"],
          ["showFlow", "Flow debug"],
          ["showArrows", "Direction arrows"],
          ["showZones", "Zones"],
          ["showInfluence", "Influence extents"],
          ["showVectors", "Motion vectors"],
          ["showLabels", "Labels"],
          ["showLayerDebug", "Layer debug"],
        ].map(([key, label]) => (
          <label key={key} className="ocean-check">
            <input type="checkbox" checked={debug[key]} onChange={(event) => actions.setDebug({ ...debug, [key]: event.target.checked })} />
            <span>{label}</span>
          </label>
        ))}
      </div>
      <div className="ocean-dev-panel__section">
        <h2>View</h2>
        <button type="button" onClick={() => actions.setView({ zoom: 1, panX: 0, panY: 0 })}>Fit Scene</button>
        <button type="button" onClick={() => actions.setView({ zoom: 1, panX: 0, panY: 0 })}>Reset View</button>
      </div>
    </aside>
  );
}

function PropertiesPanel({ controller, cloudController }) {
  const { config, selection, selectedEntity, playback, importText, status, actions } = controller;
  const validation = useMemo(() => validateOceanSceneConfig(config), [config]);
  const patchSelected = (patch) => actions.updateSelected((item) => ({ ...item, ...patch }));

  return (
    <aside className="ocean-dev-panel ocean-dev-panel--right" aria-label="Ocean properties">
      <div className="ocean-dev-panel__header">
        <span>Properties</span>
        <strong>{selection.type}</strong>
      </div>

      <div className="ocean-dev-panel__section">
        <h2>Scene</h2>
        <label className="ocean-field">
          <span>Name</span>
          <input value={config.name} onChange={(event) => actions.commitConfig((current) => ({ ...current, name: event.target.value }))} />
        </label>
        <label className="ocean-field">
          <span>Weather preset</span>
          <select value={config.weatherPreset} onChange={(event) => actions.applyPreset(event.target.value)}>
            {OCEAN_WEATHER_PRESETS.map((preset) => <option key={preset}>{preset}</option>)}
          </select>
        </label>
        <RangeField label="Global speed" value={config.global.speed} min={0} max={3} step={0.05} onChange={(value) => actions.updateGlobal({ speed: value })} />
        <RangeField label="Global intensity" value={config.global.intensity} min={0} max={2} step={0.05} onChange={(value) => actions.updateGlobal({ intensity: value })} />
      </div>

      <div className="ocean-dev-panel__section" data-ocean-surface-controls="true">
        <h2>Ocean Surface</h2>
        <label className="ocean-check">
          <input type="checkbox" checked={config.surface.enabled} onChange={(event) => actions.commitConfig((current) => ({ ...current, surface: { ...current.surface, enabled: event.target.checked } }))} />
          <span>Ocean Renderer On / Off</span>
        </label>
        <div className="ocean-dev-panel__row" role="group" aria-label="Ocean flow direction presets">
          {WIND_DIRECTION_PRESETS.map((preset) => (
            <button key={preset.value} type="button" onClick={() => actions.updateGlobal({ flowDirection: preset.value })}>{preset.label}</button>
          ))}
        </div>
        <RangeField label="Flow Direction" value={config.global.flowDirection} min={0} max={359} step={1} onChange={(value) => actions.updateGlobal({ flowDirection: value })} />
        <RangeField label="Flow Speed" value={config.global.flowSpeed} min={0} max={3} step={0.01} onChange={(value) => actions.updateGlobal({ flowSpeed: value })} />
      </div>

      <div className="ocean-dev-panel__section" data-ocean-depth-controls="true">
        <h2>Depth</h2>
        <RangeField label="Perspective Influence" value={config.global.depthPerspective} min={0} max={1} step={0.01} onChange={(value) => actions.updateGlobal({ depthPerspective: value })} />
        <RangeField label="Horizon Suppression" value={config.global.horizonSuppression} min={0} max={1} step={0.01} onChange={(value) => actions.updateGlobal({ horizonSuppression: value })} />
      </div>

      <div className="ocean-dev-panel__section" data-ocean-renderer-controls="true">
        <h2>Renderer</h2>
        <RangeField label="Overall Displacement" value={config.global.displacementStrength} min={0} max={2} step={0.01} onChange={(value) => actions.updateGlobal({ displacementStrength: value })} />
        <label className="ocean-field">
          <span>Quality</span>
          <select value={playback.quality} onChange={(event) => actions.setPlayback({ ...playback, quality: event.target.value })}>
            {OCEAN_QUALITY_MODES.map((mode) => <option key={mode}>{mode}</option>)}
          </select>
        </label>
        <label className="ocean-check">
          <input type="checkbox" checked={playback.freezeRenderer} onChange={(event) => actions.setPlayback({ ...playback, freezeRenderer: event.target.checked })} />
          <span>Freeze</span>
        </label>
      </div>

      <CloudDevPanel {...cloudController} />

      {selectedEntity ? (
        <div className="ocean-dev-panel__section">
          <h2>{selectedEntity.label}</h2>
          <label className="ocean-field">
            <span>Label</span>
            <input value={selectedEntity.label} onChange={(event) => patchSelected({ label: event.target.value })} />
          </label>
          <label className="ocean-check">
            <input type="checkbox" checked={selectedEntity.enabled} onChange={(event) => patchSelected({ enabled: event.target.checked })} />
            <span>Enabled</span>
          </label>
          {selection.type === "flow" ? (
            <>
              <RangeField label="Speed" value={selectedEntity.speed} min={0} max={2} step={0.01} onChange={(value) => patchSelected({ speed: value })} />
              <RangeField label="Strength" value={selectedEntity.strength} min={0} max={2} step={0.01} onChange={(value) => patchSelected({ strength: value })} />
              <RangeField label="Width" value={selectedEntity.width} min={1} max={30} step={0.5} onChange={(value) => patchSelected({ width: value })} />
              <RangeField label="Feather" value={selectedEntity.feather} min={0} max={1} step={0.01} onChange={(value) => patchSelected({ feather: value })} />
            </>
          ) : null}
          {selection.type === "foam" ? (
            <>
              <RangeField label="Density" value={selectedEntity.density} min={0} max={1.5} step={0.01} onChange={(value) => patchSelected({ density: value })} />
              <RangeField label="Opacity" value={selectedEntity.opacity} min={0} max={1} step={0.01} onChange={(value) => patchSelected({ opacity: value })} />
              <RangeField label="Distortion" value={selectedEntity.distortion} min={0} max={2} step={0.01} onChange={(value) => patchSelected({ distortion: value })} />
              <RangeField label="Stretch" value={selectedEntity.stretch} min={0} max={2} step={0.01} onChange={(value) => patchSelected({ stretch: value })} />
            </>
          ) : null}
          {selection.type === "turbulence" ? (
            <>
              <RangeField label="Intensity" value={selectedEntity.intensity} min={0} max={2} step={0.01} onChange={(value) => patchSelected({ intensity: value })} />
              <RangeField label="Swirl" value={selectedEntity.swirlAmount} min={-2} max={2} step={0.01} onChange={(value) => patchSelected({ swirlAmount: value })} />
              <RangeField label="Foam boost" value={selectedEntity.foamBoost} min={0} max={2} step={0.01} onChange={(value) => patchSelected({ foamBoost: value })} />
              <RangeField label="Speed multiplier" value={selectedEntity.localSpeedMultiplier} min={0} max={3} step={0.01} onChange={(value) => patchSelected({ localSpeedMultiplier: value })} />
            </>
          ) : null}
          {selection.type === "wake" ? (
            <>
              <RangeField label="Width" value={selectedEntity.width} min={1} max={30} step={0.5} onChange={(value) => patchSelected({ width: value })} />
              <RangeField label="Amplitude" value={selectedEntity.amplitude} min={0} max={2} step={0.01} onChange={(value) => patchSelected({ amplitude: value })} />
              <RangeField label="Foam amount" value={selectedEntity.foamAmount} min={0} max={2} step={0.01} onChange={(value) => patchSelected({ foamAmount: value })} />
              <RangeField label="Persistence" value={selectedEntity.persistence} min={0} max={1} step={0.01} onChange={(value) => patchSelected({ persistence: value })} />
            </>
          ) : null}
          <div className="ocean-dev-panel__row">
            <button type="button" onClick={actions.duplicateSelection}>Duplicate</button>
            <button type="button" onClick={actions.removeSelection}>Delete</button>
          </div>
        </div>
      ) : null}

      <div className="ocean-dev-panel__section">
        <h2>Wave Layers</h2>
        {["swell", "medium", "ripple"].map((kind) => (
          <details key={kind}>
            <summary>{config.waves[kind].label}</summary>
            <label className="ocean-check">
              <input type="checkbox" checked={config.waves[kind].enabled} onChange={(event) => actions.updateWave(kind, { enabled: event.target.checked })} />
              <span>Enabled</span>
            </label>
            <RangeField label="Amplitude" value={config.waves[kind].amplitude} min={0} max={2} step={0.01} onChange={(value) => actions.updateWave(kind, { amplitude: value })} />
            <RangeField label="Speed" value={config.waves[kind].speed} min={0} max={2} step={0.01} onChange={(value) => actions.updateWave(kind, { speed: value })} />
            <RangeField label="Scale" value={config.waves[kind].scale} min={0.1} max={5} step={0.01} onChange={(value) => actions.updateWave(kind, { scale: value })} />
            <RangeField label="Direction" value={config.waves[kind].direction} min={0} max={359} step={1} onChange={(value) => actions.updateWave(kind, { direction: value })} />
          </details>
        ))}
      </div>

      <div className="ocean-dev-panel__section">
        <h2>Shimmer</h2>
        <label className="ocean-check">
          <input type="checkbox" checked={config.shimmer.enabled} onChange={(event) => actions.updateShimmer({ enabled: event.target.checked })} />
          <span>Enabled</span>
        </label>
        <RangeField label="Brightness" value={config.shimmer.brightness} min={0} max={1} step={0.01} onChange={(value) => actions.updateShimmer({ brightness: value })} />
        <RangeField label="Flicker" value={config.shimmer.flickerAmount} min={0} max={1} step={0.01} onChange={(value) => actions.updateShimmer({ flickerAmount: value })} />
      </div>

      <div className="ocean-dev-panel__section">
        <h2>Save / Load</h2>
        <div className="ocean-dev-panel__row">
          <button type="button" onClick={actions.reset}>Restore Oil Rig DAY Production Preset</button>
          <button type="button" onClick={actions.save}>Save</button>
          <button type="button" onClick={actions.load}>Load</button>
          <button type="button" onClick={actions.download}>Export</button>
        </div>
        <textarea value={importText} onChange={(event) => actions.setImportText(event.target.value)} placeholder="Paste OceanSceneConfig JSON" />
        <div className="ocean-dev-panel__row">
          <button type="button" onClick={() => actions.importJson(importText)}>Import JSON</button>
          <button type="button" onClick={() => actions.setImportText(actions.exportJson())}>Copy to Field</button>
        </div>
        <p className="ocean-status">{status}</p>
        {!validation.valid ? <p className="ocean-warning">{validation.errors.join(" · ")}</p> : null}
      </div>

      <div className="ocean-dev-panel__section">
        <h2>Performance</h2>
        <p className="ocean-status">FPS: {playback.fps || "--"}</p>
      </div>
    </aside>
  );
}

function PlaybackBar({ controller }) {
  const { config, playback, cursor, actions } = controller;
  return (
    <footer className="ocean-playback" aria-label="Ocean playback controls">
      <button type="button" onClick={() => actions.setPlayback({ ...playback, playing: !playback.playing })}>{playback.playing ? "Pause" : "Play"}</button>
      <button type="button" onClick={actions.restart}>Restart</button>
      <button type="button" onClick={actions.stepFrame}>Step</button>
      <input type="range" min="0" max={playback.duration} step="0.01" value={playback.time} onChange={(event) => actions.scrub(event.target.value)} aria-label="Timeline scrubber" />
      <NumericField label="Time scale" value={playback.timeScale} min={0.05} max={4} step={0.05} onChange={(value) => actions.setPlayback({ ...playback, timeScale: value })} />
      <label className="ocean-check">
        <input type="checkbox" checked={playback.loop} onChange={(event) => actions.setPlayback({ ...playback, loop: event.target.checked })} />
        <span>Loop</span>
      </label>
      <label className="ocean-check">
        <input type="checkbox" checked={playback.reducedEffects} onChange={(event) => actions.setPlayback({ ...playback, reducedEffects: event.target.checked })} />
        <span>Reduced effects</span>
      </label>
      <label className="ocean-check">
        <input type="checkbox" checked={playback.freezeRenderer} onChange={(event) => actions.setPlayback({ ...playback, freezeRenderer: event.target.checked })} />
        <span>Freeze renderer</span>
      </label>
      <span className="ocean-playback__readout">{playback.time.toFixed(2)}s</span>
      <span className="ocean-playback__readout">{playback.fps || "--"} FPS</span>
      <span className="ocean-playback__readout">{config.weatherPreset}</span>
      <span className="ocean-playback__readout">{cursor ? `x ${cursor.x.toFixed(1)} / y ${cursor.y.toFixed(1)}` : "x -- / y --"}</span>
    </footer>
  );
}

export default function OceanEngineDevPage() {
  const controller = useOceanMotionEditor();
  const { config, playback, debug, view } = controller;
  const [cloudConfig, setCloudConfig] = useState(() => cloneCloudSceneConfig(OIL_RIG_DAY_CLOUD_PRESET));
  const [cloudPlayback, setCloudPlayback] = useState(createCloudPlaybackHome);
  const [cloudDebug, setCloudDebug] = useState(false);
  const [cloudMotionTrail, setCloudMotionTrail] = useState(false);
  const [cloudSkyBounds, setCloudSkyBounds] = useState(false);
  const [rigDepthMaskEnabled, setRigDepthMaskEnabled] = useState(true);
  const [rigDepthMaskDebug, setRigDepthMaskDebug] = useState(false);
  const backgroundUrl = publicAssetUrl(config.backgroundImageUrl);
  const oilRigScene = useMemo(() => getRegionalSceneBySlug("oil-rig"), []);
  const cloudController = {
    cloudConfig,
    cloudPlayback,
    cloudDebug,
    cloudMotionTrail,
    cloudSkyBounds,
    rigDepthMaskEnabled,
    rigDepthMaskDebug,
    reducedMotion: playback.reducedEffects,
    actions: {
      setCloudConfig,
      setCloudPlayback,
      setCloudDebug,
      setCloudMotionTrail,
      setCloudSkyBounds,
      setRigDepthMaskEnabled,
      setRigDepthMaskDebug,
      resetClouds: () => {
        setCloudConfig(cloneCloudSceneConfig(OIL_RIG_DAY_CLOUD_PRESET));
        setCloudPlayback((current) => ({ ...createCloudPlaybackHome(), restartKey: current.restartKey + 1 }));
        setCloudDebug(false);
        setCloudMotionTrail(false);
        setCloudSkyBounds(false);
        setRigDepthMaskEnabled(true);
        setRigDepthMaskDebug(false);
      },
    },
  };

  return (
    <main className="ocean-dev-shell" data-route="/metaverse/dev/ocean">
      <LeftTools controller={controller} />
      <section className="ocean-dev-stage" aria-label="Ocean motion editor scene">
        <header className="ocean-dev-stage__top">
          <div>
            <span>Silicon Heartland Metaverse</span>
            <h1>Ocean Motion Engine</h1>
          </div>
          <p>Locked master scene: offshore oil rig. Motion is generated through non-destructive overlays.</p>
        </header>
        <div className="ocean-dev-scene-wrap">
          <div
            className="ocean-dev-scene"
            style={{
              aspectRatio: `${config.dimensions.width} / ${config.dimensions.height}`,
              transform: `translate(${view.panX}px, ${view.panY}px) scale(${view.zoom})`,
            }}
          >
            <img className="ocean-dev-scene__background" src={backgroundUrl} alt="Locked offshore oil rig ocean master scene" draggable="false" />
            <RegionalCloudAtmosphereLayer
              sceneId="oil-rig"
              timeOfDay="DAY"
              camera={{ x: view.panX / 6, y: view.panY / 6, zoom: view.zoom }}
              config={cloudConfig}
              playback={cloudPlayback}
              reducedMotion={playback.reducedEffects && !cloudPlayback.ignoreReducedMotionForPreview}
              debug={cloudDebug}
              showMotionTrail={cloudMotionTrail}
              showSkyBounds={cloudSkyBounds}
            />
            <RegionalOceanSurfaceLayer
              sceneId="oil-rig"
              timeOfDay="DAY"
              config={config}
              reducedMotion={playback.reducedEffects}
              debug={debug}
              quality={playback.quality}
              freeze={playback.freezeRenderer}
              preview={playback.motionPreview}
            />
            {debug.showLayerDebug ? <SceneCanvas config={config} playback={playback} debug={debug} /> : null}
            <RegionalForegroundDepthLayer
              scene={oilRigScene}
              timeOfDay="DAY"
              enabled={rigDepthMaskEnabled}
              debug={rigDepthMaskDebug}
            />
            {debug.enabled ? <Overlay controller={controller} /> : null}
            <Labels config={config} debug={debug} />
          </div>
        </div>
      </section>
      <PropertiesPanel controller={controller} cloudController={cloudController} />
      <PlaybackBar controller={controller} />
    </main>
  );
}
