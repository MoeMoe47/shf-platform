import React from "react";
import { publicAssetUrl } from "@/system/metaverse/metaverseNavigationModel.js";

function resolveForegroundAsset(layer, timeOfDay) {
  if (!layer) return null;
  const mode = String(timeOfDay || "DAY").toUpperCase();
  if (Array.isArray(layer.availableTimeModes) && !layer.availableTimeModes.includes(mode)) return null;
  if (mode === "DAY" && layer.dayAsset) return layer.dayAsset;
  if (mode === "DUSK" && layer.duskAsset) return layer.duskAsset;
  if (mode === "NIGHT" && layer.nightAsset) return layer.nightAsset;
  return layer.asset || null;
}

export default function RegionalForegroundDepthLayer({
  scene,
  timeOfDay = "DAY",
  enabled = true,
  debug = false,
}) {
  const layer = scene?.foregroundLayer;
  const assetPath = enabled ? resolveForegroundAsset(layer, timeOfDay) : null;
  if (!assetPath) return null;

  return (
    <div
      className="met-regional-foreground-depth"
      data-foreground-layer-id={layer.id}
      data-foreground-role={layer.role}
      data-debug={debug ? "true" : "false"}
      aria-hidden="true"
    >
      <img src={publicAssetUrl(assetPath)} alt="" draggable="false" />
      {debug ? <span className="met-regional-foreground-depth__bounds" aria-hidden="true" /> : null}
    </div>
  );
}
