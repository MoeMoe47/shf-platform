import React, { useEffect, useMemo, useRef } from "react";
import { publicAssetUrl } from "@/system/metaverse/metaverseNavigationModel.js";
import {
  OIL_RIG_DAY_CLOUD_PRESET,
  normalizeCloudMotionPreviewMode,
  normalizeCloudSceneConfig,
  resolveCloudWindVector,
  resolveRenderableCloudInstances,
} from "@/system/metaverse/regionalCloudAtmosphere.js";
import { recordMetaverseFrameMetric } from "@/system/metaverse/metaverseFrameProfiler.js";

const WRAP_PADDING_PX = 140;
const MAX_FRAME_DELTA_SECONDS = 0.1;

function qualityFrameInterval(quality) {
  return quality === "Low" ? 50 : quality === "Medium" ? 34 : quality === "Ultra" ? 16 : 34;
}

function wrap(value, min, max) {
  const range = max - min;
  if (range <= 0) return min;
  return ((((value - min) % range) + range) % range) + min;
}

export default function RegionalCloudAtmosphereLayer({
  sceneId,
  timeOfDay = "DAY",
  camera = { x: 0, y: 0, zoom: 1 },
  config = OIL_RIG_DAY_CLOUD_PRESET,
  playback = { playing: true, timeScale: 1, restartKey: 0 },
  reducedMotion = false,
  debug = false,
  showMotionTrail = false,
  showSkyBounds = false,
  quality = "High",
}) {
  const rootRef = useRef(null);
  const cloudRefs = useRef(new Map());
  const pausedTimeRef = useRef(0);
  const rectRef = useRef({ width: 0, height: 0 });

  const normalized = useMemo(() => normalizeCloudSceneConfig(config), [config]);
  const motionPreview = normalizeCloudMotionPreviewMode(playback.motionPreview);
  const clouds = useMemo(() => resolveRenderableCloudInstances(normalized, { reducedMotion, motionPreview }), [motionPreview, normalized, reducedMotion]);
  const windVector = useMemo(() => resolveCloudWindVector(normalized.windDirection), [normalized.windDirection]);
  const shouldRender = sceneId === normalized.sceneId && timeOfDay === normalized.timeOfDay && normalized.enabled;

  useEffect(() => {
    pausedTimeRef.current = 0;
  }, [playback.restartKey]);

  useEffect(() => {
    if (!shouldRender) return undefined;
    let animationFrame = 0;
    let lastFrame = performance.now();
    let lastDraw = 0;
    const reduceMotion = reducedMotion || playback.playing === false;
    const timeScale = Number.isFinite(Number(playback.timeScale)) ? Number(playback.timeScale) : 1;
    const readRect = () => {
      const root = rootRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      rectRef.current = { width: rect.width, height: rect.height };
    };
    readRect();
    const observer = typeof ResizeObserver !== "undefined" && rootRef.current ? new ResizeObserver(readRect) : null;
    if (observer && rootRef.current) observer.observe(rootRef.current);

    const render = (now) => {
      const start = performance.now();
      if (document.hidden) {
        animationFrame = requestAnimationFrame(render);
        return;
      }
      const minInterval = qualityFrameInterval(quality);
      if (now - lastDraw < minInterval) {
        animationFrame = requestAnimationFrame(render);
        return;
      }
      lastDraw = now;
      const root = rootRef.current;
      if (!root) return;
      const rect = rectRef.current;
      if (!rect.width || !rect.height) {
        readRect();
        animationFrame = requestAnimationFrame(render);
        return;
      }

      if (!reduceMotion) {
        const deltaSeconds = Math.min(Math.max(0, (now - lastFrame) / 1000), MAX_FRAME_DELTA_SECONDS);
        pausedTimeRef.current += deltaSeconds * timeScale;
      }
      lastFrame = now;
      const time = pausedTimeRef.current;

      clouds.forEach((cloud) => {
        const node = cloudRefs.current.get(cloud.id);
        if (!node) return;
        const widthPx = (cloud.width / 100) * rect.width;
        const image = node.querySelector("img");
        const imageRatio = image?.naturalWidth ? image.naturalHeight / image.naturalWidth : 0.34;
        const heightPx = widthPx * imageRatio;
        const minX = -widthPx - WRAP_PADDING_PX;
        const maxX = rect.width + WRAP_PADDING_PX;
        const minY = -heightPx - WRAP_PADDING_PX;
        const maxY = rect.height + WRAP_PADDING_PX;
        const skyMinY = ((cloud.skyBounds?.minY ?? 0) / 100) * rect.height;
        const skyMaxBottomY = ((cloud.skyBounds?.maxBottomY ?? normalized.cloudSkyClipY) / 100) * rect.height;
        const safeMinY = Math.max(minY, skyMinY);
        const safeMaxY = Math.max(safeMinY, Math.min(maxY, skyMaxBottomY - heightPx));
        const driftX = windVector.x * cloud.speedPxPerSecond * time;
        const driftY = windVector.y * cloud.speedPxPerSecond * time;
        const parallaxX = (camera.x || 0) * (1 - cloud.parallaxMultiplier) * -1.7;
        const parallaxY = (camera.y || 0) * (1 - cloud.parallaxMultiplier) * -0.85;
        const baseX = (cloud.x / 100) * rect.width;
        const baseY = (cloud.y / 100) * rect.height;
        const xPx = wrap(baseX + driftX + parallaxX, minX, maxX);
        const vertical = Math.sin(time * 0.055 + cloud.phase) * cloud.verticalDrift;
        const yPx = wrap(baseY + driftY + parallaxY + vertical, safeMinY, safeMaxY);
        const actualSpeed = reduceMotion ? 0 : cloud.speedPxPerSecond * timeScale;
        const directionRadians = Math.atan2(windVector.y, windVector.x);
        const trail = showMotionTrail ? node.querySelector(".met-regional-cloud__trail") : null;
        const label = debug ? node.querySelector(".met-regional-cloud__debug-label") : null;
        node.style.width = `${widthPx}px`;
        node.style.opacity = "1";
        node.style.transform = `translate3d(${xPx}px, ${yPx}px, 0)`;
        if (image) image.style.opacity = `${cloud.effectiveOpacity}`;
        if (debug) {
          node.dataset.cloudX = xPx.toFixed(2);
          node.dataset.cloudY = yPx.toFixed(2);
          node.dataset.cloudBottom = (yPx + heightPx).toFixed(2);
          node.dataset.cloudSpeed = actualSpeed.toFixed(2);
          node.dataset.cloudDirection = normalized.windDirection.toFixed(0);
          node.dataset.cloudRunning = reduceMotion ? "false" : "true";
        }
        if (trail) {
          const trailLength = Math.min(96, Math.max(20, actualSpeed * 0.9));
          trail.style.width = `${trailLength}px`;
          trail.style.transform = `rotate(${directionRadians + Math.PI}rad)`;
        }
        if (label) {
          label.textContent = `${cloud.layerId.toUpperCase()} ${cloud.id}
x: ${xPx.toFixed(1)}
y: ${yPx.toFixed(1)}
bottom: ${(yPx + heightPx).toFixed(1)}
speed: ${actualSpeed.toFixed(1)} px/s
dir: ${normalized.windDirection.toFixed(0)} deg
${reduceMotion ? "PAUSED" : "RUNNING"}`;
        }
      });

      recordMetaverseFrameMetric("clouds", performance.now() - start);
      animationFrame = requestAnimationFrame(render);
    };

    animationFrame = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(animationFrame); observer?.disconnect(); };
  }, [camera.x, camera.y, clouds, debug, normalized.cloudSkyClipY, normalized.windDirection, playback.playing, playback.timeScale, quality, reducedMotion, shouldRender, showMotionTrail, timeOfDay, windVector.x, windVector.y]);

  if (!shouldRender) return null;

  return (
    <div
      ref={rootRef}
      className="met-regional-clouds"
      data-cloud-preset={normalized.id}
      data-cloud-playing={playback.playing === false ? "false" : "true"}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      data-debug={debug ? "true" : "false"}
      data-motion-preview={motionPreview.toLowerCase()}
      data-motion-trail={showMotionTrail ? "true" : "false"}
      data-sky-bounds={showSkyBounds ? "true" : "false"}
      aria-hidden="true"
    >
      <div className="met-regional-clouds__sky-clip" style={{ clipPath: `inset(0 0 ${100 - normalized.cloudSkyClipY}% 0)` }}>
        {clouds.map((cloud) => (
          <div
            key={cloud.id}
            ref={(node) => {
              if (node) cloudRefs.current.set(cloud.id, node);
              else cloudRefs.current.delete(cloud.id);
            }}
            className="met-regional-cloud"
            data-cloud-id={cloud.id}
            data-cloud-layer={cloud.layerId}
          >
            {showMotionTrail ? <span className="met-regional-cloud__trail" aria-hidden="true" /> : null}
            <img src={publicAssetUrl(cloud.asset)} alt="" draggable="false" style={{ transform: cloud.flipX ? "scaleX(-1)" : undefined }} />
            {debug ? <span className="met-regional-cloud__debug-label" aria-hidden="true" /> : null}
          </div>
        ))}
      </div>
      {showSkyBounds ? (
        <div className="met-regional-clouds__sky-bounds" aria-hidden="true">
          <span className="met-regional-clouds__sky-line met-regional-clouds__sky-line--horizon" style={{ top: `${normalized.horizonY}%` }}>horizon {normalized.horizonY}%</span>
          {normalized.layers.map((layer) => (
            <span
              key={layer.id}
              className={`met-regional-clouds__sky-line met-regional-clouds__sky-line--${layer.id}`}
              style={{ top: `${layer.skyBounds.maxBottomY}%` }}
            >
              {layer.id} bottom {layer.skyBounds.maxBottomY}%
            </span>
          ))}
        </div>
      ) : null}
      {debug ? <div className="met-regional-clouds__debug-rig" aria-hidden="true" /> : null}
    </div>
  );
}
