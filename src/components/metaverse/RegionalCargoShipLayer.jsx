import React, { useEffect, useMemo, useRef } from "react";
import { publicAssetUrl } from "@/system/metaverse/metaverseNavigationModel.js";
import {
  OIL_RIG_DAY_CARGO_SHIP_PRESET,
  normalizeCargoShipSceneConfig,
  resolveCargoShipWindVector,
  resolveRenderableCargoShips,
} from "@/system/metaverse/cargoShipRegistry.js";
import { recordMetaverseFrameMetric } from "@/system/metaverse/metaverseFrameProfiler.js";

const MAX_FRAME_DELTA_SECONDS = 0.1;

function qualityFrameInterval(quality) {
  return quality === "Low" ? 100 : quality === "Medium" ? 67 : quality === "Ultra" ? 34 : 50;
}

function wrap01(value) {
  return ((value % 1) + 1) % 1;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function routePointAt(points, progress) {
  const normalized = wrap01(progress);
  const scaled = normalized * (points.length - 1);
  const index = Math.min(points.length - 2, Math.floor(scaled));
  const local = scaled - index;
  const from = points[index];
  const to = points[index + 1];
  return { x: lerp(from.x, to.x, local), y: lerp(from.y, to.y, local) };
}

function routeSpanPx(route, width) {
  const first = route.controlPoints[0];
  const last = route.controlPoints[route.controlPoints.length - 1];
  return Math.max(1, Math.hypot(last.x - first.x, last.y - first.y) / 100 * width);
}

function routeWindFactor(route, windVector, windSpeed) {
  const first = route.controlPoints[0];
  const last = route.controlPoints[route.controlPoints.length - 1];
  const dx = last.x - first.x;
  const dy = last.y - first.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const routeDirection = { x: dx / length, y: dy / length };
  const alignment = routeDirection.x * windVector.x + routeDirection.y * windVector.y;
  return Math.max(0.72, 1 + alignment * windSpeed * route.windInfluenceMultiplier * 0.18);
}

function hideMissingAsset(event) {
  event.currentTarget.style.display = "none";
  event.currentTarget.closest(".met-regional-cargo-ship")?.setAttribute("data-asset-missing", "true");
}

export default function RegionalCargoShipLayer({
  sceneId,
  timeOfDay = "DAY",
  config = OIL_RIG_DAY_CARGO_SHIP_PRESET,
  playback = { playing: true, timeScale: 1, restartKey: 0 },
  reducedMotion = false,
  debug = false,
  showRoutes = false,
  showBounds = false,
  showLabels = false,
  quality = "High",
}) {
  const rootRef = useRef(null);
  const shipRefs = useRef(new Map());
  const elapsedRef = useRef(0);
  const rectRef = useRef({ width: 0, height: 0 });
  const normalized = useMemo(() => normalizeCargoShipSceneConfig(config), [config]);
  const renderable = useMemo(() => resolveRenderableCargoShips(normalized), [normalized]);
  const windVector = useMemo(() => resolveCargoShipWindVector(normalized.windDirection), [normalized.windDirection]);
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
    const paused = reducedMotion || playback.playing === false || normalized.motionEnabled === false;
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
      if (!paused) elapsedRef.current += Math.min(Math.max(0, (now - lastFrame) / 1000), MAX_FRAME_DELTA_SECONDS) * timeScale;
      lastFrame = now;
      const time = elapsedRef.current;

      renderable.ships.forEach((ship) => {
        const node = shipRefs.current.get(ship.id);
        if (!node) return;
        const effectiveSpeed = ship.route.speedPxPerSecond * ship.speed * normalized.globalSpeed * routeWindFactor(ship.route, windVector, normalized.windSpeed);
        const progress = ship.phase + (paused ? 0 : time * effectiveSpeed / routeSpanPx(ship.route, rect.width));
        const point = routePointAt(ship.route.controlPoints, progress);
        const bob = normalized.bobbingEnabled && !reducedMotion ? Math.sin(time * 0.32 + ship.phase * 9) * (ship.depth === "mid" ? 0.7 : 0.35) : 0;
        const xPx = (point.x / 100) * rect.width;
        const yPx = (point.y / 100) * rect.height + bob;
        const widthPx = ship.widthPx * normalized.scaleMultiplier * (ship.depth === "far" ? 1 : 1.04);
        const scaleX = ship.flipX ? -1 : 1;
        node.style.width = `${widthPx}px`;
        node.style.opacity = `${ship.opacity}`;
        node.style.transform = `translate3d(${xPx}px, ${yPx}px, 0) translate(-50%, -${ship.asset.waterline * 100}%) scaleX(${scaleX})`;
        if (debug || showLabels || showBounds) {
          node.dataset.shipX = xPx.toFixed(2);
          node.dataset.shipY = yPx.toFixed(2);
          node.dataset.shipSpeed = effectiveSpeed.toFixed(2);
          node.dataset.shipRunning = paused ? "false" : "true";
        }
      });
      recordMetaverseFrameMetric("ships", performance.now() - start);
      animationFrame = requestAnimationFrame(render);
    };

    animationFrame = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(animationFrame); observer?.disconnect(); };
  }, [debug, normalized, playback.playing, playback.timeScale, quality, reducedMotion, renderable.ships, shouldRender, showBounds, showLabels, windVector.x, windVector.y]);

  if (!shouldRender) return null;

  return (
    <div
      ref={rootRef}
      className="met-regional-cargo-ships"
      data-cargo-ship-preset={normalized.id}
      data-debug={debug || showBounds || showLabels ? "true" : "false"}
      data-show-routes={showRoutes ? "true" : "false"}
      data-show-bounds={showBounds ? "true" : "false"}
      data-show-labels={showLabels ? "true" : "false"}
      aria-hidden="true"
    >
      {showRoutes ? (
        <svg className="met-regional-cargo-ships__routes" viewBox="0 0 100 100" preserveAspectRatio="none">
          {renderable.routes.filter((route) => route.enabled).map((route) => (
            <polyline key={route.id} points={route.controlPoints.map((point) => `${point.x},${point.y}`).join(" ")} className={`met-regional-cargo-ships__route met-regional-cargo-ships__route--${route.depth}`} vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
      ) : null}
      {renderable.ships.map((ship) => (
        <div
          key={ship.id}
          ref={(node) => {
            if (node) shipRefs.current.set(ship.id, node);
            else shipRefs.current.delete(ship.id);
          }}
          className="met-regional-cargo-ship"
          data-ship-id={ship.id}
          data-depth={ship.depth}
          data-route-id={ship.route.id}
          data-asset-id={ship.asset.id}
        >
          <img src={publicAssetUrl(ship.asset.path)} alt="" draggable="false" onError={hideMissingAsset} />
          {showLabels ? <span className="met-regional-cargo-ship__label">{ship.id}<br />{ship.depth} / {ship.route.label}</span> : null}
          {showBounds ? <span className="met-regional-cargo-ship__waterline" /> : null}
        </div>
      ))}
      {debug ? <span className="met-regional-cargo-ships__legend">CARGO SHIPS · {renderable.ships.length} ACTIVE</span> : null}
    </div>
  );
}
