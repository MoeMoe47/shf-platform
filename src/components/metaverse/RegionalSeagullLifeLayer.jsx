import React, { useEffect, useMemo, useRef } from "react";
import { publicAssetUrl } from "@/system/metaverse/metaverseNavigationModel.js";
import {
  OIL_RIG_DAY_SEAGULL_PRESET,
  SEAGULL_ASSETS,
  normalizeSeagullSceneConfig,
  resolveRenderableSeagulls,
  resolveSeagullWindVector,
} from "@/system/metaverse/seagullRegistry.js";
import { recordMetaverseFrameMetric } from "@/system/metaverse/metaverseFrameProfiler.js";

const MAX_FRAME_DELTA_SECONDS = 0.1;
const FLYING_POSES = [
  SEAGULL_ASSETS.flying.glide,
  SEAGULL_ASSETS.flying.wingsRaised,
  SEAGULL_ASSETS.flying.glideDown,
  SEAGULL_ASSETS.flying.glide,
  SEAGULL_ASSETS.flying.bank,
  SEAGULL_ASSETS.flying.glide,
];

function qualityFrameInterval(quality) {
  return quality === "Low" ? 50 : quality === "Medium" ? 34 : quality === "Ultra" ? 16 : 34;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function wrap01(value) {
  return ((value % 1) + 1) % 1;
}

function pathPointAt(points, progress) {
  if (!points.length) return { x: 0, y: 0, angle: 0 };
  if (points.length === 1) return { ...points[0], angle: 0 };
  const clamped = wrap01(progress);
  const scaled = clamped * (points.length - 1);
  const index = Math.min(points.length - 2, Math.floor(scaled));
  const local = scaled - index;
  const a = points[index];
  const b = points[index + 1];
  return {
    x: lerp(a.x, b.x, local),
    y: lerp(a.y, b.y, local),
    angle: Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI),
  };
}

function poseAssetFor({ time, phase, glideAmount, flapFrequency }) {
  const flapWindow = Math.max(0.08, (1 - glideAmount) * 0.52);
  const cycle = wrap01(time * Math.max(0.05, flapFrequency) + phase);
  if (cycle > flapWindow) return SEAGULL_ASSETS.flying.glide;
  const index = Math.floor((cycle / flapWindow) * FLYING_POSES.length);
  return FLYING_POSES[Math.min(FLYING_POSES.length - 1, index)];
}

function hideMissingAsset(event) {
  event.currentTarget.style.display = "none";
  event.currentTarget.closest(".met-regional-seagull")?.setAttribute("data-asset-missing", "true");
}

export default function RegionalSeagullLifeLayer({
  sceneId,
  timeOfDay = "DAY",
  config = OIL_RIG_DAY_SEAGULL_PRESET,
  playback = { playing: true, timeScale: 1, restartKey: 0 },
  reducedMotion = false,
  debug = false,
  showFlightPaths = false,
  showPerchAnchors = false,
  depthMode = "all",
  quality = "High",
}) {
  const rootRef = useRef(null);
  const flyingRefs = useRef(new Map());
  const perchedRefs = useRef(new Map());
  const elapsedRef = useRef(0);
  const rectRef = useRef({ width: 0, height: 0 });

  const normalized = useMemo(() => normalizeSeagullSceneConfig(config), [config]);
  const renderable = useMemo(() => {
    const next = resolveRenderableSeagulls(normalized);
    if (depthMode === "behindRig") {
      return {
        ...next,
        flying: next.flying.filter((bird) => bird.depth !== "near"),
        perched: [],
        flightPaths: next.flightPaths.filter((path) => path.depth !== "near"),
      };
    }
    if (depthMode === "frontRig") {
      return {
        ...next,
        flying: next.flying.filter((bird) => bird.depth === "near"),
        flightPaths: next.flightPaths.filter((path) => path.depth === "near"),
      };
    }
    return next;
  }, [depthMode, normalized]);
  const windVector = useMemo(() => resolveSeagullWindVector(normalized.windDirection), [normalized.windDirection]);
  const shouldRender = normalized.enabled && sceneId === normalized.sceneId && timeOfDay === normalized.timeOfDay;

  useEffect(() => {
    elapsedRef.current = 0;
  }, [playback.restartKey]);

  useEffect(() => {
    if (!shouldRender) return undefined;
    let animationFrame = 0;
    let lastFrame = performance.now();
    let lastDraw = 0;
    const timeScale = Number.isFinite(Number(playback.timeScale)) ? Number(playback.timeScale) : 1;
    const paused = reducedMotion || playback.playing === false;
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
      if (!paused) {
        elapsedRef.current += Math.min(Math.max(0, (now - lastFrame) / 1000), MAX_FRAME_DELTA_SECONDS) * timeScale;
      }
      lastFrame = now;
      const time = elapsedRef.current;

      renderable.flying.forEach((bird) => {
        const node = flyingRefs.current.get(bird.id);
        if (!node) return;
        const speed = bird.speed * normalized.globalSpeed * 0.018;
        const progress = bird.phase + time * speed;
        const point = pathPointAt(bird.path.controlPoints, progress);
        const widthPx = bird.widthPx * normalized.scaleMultiplier;
        const windNudgeX = windVector.x * normalized.windSpeed * normalized.windInfluence * bird.path.windInfluenceMultiplier * 20;
        const windNudgeY = windVector.y * normalized.windSpeed * normalized.windInfluence * bird.path.windInfluenceMultiplier * 8;
        const bob = Math.sin(time * 0.9 + bird.phase * 10) * (bird.depth === "near" ? 1.6 : bird.depth === "mid" ? 1.1 : 0.7);
        const xPx = (point.x / 100) * rect.width + windNudgeX;
        const yPx = (point.y / 100) * rect.height + windNudgeY + bob;
        const pose = poseAssetFor({ time, phase: bird.phase, glideAmount: normalized.glideAmount, flapFrequency: normalized.flapFrequency });
        const image = node.querySelector("img");
        if (image && image.dataset.poseAsset !== pose) {
          image.src = publicAssetUrl(pose);
          image.dataset.poseAsset = pose;
        }
        const flip = Math.cos((point.angle * Math.PI) / 180) < 0 ? -1 : 1;
        node.style.width = `${widthPx}px`;
        node.style.opacity = `${bird.opacity}`;
        node.style.transform = `translate3d(${xPx}px, ${yPx}px, 0) rotate(${point.angle * 0.28 + bird.bank}deg) scaleX(${flip})`;
        if (debug) {
          node.dataset.seagullX = xPx.toFixed(2);
          node.dataset.seagullY = yPx.toFixed(2);
          node.dataset.seagullRunning = paused ? "false" : "true";
        }
      });

      renderable.perched.forEach((bird) => {
        const node = perchedRefs.current.get(bird.id);
        if (!node) return;
        const anchor = bird.anchor;
        const idle = Math.sin(time * 0.7 + bird.idlePhase * 10) * (reducedMotion ? 0 : 0.7);
        const widthPx = anchor.widthPx * bird.scale * normalized.scaleMultiplier;
        const xPx = (anchor.x / 100) * rect.width;
        const yPx = (anchor.y / 100) * rect.height;
        node.style.width = `${widthPx}px`;
        node.style.transform = `translate3d(${xPx}px, ${yPx + idle}px, 0) translate(-50%, -100%) rotate(${anchor.rotation + idle * 0.22}deg)`;
        if (debug || showPerchAnchors) node.dataset.perchAnchor = anchor.id;
      });

      recordMetaverseFrameMetric("birds", performance.now() - start);
      animationFrame = requestAnimationFrame(render);
    };

    animationFrame = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(animationFrame); observer?.disconnect(); };
  }, [debug, normalized, playback.playing, playback.timeScale, quality, reducedMotion, renderable.flying, renderable.perched, shouldRender, showPerchAnchors, windVector.x, windVector.y]);

  if (!shouldRender) return null;

  return (
    <div
      ref={rootRef}
      className={`met-regional-seagulls met-regional-seagulls--${depthMode}`}
      data-seagull-preset={normalized.id}
      data-debug={debug ? "true" : "false"}
      data-show-flight-paths={showFlightPaths ? "true" : "false"}
      data-show-perch-anchors={showPerchAnchors ? "true" : "false"}
      aria-hidden="true"
    >
      {showFlightPaths ? (
        <svg className="met-regional-seagulls__paths" viewBox="0 0 100 100" preserveAspectRatio="none">
          {renderable.flightPaths.filter((path) => path.enabled).map((path) => (
            <polyline
              key={path.id}
              points={path.controlPoints.map((point) => `${point.x},${point.y}`).join(" ")}
              className={`met-regional-seagulls__path met-regional-seagulls__path--${path.depth}`}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      ) : null}
      {renderable.flying.map((bird) => (
        <div
          key={bird.id}
          ref={(node) => {
            if (node) flyingRefs.current.set(bird.id, node);
            else flyingRefs.current.delete(bird.id);
          }}
          className="met-regional-seagull met-regional-seagull--flying"
          data-seagull-id={bird.id}
          data-depth={bird.depth}
        >
          <img src={publicAssetUrl(SEAGULL_ASSETS.flying.glide)} data-pose-asset={SEAGULL_ASSETS.flying.glide} alt="" draggable="false" onError={hideMissingAsset} />
          {debug ? <span className="met-regional-seagull__label">{bird.id}<br />{bird.depth}</span> : null}
        </div>
      ))}
      {showPerchAnchors && depthMode !== "behindRig" ? (
        <div className="met-regional-seagulls__anchors">
          {renderable.perchAnchors.map((anchor) => (
            <span
              key={anchor.id}
              className="met-regional-seagulls__anchor"
              data-enabled={anchor.enabled ? "true" : "false"}
              style={{ left: `${anchor.x}%`, top: `${anchor.y}%` }}
            >
              {anchor.label}
            </span>
          ))}
        </div>
      ) : null}
      {renderable.perched.map((bird) => (
        <div
          key={bird.id}
          ref={(node) => {
            if (node) perchedRefs.current.set(bird.id, node);
            else perchedRefs.current.delete(bird.id);
          }}
          className="met-regional-seagull met-regional-seagull--perched"
          data-seagull-id={bird.id}
          data-depth={bird.anchor.depth}
        >
          <img src={publicAssetUrl(SEAGULL_ASSETS.perched[bird.asset])} alt="" draggable="false" onError={hideMissingAsset} />
          {debug ? <span className="met-regional-seagull__label">{bird.id}<br />{bird.anchor.label}</span> : null}
        </div>
      ))}
    </div>
  );
}
