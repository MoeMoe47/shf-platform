import { parseSpatialDurationMs } from "../../../shared/spatial/contracts/duration.js";

export function evaluateFreshness(temporal = {}, layer, now) {
  if (temporal.freshness === "stale") return "STALE";
  if (temporal.freshness === "current") return "CURRENT";
  if (layer?.maxSourceAge && temporal.sourceTimestamp) {
    const age = parseSpatialDurationMs(layer.maxSourceAge);
    const timestamp = Date.parse(temporal.sourceTimestamp);
    if (age !== null && !Number.isNaN(timestamp) && now.getTime() - timestamp > age) return "STALE";
    if (age !== null && !Number.isNaN(timestamp)) return "CURRENT";
  }
  return "UNKNOWN";
}
