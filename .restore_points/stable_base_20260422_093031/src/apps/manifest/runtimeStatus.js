import { loadManifest } from "./index.js";
import { buildOpenHref } from "./href.js";
import { getAppOverrides } from "./overrides.js";

function safeCountOverrides() {
  try {
    const ov = getAppOverrides();
    return ov && typeof ov === "object" ? Object.keys(ov).length : 0;
  } catch {
    return 0;
  }
}

function safeContractVersion() {
  try {
    const fromDataset = document?.documentElement?.dataset?.contractVersion;
    if (fromDataset) return String(fromDataset);
  } catch {}
  try {
    const v = window?.__APP__?.manifest?.contractVersion;
    if (v !== undefined && v !== null) return String(v);
  } catch {}
  return "?";
}

// Simple, reliable mode indicator:
// - PROD build => LIVE
// - DEV => DEV
export function getRuntimeModeLabel() {
  try {
    return import.meta.env.PROD ? "LIVE" : "DEV";
  } catch {
    return "LIVE";
  }
}

// Admin app "open" href derived from manifest
export function getAdminHref() {
  try {
    const m = loadManifest("admin");
    const href = buildOpenHref(m);
    return href || "/admin.html#/app-registry";
  } catch {
    return "/admin.html#/app-registry";
  }
}

export function getControlPlaneStatus() {
  return {
    mode: getRuntimeModeLabel(),
    overridesCount: safeCountOverrides(),
    contractVersion: safeContractVersion(),
    adminHref: getAdminHref()
  };
}
