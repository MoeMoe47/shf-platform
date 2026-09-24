import React from "react";
import { DAY_WATER_ELEMENTS, DAY_WATER_OVERLAY_PROOF, resolveDayWaterReviewEnabled } from "@/system/metaverse/dayWaterRegistry.js";
import { publicAssetUrl } from "@/system/metaverse/metaverseNavigationModel.js";

// DAY WATER / RAPIDS — status: DEFERRED — FINAL POLISH WATER MOTION.
//
// Both pieces below were previously promoted/reviewable at different
// points, but the whole feature has since been pulled back out of the
// normal city view pending further polish. Nothing here affects normal
// /metaverse anymore: everything in this file is gated behind
// isDayWaterReviewEnabled() (?dayWaterReview=1, dev build only), fully
// isolated from the active DAY scene (city + clouds + birds).
//
// 1. DAY_WATER_OVERLAY_PROOF — the single rapids zone that had been
//    promoted to render unconditionally on DAY; re-gated behind the
//    review flag so it no longer appears in the normal scene.
//
// 2. DAY_WATER_ELEMENTS — the separate cable-bridge streak/fleck system
//    (a different, never-promoted zone) — same review gate as before.
//
// Source assets (public/assets/metaverse/water/day/) and this component/
// registry are all left in place, untouched and unused by the normal
// scene, so review work can resume later via ?dayWaterReview=1 without
// re-deriving anything.
//
// Each streak/fleck element is TWO nested elements: the outer div owns
// position and a STATIC rotation (so it lies along the apparent flow
// direction); the inner "glint" div owns the drift+shimmer animation.
// They must stay on separate elements — a CSS animation replaces the
// entire `transform` property for the duration it runs, so an inline
// static rotate() and an animated translate() can never safely share one
// element's `transform`.
function isDayWaterReviewEnabled() {
  if (typeof window === "undefined") return false;
  return resolveDayWaterReviewEnabled({ isDev: import.meta.env.DEV, search: window.location.search });
}

export default function MetaverseDayWaterLayer({ timeOfDay = "DAY", reducedMotion = false }) {
  if (timeOfDay !== "DAY") return null;
  if (!isDayWaterReviewEnabled()) return null;
  return (
    <div className="met-living-layer met-day-water" aria-hidden="true" data-state-classification="DECORATIVE">
      {DAY_WATER_ELEMENTS.map((element) => (
        <div
          key={element.id}
          className={`met-day-water__${element.kind}`}
          data-water-element-id={element.id}
          style={{
            left: `${element.left}%`,
            top: `${element.top}%`,
            width: `${element.widthPct}%`,
            height: `${element.heightPct}%`,
            transform: element.rotationDeg ? `rotate(${element.rotationDeg}deg)` : undefined,
          }}
        >
          <div
            className="met-day-water__glint"
            style={{
              "--met-water-dx": `${element.driftDx}px`,
              "--met-water-dy": `${element.driftDy}px`,
              "--met-water-opacity": element.opacity,
              animationName: reducedMotion ? "none" : "metWaterDrift, metWaterShimmer",
              animationDuration: reducedMotion ? undefined : `${element.driftDurationSeconds}s, ${element.shimmerDurationSeconds}s`,
              animationDelay: reducedMotion ? undefined : `${element.driftDelaySeconds}s, ${element.shimmerDelaySeconds}s`,
              opacity: reducedMotion ? element.opacity : undefined,
            }}
          />
        </div>
      ))}
      {/* DEFERRED — FINAL POLISH WATER MOTION. The one previously-
          accepted rapids zone, static (no animation), real PNG only. Now
          review-only again (gated by the same isDayWaterReviewEnabled()
          check above, ?dayWaterReview=1) — does not render in the normal
          scene. Left in place, unchanged, for when this resumes. */}
      {DAY_WATER_OVERLAY_PROOF && (
        <img
          className="met-day-water__overlay-proof"
          data-water-overlay-proof={DAY_WATER_OVERLAY_PROOF.id}
          src={publicAssetUrl(DAY_WATER_OVERLAY_PROOF.asset)}
          alt=""
          style={{
            left: `${DAY_WATER_OVERLAY_PROOF.left}%`,
            top: `${DAY_WATER_OVERLAY_PROOF.top}%`,
            width: DAY_WATER_OVERLAY_PROOF.widthPx ? `${DAY_WATER_OVERLAY_PROOF.widthPx}px` : `${DAY_WATER_OVERLAY_PROOF.widthPct}%`,
            height: "auto",
            opacity: DAY_WATER_OVERLAY_PROOF.opacity,
            transform: `rotate(${DAY_WATER_OVERLAY_PROOF.rotationDeg}deg)`,
          }}
        />
      )}
    </div>
  );
}
