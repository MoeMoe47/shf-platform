import React, { useEffect, useMemo, useState } from "react";
import MetaverseCamera from "@/components/metaverse/MetaverseCamera.jsx";
import MetaverseCameraControls from "@/components/metaverse/MetaverseCameraControls.jsx";
import MetaverseMiniMap from "@/components/metaverse/MetaverseMiniMap.jsx";
import RegionalCloudAtmosphereLayer from "@/components/metaverse/RegionalCloudAtmosphereLayer.jsx";
import RegionalCargoShipLayer from "@/components/metaverse/RegionalCargoShipLayer.jsx";
import RegionalForegroundDepthLayer from "@/components/metaverse/RegionalForegroundDepthLayer.jsx";
import RegionalOceanSurfaceLayer from "@/components/metaverse/RegionalOceanSurfaceLayer.jsx";
import RegionalOceanVideoLayer from "@/components/metaverse/RegionalOceanVideoLayer.jsx";
import RegionalSeagullLifeLayer from "@/components/metaverse/RegionalSeagullLifeLayer.jsx";
import MetaverseSidebar from "@/components/metaverse/MetaverseSidebar.jsx";
import MetaverseWeatherEnvironmentLayer from "@/components/metaverse/MetaverseWeatherEnvironmentLayer.jsx";
import { MetaverseDevSection, MetaverseWeatherDevSection } from "@/components/metaverse/MetaverseDevConsole.jsx";
import useOceanMotionEditor from "@/hooks/metaverse/useOceanMotionEditor.js";
import useMetaverseEnvironmentRuntime from "@/hooks/metaverse/useMetaverseEnvironmentRuntime.js";
import { getRegionalRouteNeighbors, getRegionalSceneBySlug, REGIONAL_ROUTE_SEQUENCE } from "@/system/metaverse/regionalSceneRegistry.js";
import { CLOUD_MOTION_PREVIEW_MODES, cloneCloudSceneConfig, OIL_RIG_DAY_CLOUD_PRESET } from "@/system/metaverse/regionalCloudAtmosphere.js";
import { cloneSeagullSceneConfig, OIL_RIG_DAY_SEAGULL_PRESET } from "@/system/metaverse/seagullRegistry.js";
import { cloneCargoShipSceneConfig, OIL_RIG_DAY_CARGO_SHIP_PRESET } from "@/system/metaverse/cargoShipRegistry.js";
import { OCEAN_QUALITY_MODES, OIL_RIG_DAY_OCEAN_PRESET, createOilRigOceanSceneConfig } from "@/system/metaverse/oceanMotionEngine.js";
import {
  METAVERSE_TIME_OF_DAY_MODES,
  resolveMetaverseAssetVariant,
  resolveMetaverseDevModeEnabled,
  resolveMetaverseDevTimeOverride,
  resolveMetaverseTimeOfDay,
} from "@/system/metaverse/metaverseTimeOfDay.js";
import { publicAssetUrl } from "@/system/metaverse/metaverseNavigationModel.js";
import { getMetaverseDevCapabilities } from "@/system/metaverse/metaverseDevCapabilities.js";
import { createMetaverseEnvironmentConfig } from "@/system/metaverse/metaverseEnvironmentRuntime.js";
import { getMetaverseFrameProfilerSnapshot } from "@/system/metaverse/metaverseFrameProfiler.js";

const CAMERA_HOME = { x: 0, y: 0, zoom: 1 };
const DEV_TIME_MODE_STORAGE_KEY = "met-dev-time-mode";
const PERF_SCENARIOS = new Set(["base", "clouds", "ocean", "birds", "ships", "weather", "all"]);
const OCEAN_RENDERER_MODES = ["CINEMATIC_PLATE", "PROCEDURAL_DEBUG"];
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

function createCloudPlaybackHome(devModeEnabled = false) {
  return {
    playing: true,
    timeScale: 1,
    restartKey: 0,
    motionPreview: devModeEnabled ? "VISIBLE" : "NATURAL",
    ignoreReducedMotionForPreview: false,
  };
}

function createSeagullPlaybackHome() {
  return {
    playing: true,
    timeScale: 1,
    restartKey: 0,
  };
}

function createCargoShipPlaybackHome() {
  return { playing: true, timeScale: 1, restartKey: 0 };
}

function readInitialQualityParam() {
  try {
    const raw = new URLSearchParams(window.location.search).get("metQuality");
    return OCEAN_QUALITY_MODES.includes(raw) ? raw : null;
  } catch {
    return null;
  }
}

function readPerfScenarioParam() {
  try {
    const raw = new URLSearchParams(window.location.search).get("metPerf");
    return import.meta.env.DEV && PERF_SCENARIOS.has(raw) ? raw : "all";
  } catch {
    return "all";
  }
}

function perfScenarioAllows(scenario, key) {
  if (!scenario || scenario === "all") return true;
  if (scenario === "base") return false;
  return scenario === key;
}

function MetaverseFrameProfilerPanel() {
  const [snapshot, setSnapshot] = useState(() => getMetaverseFrameProfilerSnapshot());
  useEffect(() => {
    const onSample = (event) => setSnapshot(event.detail || getMetaverseFrameProfilerSnapshot());
    window.addEventListener("metaverse-frame-profiler", onSample);
    return () => window.removeEventListener("metaverse-frame-profiler", onSample);
  }, []);
  const metrics = snapshot.metrics || {};
  return (
    <div className="met-sidebar__perf-profiler" data-metaverse-frame-profiler="true">
      <p className="met-sidebar__dev-resolved">FRAME {snapshot.frameId || 0} · Total CPU: {snapshot.totalMs || 0} ms · FPS: {snapshot.fps || "--"}</p>
      <p className="met-sidebar__dev-resolved">Ocean: {metrics.ocean || 0} ms · Clouds: {metrics.clouds || 0} ms · Birds: {metrics.birds || 0} ms</p>
      <p className="met-sidebar__dev-resolved">Ships: {metrics.ships || 0} ms · Weather: {metrics.weather || 0} ms · UI/Other: {metrics.ui || 0} ms</p>
    </div>
  );
}

function readStoredDevTimeMode() {
  try {
    const raw = window.sessionStorage.getItem(DEV_TIME_MODE_STORAGE_KEY);
    return METAVERSE_TIME_OF_DAY_MODES.includes(raw) ? raw : "AUTO";
  } catch {
    return "AUTO";
  }
}

function readInitialDevTimeMode(devModeEnabled) {
  if (!devModeEnabled) return "AUTO";
  const queryOverride = resolveMetaverseDevTimeOverride({ isDev: import.meta.env.DEV, search: window.location.search });
  return queryOverride || readStoredDevTimeMode();
}

function writeStoredDevTimeMode(mode) {
  try {
    window.sessionStorage.setItem(DEV_TIME_MODE_STORAGE_KEY, mode);
  } catch {
    // Optional developer-review persistence only.
  }
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

function navigateInApp(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function RouteProgress({ scene }) {
  const neighbors = getRegionalRouteNeighbors(scene.id);
  const previousScene = scene.previousScene ? getRegionalSceneBySlug(scene.previousScene) : null;
  return (
    <section className="met-regional-progress" aria-label="Regional route progress">
      {previousScene ? (
        <a className="met-regional-progress__prev" href={`/metaverse/${previousScene.slug}`}>
          Back to {previousScene.title}
        </a>
      ) : null}
      <div className="met-regional-progress__current">
        <span>Scene {String(scene.order).padStart(2, "0")}</span>
        <strong>{scene.title}</strong>
      </div>
      <div className="met-regional-progress__next">
        <span>Next westbound</span>
        <strong>{neighbors.next?.title || "Route complete"}</strong>
      </div>
      <details>
        <summary>Route overview</summary>
        <ol>
          {REGIONAL_ROUTE_SEQUENCE.map((stop) => (
            <li key={stop.id} data-current={stop.id === scene.id ? "true" : "false"}>
              <span>{String(stop.order).padStart(2, "0")}</span>
              {stop.title}
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}

function RegionalSceneLayers({ scene, timeOfDay, reducedMotion }) {
  return (
    <div
      className="met-regional-layers"
      data-scene-id={scene.id}
      data-time-of-day={timeOfDay.toLowerCase()}
      data-water-mobility-state={scene.mobilityLayers.waterMobilityAuthority}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      aria-hidden="true"
    >
      <span className="met-regional-layer-slot met-regional-layer-slot--water" data-layer-slot="water-effects" />
      <span className="met-regional-layer-slot met-regional-layer-slot--vessels" data-layer-slot="vessels" />
      <span className="met-regional-layer-slot met-regional-layer-slot--rig" data-layer-slot="rig-effects" />
      <span className="met-regional-layer-slot met-regional-layer-slot--air" data-layer-slot="aircraft" />
      <span className="met-regional-layer-slot met-regional-layer-slot--birds" data-layer-slot="birds" />
      <span className="met-regional-layer-slot met-regional-layer-slot--weather" data-layer-slot="weather" />
    </div>
  );
}

function numberFromEvent(event, fallback = 0) {
  const next = Number(event.target.value);
  return Number.isFinite(next) ? next : fallback;
}

function CloudRangeControl({ label, value, min, max, step = 0.01, onChange }) {
  return (
    <label className="met-sidebar__dev-range">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(numberFromEvent(event, value))} />
      <b>{Number(value).toFixed(step < 0.1 ? 2 : 1)}</b>
    </label>
  );
}

function OilRigCloudDevControls({
  config,
  playback,
  debug,
  showMotionTrail,
  showSkyBounds,
  reducedMotion,
  onConfigChange,
  onPlaybackChange,
  onDebugChange,
  onShowMotionTrailChange,
  onShowSkyBoundsChange,
  environmentActions,
}) {
  const setConfig = (patch) => onConfigChange((current) => ({ ...current, ...patch }));
  const setEnvironmentOrConfig = (patch) => {
    if (environmentActions) environmentActions.updateConfig(patch);
    else setConfig(patch);
  };
  const setLayerEnabled = (layerId, enabled) => {
    onConfigChange((current) => ({
      ...current,
      layers: current.layers.map((layer) => (layer.id === layerId ? { ...layer, enabled } : layer)),
    }));
  };
  const reset = () => {
    onConfigChange(cloneCloudSceneConfig(OIL_RIG_DAY_CLOUD_PRESET));
    onPlaybackChange((current) => ({ ...createCloudPlaybackHome(true), restartKey: current.restartKey + 1 }));
    onDebugChange(false);
    onShowMotionTrailChange(false);
    onShowSkyBoundsChange(false);
  };

  return (
    <div className="met-sidebar__dev-pinned met-sidebar__dev-pinned--clouds">
      <h3>Clouds <span className="met-sidebar__dev-badge">Oil Rig Day</span></h3>
      <label className="met-sidebar__dev-toggle">
        <input type="checkbox" checked={config.enabled} onChange={(event) => setConfig({ enabled: event.target.checked })} />
        <span>Clouds</span>
      </label>
      <div className="met-sidebar__dev-modes" role="group" aria-label="Cloud playback controls">
        <button type="button" onClick={() => onPlaybackChange((current) => ({ ...current, playing: true }))} data-active={playback.playing ? "true" : "false"}>Play</button>
        <button type="button" onClick={() => onPlaybackChange((current) => ({ ...current, playing: false }))} data-active={!playback.playing ? "true" : "false"}>Pause</button>
        <button type="button" onClick={() => onPlaybackChange((current) => ({ ...current, restartKey: current.restartKey + 1 }))}>Restart</button>
      </div>
      <p className="met-sidebar__dev-label">Cloud Motion Preview</p>
      <div className="met-sidebar__dev-modes" role="group" aria-label="Cloud motion preview">
        {CLOUD_MOTION_PREVIEW_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onPlaybackChange((current) => ({ ...current, motionPreview: mode }))}
            data-active={(playback.motionPreview || "NATURAL") === mode ? "true" : "false"}
          >
            {CLOUD_MOTION_PREVIEW_LABELS[mode]}
          </button>
        ))}
      </div>
      <p className="met-sidebar__dev-label">Wind Direction Presets</p>
      <div className="met-sidebar__dev-modes" role="group" aria-label="Wind direction presets">
        {WIND_DIRECTION_PRESETS.map((preset) => (
          <button key={preset.value} type="button" onClick={() => setEnvironmentOrConfig({ windDirection: preset.value })}>
            {preset.label}
          </button>
        ))}
      </div>
      <CloudRangeControl label="Wind Direction" value={config.windDirection} min={0} max={359} step={1} onChange={(value) => setEnvironmentOrConfig({ windDirection: value })} />
      <CloudRangeControl label="Wind Speed" value={config.windSpeed} min={0} max={2} step={0.01} onChange={(value) => setEnvironmentOrConfig({ windSpeed: value })} />
      <CloudRangeControl label="Global Speed" value={config.globalSpeed} min={0} max={2} step={0.01} onChange={(value) => setEnvironmentOrConfig({ cloudSpeed: value })} />
      <CloudRangeControl label="Animation Speed" value={playback.timeScale} min={0.1} max={4} step={0.05} onChange={(value) => onPlaybackChange((current) => ({ ...current, timeScale: value }))} />
      <CloudRangeControl label="Cloud Density" value={config.density} min={0} max={1} step={0.01} onChange={(value) => setConfig({ density: value })} />
      <CloudRangeControl label="Cloud Opacity" value={config.globalOpacity} min={0} max={1.2} step={0.01} onChange={(value) => setConfig({ globalOpacity: value })} />
      <label className="met-sidebar__dev-toggle">
        <input type="checkbox" checked={config.parallaxEnabled} onChange={(event) => setConfig({ parallaxEnabled: event.target.checked })} />
        <span>Parallax</span>
      </label>
      {config.layers.map((layer) => (
        <label key={layer.id} className="met-sidebar__dev-toggle">
          <input type="checkbox" checked={layer.enabled} onChange={(event) => setLayerEnabled(layer.id, event.target.checked)} />
          <span>{layer.label}</span>
        </label>
      ))}
      <label className="met-sidebar__dev-toggle">
        <input type="checkbox" checked={debug} onChange={(event) => onDebugChange(event.target.checked)} />
        <span>Debug bounds</span>
      </label>
      <label className="met-sidebar__dev-toggle">
        <input type="checkbox" checked={showMotionTrail} onChange={(event) => onShowMotionTrailChange(event.target.checked)} />
        <span>Show Motion Trail</span>
      </label>
      <label className="met-sidebar__dev-toggle">
        <input type="checkbox" checked={showSkyBounds} onChange={(event) => onShowSkyBoundsChange(event.target.checked)} />
        <span>Show Cloud Sky Bounds</span>
      </label>
      <p className="met-sidebar__dev-resolved">Reduced Motion: {reducedMotion ? "ON" : "OFF"}</p>
      {reducedMotion ? (
        <label className="met-sidebar__dev-toggle">
          <input
            type="checkbox"
            checked={playback.ignoreReducedMotionForPreview}
            onChange={(event) => onPlaybackChange((current) => ({ ...current, ignoreReducedMotionForPreview: event.target.checked }))}
          />
          <span>Ignore Reduced Motion for Preview</span>
        </label>
      ) : null}
      <button type="button" className="met-sidebar__dev-reset" onClick={reset}>Reset</button>
      <p className="met-sidebar__dev-resolved">Preset: {config.label}</p>
    </div>
  );
}

function OilRigBirdDevControls({
  config,
  playback,
  debug,
  showFlightPaths,
  showPerchAnchors,
  onConfigChange,
  onPlaybackChange,
  onDebugChange,
  onShowFlightPathsChange,
  onShowPerchAnchorsChange,
}) {
  const setConfig = (patch) => onConfigChange((current) => ({ ...current, ...patch }));
  const randomizePerches = () => {
    onConfigChange((current) => {
      const enabledAnchors = current.perchAnchors.filter((anchor) => anchor.enabled);
      return {
        ...current,
        perchedInstances: current.perchedInstances.map((bird, index) => {
          const anchor = enabledAnchors[(index + 1) % Math.max(1, enabledAnchors.length)];
          const allowed = anchor?.allowedAssets || ["perchA"];
          return {
            ...bird,
            anchorId: anchor?.id || bird.anchorId,
            asset: allowed[index % allowed.length],
            scale: 0.84 + ((index * 7) % 5) * 0.04,
          };
        }),
      };
    });
  };
  const reset = () => {
    onConfigChange(cloneSeagullSceneConfig(OIL_RIG_DAY_SEAGULL_PRESET));
    onPlaybackChange((current) => ({ ...createSeagullPlaybackHome(), restartKey: current.restartKey + 1 }));
    onDebugChange(false);
    onShowFlightPathsChange(false);
    onShowPerchAnchorsChange(false);
  };

  return (
    <div className="met-sidebar__dev-pinned met-sidebar__dev-pinned--birds">
      <h3>Birds <span className="met-sidebar__dev-badge">Seagulls</span></h3>
      <label className="met-sidebar__dev-toggle">
        <input type="checkbox" checked={config.enabled} onChange={(event) => setConfig({ enabled: event.target.checked })} />
        <span>Birds</span>
      </label>
      <div className="met-sidebar__dev-modes" role="group" aria-label="Seagull playback controls">
        <button type="button" onClick={() => onPlaybackChange((current) => ({ ...current, playing: true }))} data-active={playback.playing ? "true" : "false"}>Play</button>
        <button type="button" onClick={() => onPlaybackChange((current) => ({ ...current, playing: false }))} data-active={!playback.playing ? "true" : "false"}>Pause</button>
        <button type="button" onClick={() => onPlaybackChange((current) => ({ ...current, restartKey: current.restartKey + 1 }))}>Restart</button>
      </div>
      <CloudRangeControl label="Flying Count" value={config.flyingCount} min={0} max={8} step={1} onChange={(value) => setConfig({ flyingCount: value })} />
      <CloudRangeControl label="Perched Count" value={config.perchedCount} min={0} max={6} step={1} onChange={(value) => setConfig({ perchedCount: value })} />
      <CloudRangeControl label="Bird Speed" value={config.globalSpeed} min={0} max={2} step={0.05} onChange={(value) => setConfig({ globalSpeed: value })} />
      <CloudRangeControl label="Wind Influence" value={config.windInfluence} min={0} max={1.5} step={0.05} onChange={(value) => setConfig({ windInfluence: value })} />
      <CloudRangeControl label="Glide Amount" value={config.glideAmount} min={0} max={1} step={0.01} onChange={(value) => setConfig({ glideAmount: value })} />
      <CloudRangeControl label="Flap Frequency" value={config.flapFrequency} min={0.05} max={1.5} step={0.05} onChange={(value) => setConfig({ flapFrequency: value })} />
      <CloudRangeControl label="Scale Multiplier" value={config.scaleMultiplier} min={0.4} max={1.8} step={0.05} onChange={(value) => setConfig({ scaleMultiplier: value })} />
      <CloudRangeControl label="Animation Speed" value={playback.timeScale} min={0.1} max={4} step={0.05} onChange={(value) => onPlaybackChange((current) => ({ ...current, timeScale: value }))} />
      <label className="met-sidebar__dev-toggle">
        <input type="checkbox" checked={config.flyingEnabled} onChange={(event) => setConfig({ flyingEnabled: event.target.checked })} />
        <span>Flying Birds</span>
      </label>
      <label className="met-sidebar__dev-toggle">
        <input type="checkbox" checked={config.farFlyingEnabled} onChange={(event) => setConfig({ farFlyingEnabled: event.target.checked })} />
        <span>Far Flying Birds</span>
      </label>
      <label className="met-sidebar__dev-toggle">
        <input type="checkbox" checked={config.nearFlyingEnabled} onChange={(event) => setConfig({ nearFlyingEnabled: event.target.checked })} />
        <span>Near Flying Birds</span>
      </label>
      <label className="met-sidebar__dev-toggle">
        <input type="checkbox" checked={config.perchedEnabled} onChange={(event) => setConfig({ perchedEnabled: event.target.checked })} />
        <span>Perched Birds</span>
      </label>
      <label className="met-sidebar__dev-toggle">
        <input type="checkbox" checked={showFlightPaths} onChange={(event) => onShowFlightPathsChange(event.target.checked)} />
        <span>Show Flight Paths</span>
      </label>
      <label className="met-sidebar__dev-toggle">
        <input type="checkbox" checked={showPerchAnchors} onChange={(event) => onShowPerchAnchorsChange(event.target.checked)} />
        <span>Show Perch Anchors</span>
      </label>
      <label className="met-sidebar__dev-toggle">
        <input type="checkbox" checked={debug} onChange={(event) => onDebugChange(event.target.checked)} />
        <span>Bird Debug Labels</span>
      </label>
      <div className="met-sidebar__dev-modes" role="group" aria-label="Seagull reset controls">
        <button type="button" onClick={randomizePerches}>Randomize Perches</button>
        <button type="button" onClick={reset}>Reset Birds</button>
      </div>
      <p className="met-sidebar__dev-resolved">Preset: {config.label}</p>
    </div>
  );
}

function OilRigCargoShipDevControls({
  config,
  playback,
  showRoutes,
  showBounds,
  showLabels,
  onConfigChange,
  onPlaybackChange,
  onShowRoutesChange,
  onShowBoundsChange,
  onShowLabelsChange,
}) {
  const setConfig = (patch) => onConfigChange((current) => ({ ...current, ...patch }));
  const randomizeShips = () => {
    onConfigChange((current) => ({
      ...current,
      instances: current.instances.map((ship, index) => ({
        ...ship,
        phase: (ship.phase + 0.19 + index * 0.11) % 1,
      })),
    }));
    onPlaybackChange((current) => ({ ...current, restartKey: current.restartKey + 1 }));
  };
  const reset = () => {
    onConfigChange(cloneCargoShipSceneConfig(OIL_RIG_DAY_CARGO_SHIP_PRESET));
    onPlaybackChange((current) => ({ ...createCargoShipPlaybackHome(), restartKey: current.restartKey + 1 }));
    onShowRoutesChange(false);
    onShowBoundsChange(false);
    onShowLabelsChange(false);
  };

  return (
    <div className="met-sidebar__dev-pinned met-sidebar__dev-pinned--cargo-ships">
      <h3>Cargo Ships <span className="met-sidebar__dev-badge">Oil Rig Day</span></h3>
      <label className="met-sidebar__dev-toggle">
        <input type="checkbox" checked={config.enabled} onChange={(event) => setConfig({ enabled: event.target.checked })} />
        <span>Cargo Ships</span>
      </label>
      <div className="met-sidebar__dev-modes" role="group" aria-label="Cargo ship playback controls">
        <button type="button" onClick={() => onPlaybackChange((current) => ({ ...current, playing: true }))} data-active={playback.playing ? "true" : "false"}>Play</button>
        <button type="button" onClick={() => onPlaybackChange((current) => ({ ...current, playing: false }))} data-active={!playback.playing ? "true" : "false"}>Pause</button>
        <button type="button" onClick={() => onPlaybackChange((current) => ({ ...current, restartKey: current.restartKey + 1 }))}>Restart</button>
      </div>
      <CloudRangeControl label="Ship Count" value={config.shipCount} min={0} max={3} step={1} onChange={(value) => setConfig({ shipCount: value })} />
      <CloudRangeControl label="Ship Speed" value={config.globalSpeed} min={0} max={2} step={0.05} onChange={(value) => setConfig({ globalSpeed: value })} />
      <CloudRangeControl label="Scale Multiplier" value={config.scaleMultiplier} min={0.4} max={1.8} step={0.05} onChange={(value) => setConfig({ scaleMultiplier: value })} />
      <CloudRangeControl label="Wind Influence" value={config.windSpeed} min={0} max={2} step={0.05} onChange={(value) => setConfig({ windSpeed: value })} />
      <CloudRangeControl label="Animation Speed" value={playback.timeScale} min={0.1} max={3} step={0.05} onChange={(value) => onPlaybackChange((current) => ({ ...current, timeScale: value }))} />
      <label className="met-sidebar__dev-toggle">
        <input type="checkbox" checked={config.motionEnabled} onChange={(event) => setConfig({ motionEnabled: event.target.checked })} />
        <span>Motion</span>
      </label>
      <label className="met-sidebar__dev-toggle">
        <input type="checkbox" checked={config.bobbingEnabled} onChange={(event) => setConfig({ bobbingEnabled: event.target.checked })} />
        <span>Bobbing</span>
      </label>
      <label className="met-sidebar__dev-toggle">
        <input type="checkbox" checked={config.showFarShips} onChange={(event) => setConfig({ showFarShips: event.target.checked })} />
        <span>Far Ships</span>
      </label>
      <label className="met-sidebar__dev-toggle">
        <input type="checkbox" checked={config.showMidShips} onChange={(event) => setConfig({ showMidShips: event.target.checked })} />
        <span>Mid Ships</span>
      </label>
      <label className="met-sidebar__dev-toggle">
        <input type="checkbox" checked={showRoutes} onChange={(event) => onShowRoutesChange(event.target.checked)} />
        <span>Show Routes</span>
      </label>
      <label className="met-sidebar__dev-toggle">
        <input type="checkbox" checked={showBounds} onChange={(event) => onShowBoundsChange(event.target.checked)} />
        <span>Show Ship Bounds</span>
      </label>
      <label className="met-sidebar__dev-toggle">
        <input type="checkbox" checked={showLabels} onChange={(event) => onShowLabelsChange(event.target.checked)} />
        <span>Show Ship Labels</span>
      </label>
      <div className="met-sidebar__dev-modes" role="group" aria-label="Cargo ship reset controls">
        <button type="button" onClick={randomizeShips}>Randomize Ships</button>
        <button type="button" onClick={reset}>Reset Ships</button>
      </div>
      <p className="met-sidebar__dev-resolved">Preset: {config.label}</p>
    </div>
  );
}

function DevPreviewModes({ value, onChange, label = "Motion Preview" }) {
  return (
    <>
      <p className="met-sidebar__dev-label">{label}</p>
      <div className="met-sidebar__dev-modes" role="group" aria-label={label}>
        {["NATURAL", "VISIBLE", "EXAGGERATED"].map((mode) => (
          <button key={mode} type="button" data-active={value === mode ? "true" : "false"} onClick={() => onChange(mode)}>
            {mode[0] + mode.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
    </>
  );
}

function emitOceanVideoCommand(detail) {
  window.dispatchEvent(new CustomEvent("metaverse-ocean-video-command", { detail }));
}

function OceanVideoReadout() {
  const [status, setStatus] = useState(null);
  useEffect(() => {
    const onStatus = (event) => setStatus(event.detail || null);
    window.addEventListener("metaverse-ocean-video-status", onStatus);
    return () => window.removeEventListener("metaverse-ocean-video-status", onStatus);
  }, []);
  const current = status || { loaded: false, currentTime: 0, duration: 0, playbackState: "LOADING", droppedFrames: null };
  return (
    <div data-ocean-video-readout="true">
      <p className="met-sidebar__dev-resolved">Video Loaded: {current.loaded ? "YES" : current.missing ? "NO" : "LOADING"}</p>
      <p className="met-sidebar__dev-resolved">Current Time: {Number(current.currentTime || 0).toFixed(2)} · Duration: {Number(current.duration || 0).toFixed(2)}</p>
      <p className="met-sidebar__dev-resolved">Playback State: {current.playbackState}</p>
      <p className="met-sidebar__dev-resolved">Dropped Frames: {current.droppedFrames ?? "N/A"}</p>
    </div>
  );
}

function OceanDevControls({ controller, reducedMotion, renderer, onRendererChange }) {
  const { config, playback, debug, actions } = controller;
  const [videoOpacity, setVideoOpacity] = useState(1);
  const setPlayback = (patch) => actions.setPlayback((current) => ({ ...current, ...patch }));
  return (
    <div data-ocean-runtime-controls="true">
      <p className="met-sidebar__dev-label">PRODUCTION OCEAN</p>
      <div className="met-sidebar__dev-modes" role="group" aria-label="Ocean production renderer">
        {OCEAN_RENDERER_MODES.map((mode) => <button key={mode} type="button" onClick={() => onRendererChange(mode)} data-active={renderer === mode ? "true" : "false"}>{mode === "CINEMATIC_PLATE" ? "Cinematic Plate" : "Procedural Debug"}</button>)}
      </div>
      {renderer === "CINEMATIC_PLATE" ? (
        <>
          <div className="met-sidebar__dev-modes" role="group" aria-label="Ocean video playback controls">
            <button type="button" onClick={() => emitOceanVideoCommand({ type: "play" })}>Play</button>
            <button type="button" onClick={() => emitOceanVideoCommand({ type: "pause" })}>Pause</button>
            <button type="button" onClick={() => emitOceanVideoCommand({ type: "restart" })}>Restart</button>
          </div>
          <div className="met-sidebar__dev-modes" role="group" aria-label="Ocean video speed">
            {[0.25, 0.5, 0.75, 1].map((speed) => <button key={speed} type="button" onClick={() => emitOceanVideoCommand({ type: "speed", value: speed })}>{speed}x</button>)}
          </div>
          <label className="met-sidebar__dev-toggle"><input type="checkbox" defaultChecked onChange={(event) => emitOceanVideoCommand({ type: "loop", value: event.target.checked })} /><span>Loop</span></label>
          <CloudRangeControl label="Opacity" value={videoOpacity} min={0} max={1} step={0.01} onChange={(value) => { setVideoOpacity(value); emitOceanVideoCommand({ type: "opacity", value }); }} />
          <OceanVideoReadout />
        </>
      ) : null}
      <label className="met-sidebar__dev-toggle">
        <input type="checkbox" checked={config.surface.enabled} onChange={(event) => actions.commitConfig((current) => ({ ...current, surface: { ...current.surface, enabled: event.target.checked } }))} />
        <span>Ocean Surface</span>
      </label>
      <p className="met-sidebar__dev-label">Renderer</p>
      <div className="met-sidebar__dev-modes" role="group" aria-label="Ocean playback controls">
        <button type="button" onClick={() => setPlayback({ playing: true })} data-active={playback.playing ? "true" : "false"}>Play</button>
        <button type="button" onClick={() => setPlayback({ playing: false })} data-active={!playback.playing ? "true" : "false"}>Pause</button>
        <button type="button" onClick={actions.restart}>Restart</button>
        <button type="button" onClick={actions.reset}>Restore Oil Rig DAY Production Preset</button>
      </div>
      <label className="met-sidebar__dev-toggle">
        <input type="checkbox" checked={playback.freezeRenderer} onChange={(event) => setPlayback({ freezeRenderer: event.target.checked })} />
        <span>Freeze</span>
      </label>
      <label className="met-sidebar__dev-toggle"><input type="checkbox" checked={debug.showVideoBounds === true} onChange={(event) => actions.setDebug((current) => ({ ...current, showVideoBounds: event.target.checked }))} /><span>Show Video Bounds</span></label>
      <label className="met-sidebar__dev-toggle"><input type="checkbox" checked={debug.showOceanMask === true} onChange={(event) => actions.setDebug((current) => ({ ...current, showOceanMask: event.target.checked }))} /><span>Show Ocean Mask</span></label>
      <DevPreviewModes value={playback.motionPreview || "NATURAL"} onChange={(motionPreview) => setPlayback({ motionPreview })} label="Ocean Preview Mode" />
      {[["swell", "Large Swell"], ["medium", "Medium Waves"], ["ripple", "Micro Ripples"]].map(([kind, label]) => (
        <div key={kind} className="met-sidebar__dev-subgroup">
          <p className="met-sidebar__dev-label">{label.toUpperCase()}</p>
          <label className="met-sidebar__dev-toggle">
            <input type="checkbox" checked={config.waves[kind].enabled} onChange={(event) => actions.updateWave(kind, { enabled: event.target.checked })} />
            <span>Enabled</span>
          </label>
          <CloudRangeControl label="Amplitude" value={config.waves[kind].amplitude} min={0} max={2} step={0.01} onChange={(value) => actions.updateWave(kind, { amplitude: value })} />
          <CloudRangeControl label="Scale / Frequency" value={config.waves[kind].scale} min={0.1} max={5} step={0.01} onChange={(value) => actions.updateWave(kind, { scale: value })} />
          <CloudRangeControl label="Speed" value={config.waves[kind].speed} min={0} max={2} step={0.01} onChange={(value) => actions.updateWave(kind, { speed: value })} />
          <CloudRangeControl label="Direction" value={config.waves[kind].direction} min={0} max={359} step={1} onChange={(value) => actions.updateWave(kind, { direction: value })} />
        </div>
      ))}
      <p className="met-sidebar__dev-label">Flow</p>
      <CloudRangeControl label="Ocean Direction" value={config.global.flowDirection} min={0} max={359} step={1} onChange={(value) => actions.updateGlobal({ flowDirection: value })} />
      <CloudRangeControl label="Ocean Current Speed" value={config.global.flowSpeed} min={0} max={3} step={0.01} onChange={(value) => actions.updateGlobal({ flowSpeed: value })} />
      <p className="met-sidebar__dev-label">Depth</p>
      <CloudRangeControl label="Depth Influence" value={config.global.depthPerspective} min={0} max={1} step={0.01} onChange={(value) => actions.updateGlobal({ depthPerspective: value })} />
      <CloudRangeControl label="Horizon Suppression" value={config.global.horizonSuppression} min={0} max={1} step={0.01} onChange={(value) => actions.updateGlobal({ horizonSuppression: value })} />
      <p className="met-sidebar__dev-label">Renderer</p>
      <CloudRangeControl label="Displacement Strength" value={config.global.displacementStrength} min={0} max={2} step={0.01} onChange={(value) => actions.updateGlobal({ displacementStrength: value })} />
      <p className="met-sidebar__dev-resolved">Reduced Motion: {reducedMotion ? "ON" : "OFF"}</p>
      <OceanRuntimeReadout />
    </div>
  );
}

function OceanRuntimeReadout() {
  const [runtime, setRuntime] = useState(null);
  useEffect(() => {
    const onRuntime = (event) => setRuntime(event.detail || null);
    window.addEventListener("metaverse-ocean-runtime", onRuntime);
    return () => window.removeEventListener("metaverse-ocean-runtime", onRuntime);
  }, []);
  if (!import.meta.env.DEV || !runtime) return null;
  return (
    <div className="met-sidebar__dev-subgroup" data-ocean-runtime-readout="true">
      <p className="met-sidebar__dev-label">OCEAN RUNTIME</p>
      <p className="met-sidebar__dev-resolved">RAF: {runtime.rafCount} · Render: {runtime.renderCount}</p>
      <p className="met-sidebar__dev-resolved">Sim Time: {runtime.simulationTime.toFixed(2)} · dt: {runtime.deltaTime.toFixed(3)}</p>
      <p className="met-sidebar__dev-resolved">Shader Time: {runtime.shaderTime.toFixed(2)} · Playing: {runtime.playing ? "YES" : "NO"}</p>
      <p className="met-sidebar__dev-resolved">Frozen: {runtime.frozen ? "YES" : "NO"} · Quality: {runtime.quality} · Frame Skip: {runtime.frameSkipCount}</p>
    </div>
  );
}

function FoamTurbulenceDevControls({ controller }) {
  const { config, actions } = controller;
  const [selectedFoamId, setSelectedFoamId] = useState(config.foamZones[0]?.id || "");
  const [selectedTurbulenceId, setSelectedTurbulenceId] = useState(config.turbulenceZones[0]?.id || "");
  const selectedFoam = config.foamZones.find((zone) => zone.id === selectedFoamId) || config.foamZones[0];
  const selectedTurbulence = config.turbulenceZones.find((zone) => zone.id === selectedTurbulenceId) || config.turbulenceZones[0];
  const updateZone = (type, id, patch) => actions.commitConfig((current) => ({
    ...current,
    [type]: current[type].map((zone) => (zone.id === id ? { ...zone, ...patch } : zone)),
  }));
  return (
    <div data-foam-turbulence-controls="true">
      <label className="met-sidebar__dev-toggle">
        <input type="checkbox" checked={config.effects.foamEnabled} onChange={(event) => actions.commitConfig((current) => ({ ...current, effects: { ...current.effects, foamEnabled: event.target.checked } }))} />
        <span>Foam On / Off</span>
      </label>
      <CloudRangeControl label="Global Turbulence" value={config.effects.globalTurbulence} min={0} max={2} step={0.01} onChange={(value) => actions.commitConfig((current) => ({ ...current, effects: { ...current.effects, globalTurbulence: value } }))} />
      <p className="met-sidebar__dev-label">Open Ocean Foam</p>
      {selectedFoam ? (
        <>
          <CloudRangeControl label="Density" value={selectedFoam.density} min={0} max={1.5} step={0.01} onChange={(value) => updateZone("foamZones", selectedFoam.id, { density: value })} />
          <CloudRangeControl label="Opacity" value={selectedFoam.opacity} min={0} max={1} step={0.01} onChange={(value) => updateZone("foamZones", selectedFoam.id, { opacity: value })} />
          <CloudRangeControl label="Drift" value={selectedFoam.driftDirection} min={0} max={359} step={1} onChange={(value) => updateZone("foamZones", selectedFoam.id, { driftDirection: value })} />
          <CloudRangeControl label="Stretch" value={selectedFoam.stretch} min={0} max={2} step={0.01} onChange={(value) => updateZone("foamZones", selectedFoam.id, { stretch: value })} />
          <CloudRangeControl label="Breakup" value={selectedFoam.distortion} min={0} max={2} step={0.01} onChange={(value) => updateZone("foamZones", selectedFoam.id, { distortion: value })} />
          <CloudRangeControl label="Lifetime" value={selectedFoam.lifetime} min={0.5} max={60} step={0.5} onChange={(value) => updateZone("foamZones", selectedFoam.id, { lifetime: value })} />
          <CloudRangeControl label="Regeneration" value={selectedFoam.regeneration} min={0} max={1} step={0.01} onChange={(value) => updateZone("foamZones", selectedFoam.id, { regeneration: value })} />
          <CloudRangeControl label="Flow Influence" value={selectedFoam.flowFollowing} min={0} max={1} step={0.01} onChange={(value) => updateZone("foamZones", selectedFoam.id, { flowFollowing: value })} />
        </>
      ) : null}
      <label className="met-sidebar__dev-toggle">
        <input type="checkbox" checked={config.effects.turbulenceEnabled} onChange={(event) => actions.commitConfig((current) => ({ ...current, effects: { ...current.effects, turbulenceEnabled: event.target.checked } }))} />
        <span>Turbulence On / Off</span>
      </label>
      <p className="met-sidebar__dev-label">Rig Interaction Zone</p>
      <select className="met-sidebar__dev-select" value={selectedTurbulence?.id || ""} onChange={(event) => setSelectedTurbulenceId(event.target.value)}>
        {config.turbulenceZones.map((zone) => <option key={zone.id} value={zone.id}>{zone.label}</option>)}
      </select>
      {selectedTurbulence ? (
        <>
          <CloudRangeControl label="Intensity" value={selectedTurbulence.intensity} min={0} max={2} step={0.01} onChange={(value) => updateZone("turbulenceZones", selectedTurbulence.id, { intensity: value })} />
          <CloudRangeControl label="Radius" value={selectedTurbulence.radiusX} min={1} max={50} step={1} onChange={(value) => updateZone("turbulenceZones", selectedTurbulence.id, { radiusX: value, radiusY: value * 0.58 })} />
          <CloudRangeControl label="Swirl" value={selectedTurbulence.swirlAmount} min={-2} max={2} step={0.01} onChange={(value) => updateZone("turbulenceZones", selectedTurbulence.id, { swirlAmount: value })} />
          <CloudRangeControl label="Foam Boost" value={selectedTurbulence.foamBoost} min={0} max={2} step={0.01} onChange={(value) => updateZone("turbulenceZones", selectedTurbulence.id, { foamBoost: value })} />
          <label className="met-sidebar__dev-toggle">
            <input type="checkbox" checked={selectedTurbulence.enabled} onChange={(event) => updateZone("turbulenceZones", selectedTurbulence.id, { enabled: event.target.checked })} />
            <span>Zone Enabled</span>
          </label>
        </>
      ) : null}
    </div>
  );
}

function UnifiedOilRigDevPanel({
  scene,
  resolvedTimeOfDay,
  devTimeMode,
  onDevTimeModeSelect,
  backgroundVariant,
  miniMapVisible,
  cloudConfig,
  effectiveCloudConfig,
  cloudPlayback,
  cloudDebug,
  cloudMotionTrail,
  cloudSkyBounds,
  setCloudConfig,
  setCloudPlayback,
  setCloudDebug,
  setCloudMotionTrail,
  setCloudSkyBounds,
  rigDepthMaskEnabled,
  rigDepthMaskDebug,
  setRigDepthMaskEnabled,
  setRigDepthMaskDebug,
  seagullConfig,
  seagullPlayback,
  seagullDebug,
  seagullFlightPaths,
  seagullPerchAnchors,
  setSeagullConfig,
  setSeagullPlayback,
  setSeagullDebug,
  setSeagullFlightPaths,
  setSeagullPerchAnchors,
  cargoShipConfig,
  cargoShipPlayback,
  cargoShipRoutes,
  cargoShipBounds,
  cargoShipLabels,
  setCargoShipConfig,
  setCargoShipPlayback,
  setCargoShipRoutes,
  setCargoShipBounds,
  setCargoShipLabels,
  oceanController,
  oceanRenderer,
  onOceanRendererChange,
  environmentController,
  capabilities,
  reducedMotion,
}) {
  const { config: oceanConfig, playback: oceanPlayback, debug: oceanDebug, actions: oceanActions } = oceanController;
  const [lastSection, setLastSection] = useState("ocean");
  const has = (key) => capabilities[key] === true || (capabilities[key] && capabilities[key].enabled !== false);
  const resetClouds = () => {
    setCloudConfig(cloneCloudSceneConfig(OIL_RIG_DAY_CLOUD_PRESET));
    setCloudPlayback((current) => ({ ...createCloudPlaybackHome(true), restartKey: current.restartKey + 1 }));
    setCloudDebug(false); setCloudMotionTrail(false); setCloudSkyBounds(false);
  };
  const resetBirds = () => {
    setSeagullConfig(cloneSeagullSceneConfig(OIL_RIG_DAY_SEAGULL_PRESET));
    setSeagullPlayback((current) => ({ ...createSeagullPlaybackHome(), restartKey: current.restartKey + 1 }));
    setSeagullDebug(false); setSeagullFlightPaths(false); setSeagullPerchAnchors(false);
  };
  const resetShips = () => {
    setCargoShipConfig(cloneCargoShipSceneConfig(OIL_RIG_DAY_CARGO_SHIP_PRESET));
    setCargoShipPlayback((current) => ({ ...createCargoShipPlaybackHome(), restartKey: current.restartKey + 1 }));
    setCargoShipRoutes(false); setCargoShipBounds(false); setCargoShipLabels(false);
  };
  const resetOcean = () => { oceanActions.reset(); onOceanRendererChange("CINEMATIC_PLATE"); };
  const resetWeather = () => environmentController.actions.reset();
  const resetEffects = () => {
    const canonical = createOilRigOceanSceneConfig();
    oceanActions.commitConfig((current) => ({ ...current, effects: canonical.effects, foamZones: canonical.foamZones, turbulenceZones: canonical.turbulenceZones }));
  };
  const resetDebug = () => {
    setCloudDebug(false); setCloudMotionTrail(false); setCloudSkyBounds(false); setCargoShipRoutes(false); setCargoShipBounds(false); setCargoShipLabels(false); setSeagullDebug(false); setSeagullFlightPaths(false); setSeagullPerchAnchors(false); oceanActions.setDebug((current) => ({ ...current, showOceanMask: false, showDepthBands: false }));
  };
  const playAll = () => { setCloudPlayback((current) => ({ ...current, playing: true })); setSeagullPlayback((current) => ({ ...current, playing: true })); setCargoShipPlayback((current) => ({ ...current, playing: true })); oceanActions.setPlayback((current) => ({ ...current, playing: true })); environmentController.actions.setPlayback((current) => ({ ...current, playing: true })); };
  const pauseAll = () => { setCloudPlayback((current) => ({ ...current, playing: false })); setSeagullPlayback((current) => ({ ...current, playing: false })); setCargoShipPlayback((current) => ({ ...current, playing: false })); oceanActions.setPlayback((current) => ({ ...current, playing: false })); environmentController.actions.setPlayback((current) => ({ ...current, playing: false })); };
  const restartAll = () => { setCloudPlayback((current) => ({ ...current, playing: true, restartKey: current.restartKey + 1 })); setSeagullPlayback((current) => ({ ...current, playing: true, restartKey: current.restartKey + 1 })); setCargoShipPlayback((current) => ({ ...current, playing: true, restartKey: current.restartKey + 1 })); oceanActions.restart(); environmentController.actions.restart(); };
  const resetDay = () => { resetClouds(); resetOcean(); resetEffects(); resetWeather(); resetShips(); resetBirds(); setRigDepthMaskEnabled(true); setRigDepthMaskDebug(false); resetDebug(); };
  const resetCurrent = { scene: () => onDevTimeModeSelect("DAY"), clouds: resetClouds, ocean: resetOcean, effects: resetEffects, weather: resetWeather, ships: resetShips, birds: resetBirds, rig: () => { setRigDepthMaskEnabled(true); setRigDepthMaskDebug(false); }, debug: resetDebug, performance: () => { oceanActions.setPlayback((current) => ({ ...current, quality: "High", freezeRenderer: false, reducedEffects: false })); environmentController.actions.setPlayback((current) => ({ ...current, quality: "High" })); } }[lastSection] || resetOcean;
  const setSceneQuality = (quality) => {
    oceanActions.setPlayback({ ...oceanPlayback, quality });
    environmentController.actions.setPlayback((current) => ({ ...current, quality }));
  };
  return (
    <div className="met-sidebar__dev-unified" data-unified-oil-rig-dev-panel="true">
      <div className="met-sidebar__dev-unified-header">
        <h3>Oil Rig Developer <span className="met-sidebar__dev-badge">DEV MODE</span></h3>
        <p>Live controls use the production scene controllers.</p>
      </div>
      <div className="met-sidebar__dev-master" role="group" aria-label="Scene playback">
        <span>Scene Playback</span>
        <button type="button" onClick={playAll}>Play All</button><button type="button" onClick={pauseAll}>Pause All</button><button type="button" onClick={restartAll}>Restart All</button>
      </div>
      <MetaverseDevSection title="Scene" section="scene" onOpen={setLastSection}>
        <p className="met-sidebar__dev-label">SCENE TIME</p>
        <div className="met-sidebar__dev-modes" role="group" aria-label="Developer scene time override">
          {METAVERSE_TIME_OF_DAY_MODES.map((mode) => <button key={mode} type="button" data-active={devTimeMode === mode ? "true" : "false"} onClick={() => onDevTimeModeSelect(mode)}>{mode}</button>)}
        </div>
        <p className="met-sidebar__dev-resolved">AUTO TIME: {devTimeMode === "AUTO" ? "ON" : "OFF"}</p>
        <p className="met-sidebar__dev-resolved">RESOLVED SCENE: {resolvedTimeOfDay}</p>
        <p className="met-sidebar__dev-resolved">OVERRIDE: {devTimeMode}</p>
        <p className="met-sidebar__dev-resolved">Asset: {backgroundVariant.resolvedVariant}{backgroundVariant.fallbackUsed ? " fallback" : ""}</p><p className="met-sidebar__dev-resolved">Environment: {scene.classification}</p><p className="met-sidebar__dev-resolved">Quick Map: {miniMapVisible ? "visible" : "hidden"}</p>
      </MetaverseDevSection>
      {has("clouds") ? <MetaverseDevSection title="Clouds" section="clouds" onOpen={setLastSection}><OilRigCloudDevControls config={effectiveCloudConfig} playback={cloudPlayback} debug={cloudDebug} showMotionTrail={cloudMotionTrail} showSkyBounds={cloudSkyBounds} reducedMotion={reducedMotion} onConfigChange={setCloudConfig} onPlaybackChange={setCloudPlayback} onDebugChange={setCloudDebug} onShowMotionTrailChange={setCloudMotionTrail} onShowSkyBoundsChange={setCloudSkyBounds} environmentActions={environmentController.actions} /></MetaverseDevSection> : null}
      {has("ocean") ? <MetaverseDevSection title="Ocean" section="ocean" open onOpen={setLastSection}><OceanDevControls controller={oceanController} reducedMotion={reducedMotion} renderer={oceanRenderer} onRendererChange={onOceanRendererChange} /></MetaverseDevSection> : null}
      {has("foamTurbulence") ? <MetaverseDevSection title="Foam & Turbulence" section="effects" open onOpen={setLastSection}><FoamTurbulenceDevControls controller={oceanController} /></MetaverseDevSection> : null}
      {has("weather") ? <MetaverseDevSection title="Weather" section="weather" open onOpen={setLastSection}><MetaverseWeatherDevSection controller={environmentController} capabilities={capabilities} /></MetaverseDevSection> : null}
      {has("cargoShips") ? <MetaverseDevSection title="Cargo Ships" section="ships" onOpen={setLastSection}><OilRigCargoShipDevControls config={cargoShipConfig} playback={cargoShipPlayback} showRoutes={cargoShipRoutes} showBounds={cargoShipBounds} showLabels={cargoShipLabels} onConfigChange={setCargoShipConfig} onPlaybackChange={setCargoShipPlayback} onShowRoutesChange={setCargoShipRoutes} onShowBoundsChange={setCargoShipBounds} onShowLabelsChange={setCargoShipLabels} /></MetaverseDevSection> : null}
      {has("wildlife") ? <MetaverseDevSection title="Seagulls" section="birds" onOpen={setLastSection}><OilRigBirdDevControls config={seagullConfig} playback={seagullPlayback} debug={seagullDebug} showFlightPaths={seagullFlightPaths} showPerchAnchors={seagullPerchAnchors} onConfigChange={setSeagullConfig} onPlaybackChange={setSeagullPlayback} onDebugChange={setSeagullDebug} onShowFlightPathsChange={setSeagullFlightPaths} onShowPerchAnchorsChange={setSeagullPerchAnchors} /></MetaverseDevSection> : null}
      {has("depthMask") ? <MetaverseDevSection title="Rig Depth" section="rig" onOpen={setLastSection}><label className="met-sidebar__dev-toggle"><input type="checkbox" checked={rigDepthMaskEnabled} onChange={(event) => setRigDepthMaskEnabled(event.target.checked)} /><span>Rig Depth Mask</span></label><label className="met-sidebar__dev-toggle"><input type="checkbox" checked={rigDepthMaskDebug} onChange={(event) => setRigDepthMaskDebug(event.target.checked)} /><span>Show rig mask bounds</span></label></MetaverseDevSection> : null}
      <MetaverseDevSection title="Debug" section="debug" onOpen={setLastSection}>
        {[["oceanMask", "Show Ocean Mask", oceanDebug.showOceanMask, (value) => oceanActions.setDebug({ ...oceanDebug, showOceanMask: value })], ["depthBands", "Show Ocean Depth Bands", oceanDebug.showDepthBands, (value) => oceanActions.setDebug({ ...oceanDebug, showDepthBands: value })], ["cloudBounds", "Show Cloud Bounds", cloudDebug, setCloudDebug], ["cloudTrail", "Show Cloud Motion Trail", cloudMotionTrail, setCloudMotionTrail], ["cloudSky", "Show Cloud Sky Bounds", cloudSkyBounds, setCloudSkyBounds], ["shipRoutes", "Show Ship Routes", cargoShipRoutes, setCargoShipRoutes], ["shipBounds", "Show Ship Bounds", cargoShipBounds, setCargoShipBounds], ["shipLabels", "Show Ship Labels", cargoShipLabels, setCargoShipLabels], ["birdPaths", "Show Bird Flight Paths", seagullFlightPaths, setSeagullFlightPaths], ["perchAnchors", "Show Perch Anchors", seagullPerchAnchors, setSeagullPerchAnchors], ["birdLabels", "Show Bird Labels", seagullDebug, setSeagullDebug], ["rigBounds", "Show Rig Mask Bounds", rigDepthMaskDebug, setRigDepthMaskDebug]].map(([, label, checked, onChange]) => <label key={label} className="met-sidebar__dev-toggle"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span>{label}</span></label>)}
        <button type="button" className="met-sidebar__dev-reset" onClick={resetDebug}>Hide All Debug</button>
      </MetaverseDevSection>
      <MetaverseDevSection title="Performance" section="performance" onOpen={setLastSection}><label className="met-sidebar__dev-field"><span>Scene Quality</span><select value={oceanPlayback.quality} onChange={(event) => setSceneQuality(event.target.value)}>{OCEAN_QUALITY_MODES.map((mode) => <option key={mode}>{mode}</option>)}</select></label><p className="met-sidebar__dev-resolved">FPS: {oceanPlayback.fps || "--"}</p><MetaverseFrameProfilerPanel /><label className="met-sidebar__dev-toggle"><input type="checkbox" checked={oceanPlayback.freezeRenderer} onChange={(event) => oceanActions.setPlayback({ ...oceanPlayback, freezeRenderer: event.target.checked })} /><span>Freeze Ocean Renderer</span></label><label className="met-sidebar__dev-toggle"><input type="checkbox" checked={oceanPlayback.reducedEffects} onChange={(event) => oceanActions.setPlayback({ ...oceanPlayback, reducedEffects: event.target.checked })} /><span>Reduced Motion / Effects</span></label><p className="met-sidebar__dev-resolved">System Reduced Motion: {reducedMotion ? "ON" : "OFF"}</p></MetaverseDevSection>
      <div className="met-sidebar__dev-reset-stack"><button type="button" className="met-sidebar__dev-reset" onClick={resetCurrent}>Reset Current Section</button><button type="button" className="met-sidebar__dev-reset met-sidebar__dev-reset--primary" onClick={resetDay}>Reset Oil Rig DAY</button></div>
    </div>
  );
}

export default function MetaverseRegionalScenePage({ scene }) {
  const reducedMotion = useReducedMotion();
  const [camera, setCamera] = useState(CAMERA_HOME);
  const [miniMapVisible, setMiniMapVisible] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [devModeEnabled] = useState(() => resolveMetaverseDevModeEnabled({ isDev: import.meta.env.DEV, search: window.location.search }));
  const [devTimeMode, setDevTimeMode] = useState(() => readInitialDevTimeMode(devModeEnabled));
  const [cloudConfig, setCloudConfig] = useState(() => cloneCloudSceneConfig(OIL_RIG_DAY_CLOUD_PRESET));
  const [cloudPlayback, setCloudPlayback] = useState(() => createCloudPlaybackHome(devModeEnabled));
  const [cloudDebug, setCloudDebug] = useState(false);
  const [cloudMotionTrail, setCloudMotionTrail] = useState(false);
  const [cloudSkyBounds, setCloudSkyBounds] = useState(false);
  const [rigDepthMaskEnabled, setRigDepthMaskEnabled] = useState(true);
  const [rigDepthMaskDebug, setRigDepthMaskDebug] = useState(false);
  const [seagullConfig, setSeagullConfig] = useState(() => cloneSeagullSceneConfig(OIL_RIG_DAY_SEAGULL_PRESET));
  const [seagullPlayback, setSeagullPlayback] = useState(createSeagullPlaybackHome);
  const [seagullDebug, setSeagullDebug] = useState(false);
  const [seagullFlightPaths, setSeagullFlightPaths] = useState(false);
  const [seagullPerchAnchors, setSeagullPerchAnchors] = useState(false);
  const [cargoShipConfig, setCargoShipConfig] = useState(() => cloneCargoShipSceneConfig(OIL_RIG_DAY_CARGO_SHIP_PRESET));
  const [cargoShipPlayback, setCargoShipPlayback] = useState(createCargoShipPlaybackHome);
  const [cargoShipRoutes, setCargoShipRoutes] = useState(false);
  const [cargoShipBounds, setCargoShipBounds] = useState(false);
  const [cargoShipLabels, setCargoShipLabels] = useState(false);
  const [oceanRenderer, setOceanRenderer] = useState("CINEMATIC_PLATE");
  const oceanController = useOceanMotionEditor({ initialConfig: OIL_RIG_DAY_OCEAN_PRESET, useStoredConfig: false });
  const environmentController = useMetaverseEnvironmentRuntime({ initialConfig: createMetaverseEnvironmentConfig({ windDirection: 268, windSpeed: 1 }) });
  const [initialQuality] = useState(readInitialQualityParam);
  const [perfScenario] = useState(readPerfScenarioParam);
  const devCapabilities = scene.devCapabilities || getMetaverseDevCapabilities(scene.id);
  const effectiveCloudConfig = useMemo(() => ({ ...cloudConfig, windDirection: environmentController.config.windDirection, windSpeed: environmentController.config.windSpeed, globalSpeed: environmentController.config.cloudSpeed }), [cloudConfig, environmentController.config.cloudSpeed, environmentController.config.windDirection, environmentController.config.windSpeed]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!initialQuality) return;
    oceanController.actions.setPlayback((current) => ({ ...current, quality: initialQuality }));
    environmentController.actions.setPlayback((current) => ({ ...current, quality: initialQuality }));
  }, [initialQuality]);

  const resolvedTimeOfDay = useMemo(() => resolveMetaverseTimeOfDay({ mode: devModeEnabled ? devTimeMode : "AUTO", date: now }), [devModeEnabled, devTimeMode, now]);
  const realAutoTimeOfDay = useMemo(() => resolveMetaverseTimeOfDay({ mode: "AUTO", date: now }), [now]);
  const backgroundVariant = useMemo(() => resolveMetaverseAssetVariant(scene.backgroundAsset, resolvedTimeOfDay), [scene.backgroundAsset, resolvedTimeOfDay]);
  const background = useMemo(() => ({
    assetId: `regional-${scene.id}`,
    aspectRatio: scene.backgroundAsset.aspectRatio,
    focalPoint: scene.backgroundAsset.focalPoint || "center",
    url: backgroundVariant.assetPath ? publicAssetUrl(backgroundVariant.assetPath) : "",
    requestedTimeOfDay: backgroundVariant.requestedVariant,
    resolvedTimeOfDay: backgroundVariant.resolvedVariant,
    timeOfDayFallbackUsed: backgroundVariant.fallbackUsed,
  }), [backgroundVariant, scene]);
  const seagullRuntimeConfig = useMemo(() => ({
    ...seagullConfig,
    windDirection: environmentController.config.windDirection,
    windSpeed: environmentController.config.windSpeed,
  }), [environmentController.config.windDirection, environmentController.config.windSpeed, seagullConfig]);
  const neighbors = getRegionalRouteNeighbors(scene.id);
  const nextScene = scene.nextScene ? getRegionalSceneBySlug(scene.nextScene) : null;

  useEffect(() => {
    if (typeof Image === "undefined") return undefined;
    const variantPaths = [
      scene.backgroundAsset.dayAsset,
      scene.backgroundAsset.duskAsset,
      scene.backgroundAsset.nightAsset,
    ].filter(Boolean);
    const currentPath = backgroundVariant.assetPath;
    const preloads = variantPaths
      .filter((assetPath) => assetPath !== currentPath)
      .map((assetPath) => {
        const image = new Image();
        image.decoding = "async";
        image.src = publicAssetUrl(assetPath);
        return image;
      });
    return () => {
      for (const image of preloads) image.src = "";
    };
  }, [backgroundVariant.assetPath, scene.backgroundAsset]);

  const handleDevTimeModeSelect = (mode) => {
    setDevTimeMode(mode);
    writeStoredDevTimeMode(mode);
  };

  const noop = () => {};
  const showPerfLayer = (key) => perfScenarioAllows(perfScenario, key);

  return (
    <main
      className="met-shell met-shell--regional"
      data-camera-level="REGIONAL_SCENE"
      data-reduced-motion={reducedMotion ? "true" : "false"}
      data-route={`/metaverse/${scene.slug}`}
      data-regional-scene-id={scene.id}
    >
      <MetaverseCamera
        background={background}
        camera={camera}
        markers={[]}
        livingCityLayer={(
          <>
            <RegionalSceneLayers scene={scene} timeOfDay={resolvedTimeOfDay} reducedMotion={reducedMotion} />
            {showPerfLayer("ocean") ? <RegionalOceanVideoLayer
              sceneId={scene.id}
              timeOfDay={resolvedTimeOfDay}
              reducedMotion={reducedMotion}
              debug={oceanController.debug}
              controls={{ playing: oceanController.playback.playing }}
              devMode={devModeEnabled}
              enabled={!devModeEnabled || oceanRenderer === "CINEMATIC_PLATE"}
            /> : null}
            {showPerfLayer("ocean") && devModeEnabled && oceanRenderer === "PROCEDURAL_DEBUG" ? <RegionalOceanSurfaceLayer
              sceneId={scene.id}
              timeOfDay={resolvedTimeOfDay}
              config={oceanController.config}
              reducedMotion={reducedMotion}
              debug={oceanController.debug}
              quality={oceanController.playback.quality}
              playing={oceanController.playback.playing}
              restartKey={oceanController.playback.restartKey}
              timeScale={oceanController.playback.timeScale}
                  freeze={oceanController.playback.freezeRenderer}
                  preview={oceanController.playback.motionPreview}
                  environment={environmentController}
                /> : null}
                {showPerfLayer("weather") ? <MetaverseWeatherEnvironmentLayer environment={environmentController} reducedMotion={reducedMotion} sceneId={scene.id} /> : null}
                {showPerfLayer("clouds") ? <RegionalCloudAtmosphereLayer
              sceneId={scene.id}
              timeOfDay={resolvedTimeOfDay}
              camera={camera}
              config={effectiveCloudConfig}
              playback={cloudPlayback}
              quality={oceanController.playback.quality}
              reducedMotion={reducedMotion && !(devModeEnabled && cloudPlayback.ignoreReducedMotionForPreview)}
              debug={cloudDebug}
              showMotionTrail={devModeEnabled && cloudMotionTrail}
              showSkyBounds={devModeEnabled && cloudSkyBounds}
            /> : null}
            {showPerfLayer("ships") ? <RegionalCargoShipLayer
              sceneId={scene.id}
              timeOfDay={resolvedTimeOfDay}
              config={cargoShipConfig}
              playback={cargoShipPlayback}
              quality={oceanController.playback.quality}
              reducedMotion={reducedMotion}
              debug={devModeEnabled && cargoShipLabels}
              showRoutes={devModeEnabled && cargoShipRoutes}
              showBounds={devModeEnabled && cargoShipBounds}
              showLabels={devModeEnabled && cargoShipLabels}
            /> : null}
            {showPerfLayer("birds") ? <RegionalSeagullLifeLayer
              sceneId={scene.id}
              timeOfDay={resolvedTimeOfDay}
              config={seagullRuntimeConfig}
              playback={seagullPlayback}
              quality={oceanController.playback.quality}
              reducedMotion={reducedMotion}
              debug={devModeEnabled && seagullDebug}
              showFlightPaths={devModeEnabled && seagullFlightPaths}
              showPerchAnchors={devModeEnabled && seagullPerchAnchors}
              depthMode="behindRig"
            /> : null}
            <RegionalForegroundDepthLayer
              scene={scene}
              timeOfDay={resolvedTimeOfDay}
              enabled={rigDepthMaskEnabled}
              debug={devModeEnabled && rigDepthMaskDebug}
            />
            {showPerfLayer("birds") ? <RegionalSeagullLifeLayer
              sceneId={scene.id}
              timeOfDay={resolvedTimeOfDay}
              config={seagullRuntimeConfig}
              playback={seagullPlayback}
              quality={oceanController.playback.quality}
              reducedMotion={reducedMotion}
              debug={devModeEnabled && seagullDebug}
              showFlightPaths={devModeEnabled && seagullFlightPaths}
              showPerchAnchors={devModeEnabled && seagullPerchAnchors}
              depthMode="frontRig"
            /> : null}
          </>
        )}
        selectedId={null}
        getUnlock={() => ({ decision: "AVAILABLE" })}
        onSelectMarker={noop}
        onCameraChange={setCamera}
        reducedMotion={reducedMotion}
      />

      <div className="met-status-strip" role="status" aria-label="Current date, time, and scene lighting">
        <span className="met-status-strip__icon" aria-hidden="true">
          {realAutoTimeOfDay === "DAY" ? "☀️" : realAutoTimeOfDay === "DUSK" ? "🌆" : "🌙"}
        </span>
        <span className="met-status-strip__date">{now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
        <span className="met-status-strip__time">{now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
        <span className="met-status-strip__auto">Auto Time</span>
        {devModeEnabled ? <span className="met-status-strip__dev-scene">DEV Scene: {resolvedTimeOfDay}</span> : null}
      </div>

      <MetaverseSidebar
        activeDrawerMode={null}
        navigatorOpen={false}
        missionsOpen={false}
        missionCount={0}
        opportunitiesOpen={false}
        opportunityCount={0}
        nextActionAvailable={false}
        totalOnline={0}
        status="AVAILABLE"
        chatUnreadCount={0}
        chatAvailable={false}
        onHome={() => navigateInApp("/metaverse")}
        onNextAction={() => setMoreOpen((value) => !value)}
        onExplore={() => setMoreOpen((value) => !value)}
        onMissions={noop}
        onOpportunities={noop}
        onMe={noop}
        onChat={noop}
        onSettings={() => setMoreOpen((value) => !value)}
        moreOpen={moreOpen}
        onToggleMore={() => setMoreOpen((value) => !value)}
        moreContent={(
          <div className="met-sidebar__more-section">
            <h3>Regional Journey</h3>
            <ul>
              <li>
                <button type="button" className="met-sidebar__item" onClick={() => setMiniMapVisible((value) => !value)} aria-pressed={miniMapVisible}>
                  <span className="met-sidebar__item-icon" aria-hidden="true">🗺️</span>
                  <span className="met-sidebar__item-label">Quick Map {miniMapVisible ? "on" : "off"}</span>
                </button>
              </li>
              <li>
                <button type="button" className="met-sidebar__item" onClick={() => setCamera(CAMERA_HOME)}>
                  <span className="met-sidebar__item-icon" aria-hidden="true">🎯</span>
                  <span className="met-sidebar__item-label">Reset View</span>
                </button>
              </li>
            </ul>
          </div>
        )}
        devContent={
          devModeEnabled ? (
            <UnifiedOilRigDevPanel
              scene={scene}
              resolvedTimeOfDay={resolvedTimeOfDay}
              devTimeMode={devTimeMode}
              onDevTimeModeSelect={handleDevTimeModeSelect}
              backgroundVariant={backgroundVariant}
              miniMapVisible={miniMapVisible}
              cloudConfig={cloudConfig}
              effectiveCloudConfig={effectiveCloudConfig}
              cloudPlayback={cloudPlayback}
              cloudDebug={cloudDebug}
              cloudMotionTrail={cloudMotionTrail}
              cloudSkyBounds={cloudSkyBounds}
              setCloudConfig={setCloudConfig}
              setCloudPlayback={setCloudPlayback}
              setCloudDebug={setCloudDebug}
              setCloudMotionTrail={setCloudMotionTrail}
              setCloudSkyBounds={setCloudSkyBounds}
              rigDepthMaskEnabled={rigDepthMaskEnabled}
              rigDepthMaskDebug={rigDepthMaskDebug}
              setRigDepthMaskEnabled={setRigDepthMaskEnabled}
              setRigDepthMaskDebug={setRigDepthMaskDebug}
              seagullConfig={seagullConfig}
              seagullPlayback={seagullPlayback}
              seagullDebug={seagullDebug}
              seagullFlightPaths={seagullFlightPaths}
              seagullPerchAnchors={seagullPerchAnchors}
              setSeagullConfig={setSeagullConfig}
              setSeagullPlayback={setSeagullPlayback}
              setSeagullDebug={setSeagullDebug}
              setSeagullFlightPaths={setSeagullFlightPaths}
              setSeagullPerchAnchors={setSeagullPerchAnchors}
              cargoShipConfig={cargoShipConfig}
              cargoShipPlayback={cargoShipPlayback}
              cargoShipRoutes={cargoShipRoutes}
              cargoShipBounds={cargoShipBounds}
              cargoShipLabels={cargoShipLabels}
              setCargoShipConfig={setCargoShipConfig}
              setCargoShipPlayback={setCargoShipPlayback}
              setCargoShipRoutes={setCargoShipRoutes}
              setCargoShipBounds={setCargoShipBounds}
              setCargoShipLabels={setCargoShipLabels}
              oceanController={oceanController}
              oceanRenderer={oceanRenderer}
              onOceanRendererChange={setOceanRenderer}
              environmentController={environmentController}
              capabilities={devCapabilities}
              reducedMotion={reducedMotion}
            />
          ) : null
        }
      />

      <section className="met-regional-info" aria-labelledby="met-regional-title">
        <p>{scene.subtitle}</p>
        <h1 id="met-regional-title">{scene.title}</h1>
        <span>{scene.classification}</span>
        <p>{scene.description}</p>
      </section>

      {nextScene ? (
        <a className="met-regional-next" href={`/metaverse/${nextScene.slug}`} aria-label={`Continue west to ${nextScene.title}`}>
          <span>WEST</span>
          <strong>{nextScene.title}</strong>
        </a>
      ) : (
        <span className="met-regional-next met-regional-next--future" aria-disabled="true" role="link">
          <span>WEST</span>
          <strong>{neighbors.next?.title || "Next scene"}</strong>
        </span>
      )}

      <RouteProgress scene={scene} />

      <div className="met-bottom-right-cluster">
        <MetaverseCameraControls
          onZoomIn={() => setCamera((value) => ({ ...value, zoom: Math.min(1.8, value.zoom + 0.12) }))}
          onZoomOut={() => setCamera((value) => ({ ...value, zoom: Math.max(1, value.zoom - 0.12) }))}
          onBack={() => setCamera(CAMERA_HOME)}
          canGoBack={camera.zoom !== 1 || camera.x !== 0 || camera.y !== 0}
        />
        {miniMapVisible ? (
          <MetaverseMiniMap
            regionalScene={scene}
            regionalScenes={REGIONAL_ROUTE_SEQUENCE}
            reducedMotion={reducedMotion}
          />
        ) : null}
      </div>

      <footer className="met-footer">
        <span>Regional world expansion Phase 1</span>
        <span>{scene.title} DAY/DUSK/NIGHT scene-specific assets active</span>
      </footer>
    </main>
  );
}
