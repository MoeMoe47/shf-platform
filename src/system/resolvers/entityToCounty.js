export function resolveCountyFromEntity(entityId) {
  if (!entityId) return null;

  // TEMP mapping (replace later with real data)
  if (entityId.includes("001")) return "franklin";
  if (entityId.includes("002")) return "cuyahoga";
  if (entityId.includes("003")) return "hamilton";

  return "franklin";
}
