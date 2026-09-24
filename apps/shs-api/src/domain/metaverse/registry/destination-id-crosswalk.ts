import type { MetaverseCityRegistry, MetaverseDestination } from "./city-registry.js";

export type MetaverseDestinationAlias = {
  canonical_destination_id: string;
  aliases: readonly string[];
};

// Historical frontend/facility keys remain valid inputs, but never become
// additional destination identities.
export const METAVERSE_DESTINATION_ALIASES: readonly MetaverseDestinationAlias[] = [
  { canonical_destination_id: "public-works-office", aliases: ["public-works"] },
  { canonical_destination_id: "city-park", aliases: ["park"] },
  { canonical_destination_id: "student-profile-portfolio-access", aliases: ["student-profile-access"] },
];

function destinationById(registry: MetaverseCityRegistry, id: string): MetaverseDestination | null {
  return registry.destinations.find((destination) => destination.id === id) ?? null;
}

export function getDestinationById(registry: MetaverseCityRegistry, id: string | null | undefined): MetaverseDestination | null {
  if (!id) return null;
  const canonicalId = resolveDestinationId(registry, id);
  return destinationById(registry, canonicalId ?? id);
}

export function resolveDestinationId(registry: MetaverseCityRegistry, id: string | null | undefined): string | null {
  if (!id) return null;
  if (destinationById(registry, id)) return id;
  const match = METAVERSE_DESTINATION_ALIASES.find((entry) => entry.aliases.includes(id));
  return match && destinationById(registry, match.canonical_destination_id) ? match.canonical_destination_id : null;
}

export function getCanonicalDestinationId(registry: MetaverseCityRegistry, id: string | null | undefined): string | null {
  return resolveDestinationId(registry, id);
}

export function isCanonicalDestinationId(registry: MetaverseCityRegistry, id: string | null | undefined): boolean {
  return Boolean(id && destinationById(registry, id));
}

export function validateMetaverseDestinationIdCrosswalk(
  registry: MetaverseCityRegistry,
  aliases: readonly MetaverseDestinationAlias[] = METAVERSE_DESTINATION_ALIASES,
): string[] {
  const errors: string[] = [];
  const canonicalIds = new Set(registry.destinations.map((destination) => destination.id));
  const seenAliases = new Map<string, string>();

  for (const destination of registry.destinations) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(destination.id)) errors.push(`malformed canonical destination id: ${destination.id}`);
  }

  for (const entry of aliases) {
    if (!canonicalIds.has(entry.canonical_destination_id)) {
      errors.push(`alias target is unknown: ${entry.canonical_destination_id}`);
    }
    for (const alias of entry.aliases) {
      if (canonicalIds.has(alias)) errors.push(`alias collides with canonical destination id: ${alias}`);
      const previous = seenAliases.get(alias);
      if (previous && previous !== entry.canonical_destination_id) errors.push(`alias maps to multiple destinations: ${alias}`);
      seenAliases.set(alias, entry.canonical_destination_id);
    }
  }

  return errors;
}

export type MetaverseDestinationReference = {
  destination_id: string | null;
};

export function createDestinationReference(registry: MetaverseCityRegistry, id: string | null | undefined): MetaverseDestinationReference {
  return { destination_id: getCanonicalDestinationId(registry, id) };
}
