export const APP_CONTRACT_VERSION = 1;

/**
 * Minimal stable contract.
 * Every app manifest must satisfy this shape.
 */
export function normalizeManifest(raw) {
  if (!raw || typeof raw !== "object") throw new Error("manifest is not an object");

  const m = {
    version: APP_CONTRACT_VERSION,
    id: String(raw.id || "").trim(),
    name: String(raw.name || raw.id || "").trim(),
    entry: String(raw.entry || "").trim(),
    routes: String(raw.routes || "").trim(),
    layout: String(raw.layout || "").trim(),
    capabilities: Array.isArray(raw.capabilities) ? raw.capabilities.map(String) : [],
  };

  if (!m.id) throw new Error("manifest missing id");
  if (!m.entry) throw new Error(`manifest(${m.id}) missing entry`);
  if (!m.routes) throw new Error(`manifest(${m.id}) missing routes`);
  if (!m.layout) throw new Error(`manifest(${m.id}) missing layout`);

  return m;
}
