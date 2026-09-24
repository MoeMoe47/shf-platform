// Frontend compatibility projection for the server-owned destination IDs.
// Geometry remains in the navigation and minimap registries; route/status
// metadata remains owned by the server city registry.
export const CANONICAL_DESTINATION_IDS = Object.freeze([
  "city-hall", "council-chamber", "clerk-office", "planning-department", "public-works-office", "community-development-office",
  "career-center", "learning-center", "credential-portfolio-center", "career-pathway-center",
  "main-data-center", "network-operations-center", "power-electrical-facility", "cooling-mechanical-plant", "security-operations-center", "ai-compute-facility", "data-center-training-lab",
  "arcade-hub", "simulation-hall", "skills-challenge-center",
  "treasury", "student-economy-center", "store-marketplace", "financial-literacy-lab",
  "oas-center", "ai-agent-lab", "builder-studio", "innovation-lab",
  "community-center", "nonprofit-network-center", "program-incubator",
  "student-hub", "student-profile-portfolio-access",
  "central-plaza", "city-park", "transit-wayfinding-hub",
]);

export const METAVERSE_DESTINATION_ALIASES = Object.freeze({
  "public-works": "public-works-office",
  park: "city-park",
  "student-profile-access": "student-profile-portfolio-access",
});

export function resolveDestinationId(id) {
  if (typeof id !== "string" || !id) return null;
  if (CANONICAL_DESTINATION_IDS.includes(id)) return id;
  return METAVERSE_DESTINATION_ALIASES[id] || null;
}

export function getCanonicalDestinationId(id) {
  return resolveDestinationId(id);
}

export function isCanonicalDestinationId(id) {
  return typeof id === "string" && CANONICAL_DESTINATION_IDS.includes(id);
}

export function createDestinationReference(id) {
  return { destinationId: resolveDestinationId(id) };
}

export function validateCanonicalDestinationReferences(references = []) {
  const errors = [];
  for (const reference of references) {
    const id = reference?.destinationId ?? reference?.destination_id;
    if (id !== null && id !== undefined && !isCanonicalDestinationId(id)) errors.push(`unknown canonical destination reference: ${id}`);
  }
  return errors;
}
