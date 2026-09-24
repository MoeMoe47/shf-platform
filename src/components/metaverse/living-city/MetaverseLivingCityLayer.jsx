import React from "react";
import {
  METAVERSE_EVENT_ZONES,
  getAmbientEffectsForScene,
  getBuildingEffectsForScene,
  getLivingCitySceneId,
} from "@/system/metaverse/livingCityRegistry.js";
import { METAVERSE_DISTRICTS } from "@/system/metaverse/metaverseNavigationModel.js";
import MetaverseAmbientLayer from "./MetaverseAmbientLayer.jsx";
import MetaverseBuildingActivityLayer from "./MetaverseBuildingActivityLayer.jsx";
import MetaverseEventOverlayLayer from "./MetaverseEventOverlayLayer.jsx";
import MetaversePresenceOverlayLayer from "./MetaversePresenceOverlayLayer.jsx";
import MetaverseRiverFlowDebugLayer from "./MetaverseRiverFlowDebugLayer.jsx";
import MetaverseRoadTraceDebugLayer from "./MetaverseRoadTraceDebugLayer.jsx";
import MetaverseTimeOfDayLayer from "./MetaverseTimeOfDayLayer.jsx";
import MetaverseWeatherLayer from "./MetaverseWeatherLayer.jsx";
import MetaverseWeatherEnvironmentLayer from "../MetaverseWeatherEnvironmentLayer.jsx";
import MetaverseDayWaterLayer from "./MetaverseDayWaterLayer.jsx";
import MetaverseDayRapidsMotionLayer from "./MetaverseDayRapidsMotionLayer.jsx";
import MetaverseDayCloudLayer from "./MetaverseDayCloudLayer.jsx";
import MetaverseDayBirdLayer from "./MetaverseDayBirdLayer.jsx";
import MetaverseTrafficCorridorLayer from "../traffic/MetaverseTrafficCorridorLayer.jsx";
import MetaverseTrafficAllRoutesReviewLayer from "../traffic/MetaverseTrafficAllRoutesReviewLayer.jsx";
import useMetaverseTrafficCorridor from "@/hooks/metaverse/useMetaverseTrafficCorridor.js";
import useMetaverseTrafficAllRoutesReview from "@/hooks/metaverse/useMetaverseTrafficAllRoutesReview.js";
import {
  resolveTrafficAllRoutesReviewEnabled,
  resolveTrafficCorridorReviewEnabled,
} from "@/system/metaverse/traffic/metaverseTrafficCorridorRuntime.js";

// MET-15K — the runtime-traced vehicle/traffic layer (MetaverseVehicleLayer,
// MetaverseTrafficLayer) and the runtime-traced river-motion/rapids layer
// (MetaverseRiverMotionLayer) are RETIRED_FROM_PRODUCTION: vehicle alignment
// read as visibly inaccurate and the traced water motion did not read as
// convincing, so both are deliberately not imported or mounted here. The
// underlying trace geometry (metaverseRoadTraceRegistry.js,
// metaverseRiverFlowRegistry.js, livingCityRegistry.js's traffic paths) and
// pure motion math (metaverseVehicleMotion.js, metaverseRiverMotionPresentation.js)
// are kept as DEBUG/REFERENCE ONLY for the future Cinematic Living City
// Layer (MET-16) — see docs/metaverse/MET-15K_CLEANUP_NOTES.md. The two
// *DebugLayer components below stay mounted because they are already
// dev-build + explicit-query-param gated (?roadTraceDebug=1 /
// ?riverFlowDebug=1) and never render for a normal learner.

function isRoadTraceDebugEnabled() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("roadTraceDebug");
}

function isRiverFlowDebugEnabled() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("riverFlowDebug");
}

// MET-16B — owner decision: the corridor stays behind its own explicit
// review flag (dev build + `?trafficCorridorReview=1`) rather than
// defaulting on in normal city view, until the owner has visually
// approved its motion. This is a SEPARATE gate from `?trafficAuthor=1`
// (resolveTrafficAuthoringEnabled) — flipping one must never affect the
// other, and once approved, this is the one line that changes to make the
// corridor the normal-view default.
function isTrafficCorridorReviewEnabled() {
  if (typeof window === "undefined") return false;
  return resolveTrafficCorridorReviewEnabled({ isDev: import.meta.env.DEV, search: window.location.search });
}

// MET-16C — same shape as isTrafficCorridorReviewEnabled above, its own
// independent flag (`?trafficAllRoutesReview=1`). Both can technically be
// on at once (nothing about this couples or excludes the other), but
// neither one being on ever implies the other, and neither implies
// `?trafficAuthor=1`.
function isTrafficAllRoutesReviewEnabled() {
  if (typeof window === "undefined") return false;
  return resolveTrafficAllRoutesReviewEnabled({ isDev: import.meta.env.DEV, search: window.location.search });
}

export default function MetaverseLivingCityLayer({
  level,
  districtId,
  facilityId,
  reducedMotion = false,
  performanceMode = "STANDARD",
  timeOfDay = "DUSK",
  weather = "CLEAR",
  environment = null,
  cityCounts = [],
  events = [],
  activity = {},
}) {
  const sceneId = getLivingCitySceneId({ level, districtId, facilityId });
  const ambientEffects = getAmbientEffectsForScene(sceneId);
  const buildingEffects = getBuildingEffectsForScene(sceneId);

  const trafficCorridorEnabled = isTrafficCorridorReviewEnabled();
  const trafficCorridor = useMetaverseTrafficCorridor({ enabled: trafficCorridorEnabled, reducedMotion });

  const trafficAllRoutesReviewEnabled = isTrafficAllRoutesReviewEnabled();
  const trafficAllRoutesReview = useMetaverseTrafficAllRoutesReview({ enabled: trafficAllRoutesReviewEnabled, reducedMotion });

  return (
    <div
      className="met-living-city"
      data-scene-id={sceneId}
      data-time-of-day={timeOfDay.toLowerCase()}
      data-performance-mode={performanceMode}
      data-authority="presentation-only"
      data-traffic="RETIRED_FROM_PRODUCTION"
      data-river-motion="RETIRED_FROM_PRODUCTION"
    >
      <MetaverseTimeOfDayLayer timeOfDay={timeOfDay} />
      {/* DAY WATER / RAPIDS V1 — deliberately BEFORE clouds (required
          layer order: city plate -> water motion/rapids -> clouds ->
          birds -> markers -> UI), so the water highlight sits directly
          on the background plate, below every other decorative layer.
          Own review gate (?dayWaterReview=1, dev build only) inside the
          component itself — renders nothing at all unless that's set. */}
      <MetaverseDayWaterLayer timeOfDay={timeOfDay} reducedMotion={reducedMotion} />
      {/* DAY RAPIDS MOTION V1 — subtle animated overlay for the rapids
          already baked into the DAY city plate. Own review gate
          (?dayRapidsMotionReview=1, dev build only), own registry, own
          component — fully isolated from the deferred DAY WATER /
          RAPIDS system directly above. Same early position (before
          clouds) so it paints on the background plate, below every
          other decorative layer. */}
      <MetaverseDayRapidsMotionLayer timeOfDay={timeOfDay} reducedMotion={reducedMotion} />
      {/* DAY CLOUD PLACEMENT V1 — deliberately BEFORE ambient/weather/
          building/event/presence/traffic in DOM order (layer order
          section: city plate -> far sky clouds -> skyline band ->
          right-city -> left-city -> traffic/birds/rapids -> markers ->
          UI), so clouds sit visually behind everything else this
          component composes, and structurally behind district markers/UI
          (rendered later, as siblings, outside this component entirely —
          see MetaverseCamera.jsx). */}
      <MetaverseDayCloudLayer timeOfDay={timeOfDay} reducedMotion={reducedMotion} />
      <MetaverseAmbientLayer effects={ambientEffects} weather={weather} timeOfDay={timeOfDay} performanceMode={performanceMode} />
      {environment ? <MetaverseWeatherEnvironmentLayer environment={environment} reducedMotion={reducedMotion} sceneId={sceneId} /> : <MetaverseWeatherLayer weather={weather} reducedMotion={reducedMotion} />}
      <MetaverseBuildingActivityLayer effects={buildingEffects} activity={activity} />
      <MetaverseEventOverlayLayer events={events} zones={METAVERSE_EVENT_ZONES} />
      <MetaversePresenceOverlayLayer counts={cityCounts} districts={METAVERSE_DISTRICTS} />
      <MetaverseTrafficCorridorLayer
        enabled={trafficCorridor.enabled}
        renderedVehicles={trafficCorridor.renderedVehicles}
        timeOfDay={timeOfDay}
      />
      <MetaverseTrafficAllRoutesReviewLayer
        enabled={trafficAllRoutesReview.enabled}
        renderedVehicles={trafficAllRoutesReview.renderedVehicles}
        timeOfDay={timeOfDay}
        routeCount={trafficAllRoutesReview.routes.length}
        skippedRoutes={trafficAllRoutesReview.skippedRoutes}
      />
      {/* MET-17 DAY BIRD LAYER V1 — after traffic, before markers/UI, per
          the layer-order note above (city plate -> clouds -> traffic/
          birds/rapids -> markers -> UI). Own review gate
          (?dayBirdsReview=1, dev build only) inside the component itself
          — renders nothing at all unless that's set, so this mount is a
          no-op in every other view. */}
      <MetaverseDayBirdLayer timeOfDay={timeOfDay} reducedMotion={reducedMotion} />
      <MetaverseRoadTraceDebugLayer sceneId={sceneId} enabled={isRoadTraceDebugEnabled()} />
      <MetaverseRiverFlowDebugLayer sceneId={sceneId} enabled={isRiverFlowDebugEnabled()} />
    </div>
  );
}
