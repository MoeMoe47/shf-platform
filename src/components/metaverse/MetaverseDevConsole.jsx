import React, { useState } from "react";
import { getEnabledMetaverseDevSections } from "@/system/metaverse/metaverseDevCapabilities.js";

export function MetaverseDevSection({ id, section, title, open = false, children, onOpen }) {
  const sectionId = id || section;
  return (
    <details className="met-sidebar__dev-section" data-dev-section={sectionId} open={open} onToggle={(event) => event.currentTarget.open && onOpen?.(sectionId)}>
      <summary>{title}</summary>
      <div className="met-sidebar__dev-section-body">{children}</div>
    </details>
  );
}

export function MetaverseDevRange({ label, value, min, max, step = 0.01, onChange }) {
  const numeric = Number(value) || 0;
  return (
    <label className="met-sidebar__dev-range">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={numeric} onChange={(event) => onChange(Number(event.target.value))} />
      <b>{numeric.toFixed(step < 0.1 ? 2 : 1)}</b>
    </label>
  );
}

export function MetaverseDevPlaybackControls({ playback, onPlay, onPause, onRestart, label = "Playback" }) {
  return (
    <div className="met-sidebar__dev-modes" role="group" aria-label={label}>
      <button type="button" onClick={onPlay} data-active={playback?.playing ? "true" : "false"}>Play</button>
      <button type="button" onClick={onPause} data-active={playback?.playing === false ? "true" : "false"}>Pause</button>
      <button type="button" onClick={onRestart}>Restart</button>
    </div>
  );
}

export function MetaverseWeatherDevSection({ controller, capabilities = {} }) {
  const { config, playback, debug, actions } = controller;
  const [showAdvanced, setShowAdvanced] = useState(false);
  const modes = ["CLEAR", "PARTLY_CLOUDY", "CLOUDY", "OVERCAST", "LIGHT_RAIN", "RAIN", "HEAVY_RAIN", "THUNDERSTORM", "LIGHT_SNOW", "SNOW", "HEAVY_SNOW", "FOG", "MIST", "WINDY", "CUSTOM"]
    .filter((mode) => !mode.includes("SNOW") || capabilities.weather?.precipitation?.includes("snow"))
    .filter((mode) => !(mode.includes("RAIN") || mode === "THUNDERSTORM") || capabilities.weather?.precipitation?.includes("rain"));
  const update = (patch) => actions.updateConfig(patch);
  return (
    <div data-weather-dev-controls="true">
      <label className="met-sidebar__dev-toggle"><input type="checkbox" checked={config.precipitationEnabled} onChange={(event) => update({ precipitationEnabled: event.target.checked })} /><span>Precipitation</span></label>
      <label className="met-sidebar__dev-field"><span>Weather Preset</span><select value={config.weatherMode} onChange={(event) => actions.applyPreset(event.target.value)}>{modes.map((mode) => <option key={mode}>{mode}</option>)}</select></label>
      <MetaverseDevPlaybackControls playback={playback} onPlay={() => actions.setPlayback((current) => ({ ...current, playing: true }))} onPause={() => actions.setPlayback((current) => ({ ...current, playing: false }))} onRestart={actions.restart} label="Weather playback" />
      <p className="met-sidebar__dev-label">Precipitation</p>
      <label className="met-sidebar__dev-field"><span>Type</span><select value={config.precipitationType} onChange={(event) => update({ precipitationType: event.target.value, precipitationEnabled: event.target.value !== "NONE", weatherMode: "CUSTOM" })}><option>NONE</option><option>RAIN</option>{capabilities.weather?.precipitation?.includes("snow") ? <option>SNOW</option> : null}</select></label>
      <MetaverseDevRange label="Intensity" value={config.precipitationIntensity} min={0} max={1} onChange={(value) => update({ precipitationIntensity: value })} />
      <MetaverseDevRange label="Particle Density" value={config.particleDensity} min={0} max={1} onChange={(value) => update({ particleDensity: value })} />
      <MetaverseDevRange label="Fall Speed" value={config.fallSpeed} min={0} max={3} onChange={(value) => update({ fallSpeed: value })} />
      <MetaverseDevRange label="Wind Influence" value={config.windInfluence} min={0} max={1} onChange={(value) => update({ windInfluence: value })} />
      <MetaverseDevRange label="Slant / Direction" value={config.precipitationDirection} min={-80} max={80} step={1} onChange={(value) => update({ precipitationDirection: value })} />
      <MetaverseDevRange label="Near / Far Depth" value={config.nearFarDepth} min={0} max={1} onChange={(value) => update({ nearFarDepth: value })} />
      <MetaverseDevRange label="Opacity" value={config.precipitationOpacity} min={0} max={1.2} onChange={(value) => update({ precipitationOpacity: value })} />
      <p className="met-sidebar__dev-label">Wind</p>
      <MetaverseDevRange label="Direction" value={config.windDirection} min={0} max={359} step={1} onChange={(value) => update({ windDirection: value })} />
      <MetaverseDevRange label="Speed" value={config.windSpeed} min={0} max={4} onChange={(value) => update({ windSpeed: value })} />
      <MetaverseDevRange label="Gust Strength" value={config.gustStrength} min={0} max={2} onChange={(value) => update({ gustStrength: value })} />
      <MetaverseDevRange label="Gust Frequency" value={config.gustFrequency} min={0} max={2} onChange={(value) => update({ gustFrequency: value })} />
      <p className="met-sidebar__dev-label">Atmosphere</p>
      <MetaverseDevRange label="Visibility" value={config.visibility} min={0} max={1} onChange={(value) => update({ visibility: value })} />
      <MetaverseDevRange label="Fog Density" value={config.fogDensity} min={0} max={1} onChange={(value) => update({ fogDensity: value })} />
      <MetaverseDevRange label="Horizon Haze" value={config.horizonHaze} min={0} max={1} onChange={(value) => update({ horizonHaze: value })} />
      <button type="button" className="met-sidebar__dev-reset" onClick={() => setShowAdvanced((value) => !value)}>{showAdvanced ? "Hide" : "Show"} Advanced Weather</button>
      {showAdvanced ? <>
        <MetaverseDevRange label="Cloud Light Reduction" value={config.cloudLightReduction} min={0} max={1} onChange={(value) => update({ cloudLightReduction: value })} />
        <MetaverseDevRange label="Ambient Brightness" value={config.ambientBrightness} min={0.2} max={1.4} onChange={(value) => update({ ambientBrightness: value })} />
        {capabilities.weather?.wetSurface ? <MetaverseDevRange label="Surface Wetness" value={config.surfaceWetness} min={0} max={1} onChange={(value) => update({ surfaceWetness: value })} /> : null}
        {capabilities.weather?.snowAccumulation ? <MetaverseDevRange label="Snow Accumulation" value={config.snowAccumulation} min={0} max={1} onChange={(value) => update({ snowAccumulation: value })} /> : null}
        {capabilities.weather?.lightning !== false ? <><label className="met-sidebar__dev-toggle"><input type="checkbox" checked={config.lightningEnabled} onChange={(event) => update({ lightningEnabled: event.target.checked })} /><span>Lightning</span></label><MetaverseDevRange label="Lightning Frequency" value={config.lightningFrequency} min={0} max={1} onChange={(value) => update({ lightningFrequency: value })} /></> : null}
        <MetaverseDevRange label="Storm Intensity" value={config.stormIntensity} min={0} max={1} onChange={(value) => update({ stormIntensity: value })} />
        <MetaverseDevRange label="Transition Duration" value={config.transitionDuration} min={0} max={120} step={1} onChange={(value) => update({ transitionDuration: value })} />
        <label className="met-sidebar__dev-toggle"><input type="checkbox" checked={config.instantTransition} onChange={(event) => update({ instantTransition: event.target.checked })} /><span>Instant Transition</span></label>
      </> : null}
      <p className="met-sidebar__dev-resolved">Mode: {config.weatherMode} · Wind {config.windDirection.toFixed(0)}° · Visibility {(config.visibility * 100).toFixed(0)}% · FPS {playback.fps || "--"}</p>
      <div className="met-sidebar__dev-subgroup"><p className="met-sidebar__dev-label">Debug</p>{Object.entries({ showWindVector: "Show Wind Vector", showPrecipitationBounds: "Show Precipitation Bounds", showWetSurfaceMask: "Show Wet Surface Mask", showSnowAccumulationMask: "Show Snow Accumulation Mask", showFogDepthBands: "Show Fog Depth Bands" }).map(([key, label]) => <label key={key} className="met-sidebar__dev-toggle"><input type="checkbox" checked={debug[key]} onChange={(event) => actions.setDebug((current) => ({ ...current, [key]: event.target.checked }))} /><span>{label}</span></label>)}</div>
      <button type="button" className="met-sidebar__dev-reset met-sidebar__dev-reset--primary" onClick={actions.reset}>Reset Weather</button>
    </div>
  );
}

export default function MetaverseDevConsole({ sceneId, capabilities, sections = {}, masterPlayback, onResetScene, onResetSection, defaultOpen = ["ocean", "weather"] }) {
  const enabled = getEnabledMetaverseDevSections(capabilities);
  const [lastSection, setLastSection] = useState(defaultOpen[0] || enabled[0]);
  const sectionTitles = { scene: "Scene", clouds: "Clouds", ocean: "Ocean", foamTurbulence: "Foam & Turbulence", weather: "Weather", cargoShips: "Cargo Ships", wildlife: "Wildlife", depthMask: "Rig Depth", traffic: "Traffic", riverFlow: "River Flow", rail: "Rail", lighting: "Lighting", emergency: "Emergency", debug: "Debug", performance: "Performance" };
  return (
    <div className="met-sidebar__dev-unified" data-metaverse-dev-console="true" data-scene-id={sceneId} data-capabilities={enabled.join(",")}>
      <div className="met-sidebar__dev-unified-header"><h3>Metaverse Developer <span className="met-sidebar__dev-badge">DEV MODE</span></h3><p>Contextual live controls for this scene.</p></div>
      {masterPlayback ? <div className="met-sidebar__dev-master" role="group" aria-label="Scene playback"><span>Scene Playback</span><button type="button" onClick={masterPlayback.play}>Play All</button><button type="button" onClick={masterPlayback.pause}>Pause All</button><button type="button" onClick={masterPlayback.restart}>Restart All</button></div> : null}
      {enabled.map((id) => sections[id] ? <MetaverseDevSection key={id} id={id} title={sectionTitles[id] || id} open={defaultOpen.includes(id)} onOpen={setLastSection}>{sections[id]}</MetaverseDevSection> : null)}
      <div className="met-sidebar__dev-reset-stack"><button type="button" className="met-sidebar__dev-reset" onClick={() => onResetSection?.(lastSection)}>Reset Current Section</button>{onResetScene ? <button type="button" className="met-sidebar__dev-reset met-sidebar__dev-reset--primary" onClick={onResetScene}>Reset Scene</button> : null}</div>
    </div>
  );
}
