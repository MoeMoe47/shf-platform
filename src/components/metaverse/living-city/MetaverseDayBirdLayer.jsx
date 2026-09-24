import React from "react";
import { DAY_BIRDS } from "@/system/metaverse/dayBirdRegistry.js";
import { publicAssetUrl } from "@/system/metaverse/metaverseNavigationModel.js";

// DAY BIRD PLACEMENT V1 — realistic, subtle, DAY-only bird layer.
//
// PROMOTED TO NORMAL DAY SCENE — visually accepted, now renders
// automatically whenever timeOfDay === "DAY", no review flag required.
// (dayBirdRegistry.js still exports resolveDayBirdsReviewEnabled and
// ?dayBirdsReview=1 is still harmlessly accepted as a URL param by
// MetaverseCityPage.jsx's forced-DAY review logic — it just no longer
// gates whether this layer renders.)
//
// Renders REAL transparent PNG bird assets (dayBirdRegistry.js /
// public/assets/metaverse/birds/day/) via plain <img> — deliberately NOT
// CSS/SVG-generated shapes, per this phase's explicit requirement.
//
// Structurally separate from MetaverseDayCloudLayer.jsx and the traffic
// layers: its own registry, its own CSS classes (.met-day-bird*) and
// keyframes (metBirdDrift / metBirdVerticalDrift), mounted as its own
// sibling in MetaverseLivingCityLayer.jsx.
//
// Each bird is TWO nested elements, same reasoning as Day Clouds: the
// outer div owns the horizontal drift transform, the inner element owns
// the vertical bob transform, so the two independently-timed animations
// don't fight over the same CSS property on one element.
export default function MetaverseDayBirdLayer({ timeOfDay = "DAY", reducedMotion = false }) {
  if (timeOfDay !== "DAY") return null;
  return (
    <div className="met-living-layer met-day-birds" aria-hidden="true" data-state-classification="DECORATIVE">
      {DAY_BIRDS.map((bird) => (
        <div
          key={bird.id}
          className="met-day-bird"
          data-bird-id={bird.id}
          data-bird-group={bird.group}
          style={{
            left: `${bird.left}%`,
            top: `${bird.top}%`,
            width: `${bird.widthPx}px`,
            "--met-bird-drift-start": `${bird.driftStartPx}px`,
            "--met-bird-drift-end": `${bird.driftEndPx}px`,
            animationName: reducedMotion ? "none" : "metBirdDrift",
            animationDuration: `${bird.durationSeconds}s`,
            animationDelay: reducedMotion ? undefined : `${bird.driftDelaySeconds}s`,
          }}
        >
          <div
            className="met-day-bird__bob"
            style={{
              "--met-bird-v-amp": `${bird.verticalDrift.amplitudePx}px`,
              animationName: reducedMotion ? "none" : "metBirdVerticalDrift",
              animationDuration: `${bird.verticalDrift.durationSeconds}s`,
            }}
          >
            <img
              className="met-day-bird__image"
              src={publicAssetUrl(bird.asset)}
              alt=""
              style={{
                opacity: bird.opacity,
                filter: bird.blurPx > 0 ? `blur(${bird.blurPx}px)` : "none",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
