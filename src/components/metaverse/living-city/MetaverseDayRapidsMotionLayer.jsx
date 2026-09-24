import React from "react";
import { DAY_RAPIDS_MOTION_ZONES, resolveDayRapidsMotionReviewEnabled } from "@/system/metaverse/dayRapidsMotionRegistry.js";
import { publicAssetUrl } from "@/system/metaverse/metaverseNavigationModel.js";

// DAY RAPIDS MOTION V2 — subtle animated overlays for the baked-in DAY
// rapids/water: two zones (the primary rapids zone, plus a secondary,
// lighter far-right water zone).
//
// DAY-only, and NOT live by default: requires a dev build plus an
// explicit `?dayRapidsMotionReview=1` (or bare `?dayRapidsMotionReview`)
// query param. Its own review flag, own registry, own component — fully
// isolated from the deferred DAY WATER / RAPIDS system, which this
// phase does not touch or reuse.
//
// MOTION MODEL: continuous one-directional flow (never
// `animation-direction: alternate`, which read as a static wobble, not
// current). Each zone is its own container (DAY_RAPIDS_MOTION_ZONES)
// sitting at the world-box position of that body of water, with
// `overflow: hidden`; every sublayer inside it is positioned as a
// PERCENTAGE OF THAT ZONE, so drift can never visually escape onto
// roads/bridges/land — this applies identically to both zones.
//
// Each sublayer is TWO nested elements: the outer div owns position and
// a STATIC rotation; the inner "glint" div owns the drift+opacity-
// crossfade animation. They must stay on separate elements — a CSS
// animation replaces the entire `transform` property for the duration
// it runs, so an inline static rotate() and an animated translate() can
// never safely share one element's `transform`.
function isDayRapidsMotionReviewEnabled() {
  if (typeof window === "undefined") return false;
  return resolveDayRapidsMotionReviewEnabled({ isDev: import.meta.env.DEV, search: window.location.search });
}

function RapidsMotionSublayer({ layer, reducedMotion }) {
  const isPulse = layer.kind === "pulse";
  const isFoam = layer.kind === "foam";
  const animationName = reducedMotion
    ? "none"
    : isPulse
      ? "metRapidsMicroPulse"
      : isFoam
        ? "metRapidsFoamFlow"
        : "metRapidsShimmerFlow";
  const animationDuration = reducedMotion
    ? undefined
    : isPulse
      ? `${layer.pulseDurationSeconds}s`
      : `${layer.driftDurationSeconds}s`;
  const animationDelay = reducedMotion
    ? undefined
    : isPulse
      ? `${layer.pulseDelaySeconds}s`
      : `${layer.driftDelaySeconds}s`;
  return (
    <div
      className={`met-day-rapids-motion__${layer.kind}`}
      data-rapids-motion-layer-id={layer.id}
      style={{
        left: `${layer.left}%`,
        top: `${layer.top}%`,
        width: `${layer.widthPct}%`,
        transform: layer.rotationDeg ? `rotate(${layer.rotationDeg}deg)` : undefined,
      }}
    >
      <img
        className="met-day-rapids-motion__glint"
        src={publicAssetUrl(layer.asset)}
        alt=""
        style={{
          filter: layer.blurPx > 0 ? `blur(${layer.blurPx}px)` : "none",
          "--met-rapids-dx": `${layer.driftDx || 0}px`,
          "--met-rapids-dy": `${layer.driftDy || 0}px`,
          "--met-rapids-opacity": layer.opacity,
          animationName,
          animationDuration,
          animationDelay,
          opacity: reducedMotion ? layer.opacity : undefined,
        }}
      />
    </div>
  );
}

export default function MetaverseDayRapidsMotionLayer({ timeOfDay = "DAY", reducedMotion = false }) {
  if (timeOfDay !== "DAY") return null;
  if (!isDayRapidsMotionReviewEnabled()) return null;
  return (
    <>
      {DAY_RAPIDS_MOTION_ZONES.map(({ id: zoneId, zone, layers }) => (
        <div
          key={zoneId}
          className="met-living-layer met-day-rapids-motion"
          aria-hidden="true"
          data-state-classification="DECORATIVE"
          data-rapids-motion-zone-id={zoneId}
          style={{
            left: `${zone.left}%`,
            top: `${zone.top}%`,
            width: `${zone.width}%`,
            height: `${zone.height}%`,
          }}
        >
          {layers.map((layer) => (
            <RapidsMotionSublayer key={layer.id} layer={layer} reducedMotion={reducedMotion} />
          ))}
        </div>
      ))}
    </>
  );
}
