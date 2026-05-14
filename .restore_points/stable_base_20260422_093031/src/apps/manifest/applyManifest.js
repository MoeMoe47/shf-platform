import { getMode } from "@/runtime/mode.js";
import { resolveAppEnabledWithSource } from "./overrides.js";

export function applyManifest(manifest) {
  const mode = getMode();
  const { enabled, source } =
    resolveAppEnabledWithSource(manifest.id, manifest);

  if (mode === "PILOT" && manifest?.meta?.shf?.systemOnly) {
    return {
      ...manifest,
      enabled: false,
      gatedBy: "SYSTEM_ONLY"
    };
  }

  if (mode === "SYSTEM" && manifest?.meta?.shf?.pilotOnly) {
    return {
      ...manifest,
      enabled: false,
      gatedBy: "PILOT_ONLY"
    };
  }

  return {
    ...manifest,
    enabled,
    enabledSource: source
  };
}
