import React, { useEffect, useRef } from "react";
import { recordMetaverseFrameMetric } from "@/system/metaverse/metaverseFrameProfiler.js";

function seeded(index) {
  const value = Math.sin(index * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

export default function MetaverseWeatherEnvironmentLayer({ environment, reducedMotion = false, sceneId = "scene" }) {
  const canvasRef = useRef(null);
  const configRef = useRef(environment.config);
  const playbackRef = useRef(environment.playback);
  const debugRef = useRef(environment.debug);
  configRef.current = environment.config;
  playbackRef.current = environment.playback;
  debugRef.current = environment.debug;
  const visibleWeather = (() => {
    const config = environment.config;
    const debug = environment.debug;
    const active = config.precipitationEnabled && config.precipitationType !== "NONE" && config.precipitationIntensity > 0;
    const fog = Math.max(config.fogDensity, (1 - config.visibility) * 0.52);
    const lightning = config.lightningEnabled && config.stormIntensity > 0.05;
    const hasDebug = debug.showWindVector || debug.showPrecipitationBounds || debug.showWetSurfaceMask || debug.showSnowAccumulationMask || debug.showFogDepthBands;
    return active || fog > 0.01 || lightning || hasDebug;
  })();
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext("2d");
    if (!context) return undefined;
    let frame = 0;
    let idleTimer = 0;
    let last = performance.now();
    let time = 0;
    let lastWidth = 0;
    let lastHeight = 0;
    let idleCleared = false;
    const particles = Array.from({ length: 260 }, (_, index) => ({ x: seeded(index), y: seeded(index + 70), z: seeded(index + 120), phase: seeded(index + 180) * Math.PI * 2 }));
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const quality = playbackRef.current?.quality || "High";
      const dprCap = quality === "Low" ? 0.75 : quality === "Medium" ? 1 : quality === "Ultra" ? 1.5 : 1.15;
      const dpr = Math.min(dprCap, window.devicePixelRatio || 1);
      lastWidth = rect.width;
      lastHeight = rect.height;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      idleCleared = false;
    };
    resize();
    window.addEventListener("resize", resize);
    const render = (now) => {
      const start = performance.now();
      if (document.hidden) {
        idleTimer = window.setTimeout(() => {
          frame = requestAnimationFrame(render);
        }, 500);
        return;
      }
      const config = configRef.current;
      const playback = playbackRef.current;
      const debug = debugRef.current;
      const rect = { width: lastWidth, height: lastHeight };
      if (!rect.width || !rect.height) resize();
      const delta = Math.min(0.08, Math.max(0, (now - last) / 1000));
      last = now;
      if (playback.playing && !playback.freeze && !reducedMotion) time += delta;
      const active = config.precipitationEnabled && config.precipitationType !== "NONE" && config.precipitationIntensity > 0;
      const fog = Math.max(config.fogDensity, (1 - config.visibility) * 0.52);
      const lightning = config.lightningEnabled && config.stormIntensity > 0.05;
      const hasDebug = debug.showWindVector || debug.showPrecipitationBounds || debug.showWetSurfaceMask || debug.showSnowAccumulationMask || debug.showFogDepthBands;
      const idle = !active && fog <= 0.01 && !lightning && !hasDebug;
      if (idle) {
        if (!idleCleared) context.clearRect(0, 0, rect.width, rect.height);
        idleCleared = true;
        canvas.dataset.weatherMode = config.weatherMode;
        canvas.dataset.precipitation = "none";
        canvas.dataset.environmentScene = sceneId;
        recordMetaverseFrameMetric("weather", performance.now() - start);
        idleTimer = window.setTimeout(() => {
          frame = requestAnimationFrame(render);
        }, 500);
        return;
      }
      idleCleared = false;
      context.clearRect(0, 0, rect.width, rect.height);
      if (active) {
        const count = Math.round(24 + config.particleDensity * 150 * (playback.quality === "Low" ? 0.45 : playback.quality === "Medium" ? 0.7 : 1));
        const isSnow = config.precipitationType === "SNOW";
        context.lineCap = "round";
        for (let index = 0; index < count; index += 1) {
          const particle = particles[index % particles.length];
          const depth = 0.28 + particle.z * 0.72;
          const speed = (isSnow ? 12 + depth * 26 : 180 + depth * 260) * config.fallSpeed * config.precipitationIntensity;
          const wind = (config.windSpeed * config.windInfluence * 30 + config.precipitationDirection) * depth;
          const x = ((particle.x * rect.width + time * wind + Math.sin(time * 0.7 + particle.phase) * (isSnow ? 18 : 2)) % (rect.width + 80)) - 40;
          const y = ((particle.y * rect.height + time * speed) % (rect.height + 80)) - 40;
          const size = isSnow ? 1 + depth * 3 : 0.5 + depth * 1.4;
          context.globalAlpha = config.precipitationOpacity * config.precipitationIntensity * (0.28 + depth * 0.62);
          context.strokeStyle = isSnow ? "#f8fbff" : "#c9e8f5";
          context.fillStyle = context.strokeStyle;
          if (isSnow) { context.beginPath(); context.arc(x, y, size, 0, Math.PI * 2); context.fill(); }
          else { context.lineWidth = size; context.beginPath(); context.moveTo(x, y); context.lineTo(x + wind * 0.035, y + size * 8 + speed * 0.018); context.stroke(); }
        }
      }
      if (fog > 0.01) { const gradient = context.createLinearGradient(0, rect.height * 0.12, 0, rect.height); gradient.addColorStop(0, `rgba(210,225,232,${fog * 0.5})`); gradient.addColorStop(0.55, `rgba(200,220,229,${fog * 0.18})`); gradient.addColorStop(1, `rgba(190,214,225,${fog * 0.04})`); context.fillStyle = gradient; context.fillRect(0, 0, rect.width, rect.height); }
      if (config.lightningEnabled && config.stormIntensity > 0.05 && Math.sin(time * (1.7 + config.lightningFrequency * 4.2) + 1.4) > 0.997) { context.fillStyle = `rgba(235,245,255,${0.08 + config.stormIntensity * 0.14})`; context.fillRect(0, 0, rect.width, rect.height); }
      if (debug.showWindVector) { context.globalAlpha = 0.8; context.strokeStyle = "#fbbf24"; context.lineWidth = 2; context.beginPath(); context.moveTo(24, 24); context.lineTo(24 + Math.cos(config.windDirection * Math.PI / 180) * 48, 24 + Math.sin(config.windDirection * Math.PI / 180) * 48); context.stroke(); }
      context.globalAlpha = 1;
      canvas.dataset.weatherMode = config.weatherMode;
      canvas.dataset.precipitation = active ? config.precipitationType.toLowerCase() : "none";
      canvas.dataset.environmentScene = sceneId;
      recordMetaverseFrameMetric("weather", performance.now() - start);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(frame); window.clearTimeout(idleTimer); window.removeEventListener("resize", resize); };
  }, [reducedMotion, sceneId, visibleWeather]);
  if (!visibleWeather) return null;
  return <canvas ref={canvasRef} className="metaverse-weather-environment" data-weather-layer="true" aria-hidden="true" />;
}
