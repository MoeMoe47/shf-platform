import { createProjectionDiagnostic } from "./diagnostics.js";

const normalized = (value) => typeof value === "string" && /^[a-z0-9][a-z0-9._-]*$/.test(value);
const text = (value) => typeof value === "string" && value.trim().length > 0;

export function createProjectionAdapterRegistry() {
  const adapters = new Map();

  function invalid() {
    return Object.freeze({ ok: false, diagnostics: Object.freeze([createProjectionDiagnostic("INVALID_ADAPTER")]) });
  }

  function register(adapter) {
    if (!adapter || !Object.isFrozen(adapter) || typeof adapter.project !== "function" || typeof adapter.canProject !== "function") return invalid();
    const methods = ["getDomain", "getSourceAuthority", "getSupportedFeatureTypes", "getSupportedCoordinateSpaces", "getProjectionVersion"];
    if (methods.some((method) => typeof adapter[method] !== "function")) return invalid();
    const domain = adapter.getDomain();
    const sourceAuthority = adapter.getSourceAuthority();
    const featureTypes = adapter.getSupportedFeatureTypes();
    const coordinateSpaces = adapter.getSupportedCoordinateSpaces();
    const projectionVersion = adapter.getProjectionVersion();
    if (!normalized(domain) || !text(sourceAuthority) || !text(projectionVersion)) return invalid();
    if (!Array.isArray(featureTypes) || featureTypes.length === 0 || featureTypes.some((value) => !text(value))) return invalid();
    if (!Array.isArray(coordinateSpaces) || coordinateSpaces.length === 0 || coordinateSpaces.some((value) => !text(value))) return invalid();
    const keys = featureTypes.map((featureType) => `${domain}::${featureType}`);
    if (keys.some((key) => adapters.has(key))) {
      return Object.freeze({ ok: false, diagnostics: Object.freeze([createProjectionDiagnostic("ADAPTER_COLLISION")]) });
    }
    const snapshot = Object.freeze({ adapter, domain, sourceAuthority, featureTypes: Object.freeze([...featureTypes]), coordinateSpaces: Object.freeze([...coordinateSpaces]), projectionVersion });
    for (const key of keys) adapters.set(key, snapshot);
    return Object.freeze({ ok: true, adapter });
  }

  return Object.freeze({
    register,
    getAdapter(domain, featureType) {
      const entry = adapters.get(`${domain}::${featureType}`);
      return entry ? Object.freeze({ ok: true, adapter: entry.adapter }) : Object.freeze({ ok: false, diagnostics: Object.freeze([createProjectionDiagnostic("ADAPTER_NOT_FOUND")]) });
    },
    listAdapters() {
      return Object.freeze([...new Set([...adapters.values()].map((entry) => entry.adapter))]);
    },
    getSnapshot(domain, featureType) {
      return adapters.get(`${domain}::${featureType}`) || null;
    },
  });
}
