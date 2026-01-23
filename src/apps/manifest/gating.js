import { getMode } from "@/runtime/mode.js";

export function getGateReason(manifest, mode = null) {
  const m = manifest || {};
  const shf = m?.meta?.shf || {};
  const curMode = String(mode || getMode() || "PILOT").toUpperCase();

  if (curMode === "PILOT" && shf.systemOnly) return "SYSTEM_ONLY";
  if (curMode === "SYSTEM" && shf.pilotOnly) return "PILOT_ONLY";
  return null;
}

export function isGated(manifest, mode = null) {
  return !!getGateReason(manifest, mode);
}
