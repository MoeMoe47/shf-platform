function stableValue(value) {
  if (Array.isArray(value)) return `[${value.map(stableValue).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableValue(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function canonicalizeRegionalPolygon(polygon) {
  const coordinates = polygon?.type === "Polygon" ? polygon.coordinates : null;
  if (!Array.isArray(coordinates)) return null;
  return {
    type: "Polygon",
    coordinates: coordinates.map((ring) => ring.map(([x, y]) => [x, y])),
  };
}

// A deterministic, synchronous content hash keeps the authoring UI portable
// across browser and Node test environments without introducing persistence or
// a crypto dependency. It is an integrity identifier, not an authorization
// signature.
export function hashRegionalSceneGeometry(polygon) {
  const canonical = canonicalizeRegionalPolygon(polygon);
  if (!canonical) return null;
  return hashRegionalSceneText(stableValue(canonical));
}

export function hashRegionalSceneText(input) {
  let hash = 0xcbf29ce484222325n;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= BigInt(input.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, "0");
}

export function hashRegionalSceneAssetFamily({ sceneId, variants, alignmentStandard }) {
  const input = stableValue({ sceneId, variants, alignmentStandard });
  return hashRegionalSceneText(input);
}
