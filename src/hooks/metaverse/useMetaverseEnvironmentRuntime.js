import { useCallback, useEffect, useMemo, useState } from "react";
import { applyMetaverseWeatherPreset, createMetaverseEnvironmentConfig, normalizeMetaverseEnvironmentConfig } from "@/system/metaverse/metaverseEnvironmentRuntime.js";
import { recordMetaverseFrameMetric } from "@/system/metaverse/metaverseFrameProfiler.js";

export default function useMetaverseEnvironmentRuntime({ initialConfig = null } = {}) {
  const [config, setConfig] = useState(() => normalizeMetaverseEnvironmentConfig(initialConfig || createMetaverseEnvironmentConfig()));
  const [playback, setPlayback] = useState({ playing: true, freeze: false, transitionProgress: 1, quality: "High", fps: 0 });
  const [debug, setDebug] = useState({ showWindVector: false, showPrecipitationBounds: false, showWetSurfaceMask: false, showSnowAccumulationMask: false, showFogDepthBands: false });
  const updateConfig = useCallback((patch) => setConfig((current) => normalizeMetaverseEnvironmentConfig({ ...current, ...(typeof patch === "function" ? patch(current) : patch), weatherMode: typeof patch === "function" ? "CUSTOM" : patch.weatherMode ?? "CUSTOM" })), []);
  const applyPreset = useCallback((mode) => setConfig((current) => applyMetaverseWeatherPreset(current, mode)), []);
  const reset = useCallback(() => { setConfig(createMetaverseEnvironmentConfig()); setPlayback((current) => ({ ...current, playing: true, freeze: false, transitionProgress: 1 })); setDebug({ showWindVector: false, showPrecipitationBounds: false, showWetSurfaceMask: false, showSnowAccumulationMask: false, showFogDepthBands: false }); }, []);
  const restart = useCallback(() => setPlayback((current) => ({ ...current, playing: true, transitionProgress: 0 })), []);
  useEffect(() => {
    let frame = 0;
    let previous = performance.now();
    let pendingDelta = 0;
    let lastCommit = previous;
    const tick = (now) => {
      const start = performance.now();
      const delta = Math.min(0.08, Math.max(0, (now - previous) / 1000));
      previous = now;
      pendingDelta += delta;
      if (!document.hidden && now - lastCommit >= 250) {
        const elapsed = pendingDelta;
        pendingDelta = 0;
        lastCommit = now;
        setPlayback((current) => {
          if (!current.playing || current.freeze) return current;
          return { ...current, transitionProgress: Math.min(1, current.transitionProgress + elapsed / Math.max(0.1, config.transitionDuration)), fps: delta ? Math.round(1 / delta) : current.fps };
        });
      }
      recordMetaverseFrameMetric("ui", performance.now() - start);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [config.transitionDuration]);
  return useMemo(() => ({ config, playback, debug, actions: { updateConfig, applyPreset, setPlayback, setDebug, reset, restart } }), [config, playback, debug, updateConfig, applyPreset, reset, restart]);
}
