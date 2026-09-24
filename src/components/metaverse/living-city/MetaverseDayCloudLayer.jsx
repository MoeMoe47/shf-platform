import React from "react";
import { DAY_CLOUD_ROLES, resolveDayCloudCompanions } from "@/system/metaverse/dayCloudRegistry.js";
import { publicAssetUrl } from "@/system/metaverse/metaverseNavigationModel.js";

// DAY CLOUD PLACEMENT V1.
//
// DAY-only: this component renders nothing for DUSK/NIGHT. No Dusk/Night
// cloud assets exist and none are referenced here.
//
// Positioned in the SAME scene-percentage coordinate box every other
// living-city layer shares with the background plate and markers (see
// MetaverseLivingCityLayer.jsx's own .met-living-layer convention, and
// MetaverseCamera.jsx's worldBoxStyle) — panning/zooming the camera moves
// clouds exactly like the city plate, never pinned to the raw viewport.
//
// Each cloud is TWO nested elements so its two independent motions (a
// slow, one-directional horizontal drift with a per-cloud pixel range;
// a tiny, alternating ease-in-out vertical bob) can each own the
// `transform` property without fighting each other — a single element
// cannot run two independently-timed keyframe animations on the same
// CSS property at once. The outer div is the scene-anchored, horizontally
// drifting element; the inner <img> only bobs vertically.
//
// Reduced motion: reuses the SAME `reducedMotion` prop every other
// living-city layer already receives (from useReducedMotion() in
// MetaverseCityPage.jsx) rather than adding a second detection path. When
// true, both animations are simply omitted (not frozen at their CSS
// keyframe endpoint) — the horizontal keyframe's start/end are
// deliberately off-screen for the drift-loop mechanism, so freezing there
// via the site-wide prefers-reduced-motion CSS rule would make every
// cloud disappear; omitting the animation instead leaves each cloud
// sitting at its real anchored position, fully visible and static.
//
// DAY CLOUD VISIBILITY DIAGNOSTIC fix: the horizontal drift also gets a
// negative animationDelay (cloud.driftDelaySeconds, see
// dayCloudRegistry.js) so playback starts already at the cloud's approved
// anchor position instead of at the off-screen `from` keyframe — without
// it every cloud was invisible for up to ~93s after page load.
//
// cloudDebug (DAY CLOUD VISIBILITY DIAGNOSTIC, temporary): `?cloudDebug=1`
// renders every cloud at opacity 1, unblurred, with a visible outline at
// its exact registered left/top/width, animation frozen (no drift/bob) —
// proves each asset loads, is positioned, and paints above the plate,
// without touching production values (the param is absent by default).
function isCloudDebugEnabled() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("cloudDebug");
}

// Shared renderer for both a primary cloud and a companion cloud: same
// two-nested-element structure, same drift/bob mechanics. `driftKeyframeId`
// is the primary's own id for a primary, or the PARENT's id for a
// companion (see resolveDayCloudCompanions() in dayCloudRegistry.js) —
// reusing the parent's exact `metCloudDrift-<id>` keyframe is what keeps
// a companion moving in lockstep with its primary instead of running its
// own independently-timed motion.
function CloudElement({ cloud, driftKeyframeId, isCompanion, debugEnabled, animationsFrozen }) {
  return (
    <div
      className={debugEnabled ? "met-day-cloud met-day-cloud--debug" : "met-day-cloud"}
      data-cloud-role={cloud.role}
      data-cloud-id={cloud.id}
      data-cloud-companion={isCompanion ? "true" : undefined}
      data-cloud-parent-id={isCompanion ? cloud.parentId : undefined}
      style={{
        left: `${cloud.left}%`,
        top: `${cloud.top}%`,
        width: `${cloud.width}%`,
        animationName: animationsFrozen ? "none" : `metCloudDrift-${driftKeyframeId}`,
        animationDuration: `${cloud.durationSeconds}s`,
        animationDelay: animationsFrozen ? undefined : `${cloud.driftDelaySeconds}s`,
      }}
    >
      <img
        className="met-day-cloud__image"
        src={publicAssetUrl(cloud.asset)}
        alt=""
        style={{
          opacity: debugEnabled ? 1 : cloud.opacity,
          filter: debugEnabled ? "none" : `blur(${cloud.blurPx}px)`,
          "--met-cloud-v-amp": `${cloud.verticalDrift.amplitudePx}px`,
          animationName: animationsFrozen ? "none" : "metCloudVerticalDrift",
          animationDuration: `${cloud.verticalDrift.durationSeconds}s`,
        }}
      />
    </div>
  );
}

export default function MetaverseDayCloudLayer({ timeOfDay = "DAY", reducedMotion = false }) {
  if (timeOfDay !== "DAY") return null;
  const debugEnabled = isCloudDebugEnabled();
  const animationsFrozen = reducedMotion || debugEnabled;
  const companions = resolveDayCloudCompanions();
  return (
    <div className="met-living-layer met-day-clouds" aria-hidden="true" data-state-classification="DECORATIVE">
      {/* DAY CLOUD THICKNESS TUNING V1.1 — companions painted first (DOM
          order, no z-index on this layer) so every companion sits BEHIND
          its primary cloud, per the layering requirement: city background
          -> cloud companions -> primary clouds -> birds/other living-city
          layers -> district labels/UI. */}
      {companions.map((companion) => (
        <CloudElement
          key={companion.id}
          cloud={companion}
          driftKeyframeId={companion.parentId}
          isCompanion
          debugEnabled={debugEnabled}
          animationsFrozen={animationsFrozen}
        />
      ))}
      {DAY_CLOUD_ROLES.map((cloud) => (
        <CloudElement
          key={cloud.id}
          cloud={cloud}
          driftKeyframeId={cloud.id}
          isCompanion={false}
          debugEnabled={debugEnabled}
          animationsFrozen={animationsFrozen}
        />
      ))}
    </div>
  );
}
