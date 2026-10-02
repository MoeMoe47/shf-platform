// Phase 6 — canonical Arcade experience catalog: the one shared descriptor source for both products.
//
// Learning Arcade and Classic Arcade share this platform contract but remain separate product
// authorities (product.family). Canonical descriptors (provenance.classification
// "canonical_descriptor") are declared here; legacy catalog entries are adapted, never re-authored.
// Phase 7+ programs plug in by adding canonical descriptors, not by creating another registry.
import { arcadeGames, sections } from "../../../data/arcade.js";
import { adaptLegacyArcadeGames, adaptLegacyDisplaySections } from "./legacyArcadeCatalogAdapter.js";
import { validateArcadeExperienceDescriptor } from "./arcadeExperienceValidation.js";

export const CANONICAL_ARCADE_EXPERIENCE_DESCRIPTORS = Object.freeze([]);

function unwrap(entry) {
  return entry?.descriptor ?? entry;
}

// Canonical descriptors take precedence over adapted legacy entries with the same id. Invalid
// descriptors are excluded and reported, never repaired.
export function buildArcadeExperienceCatalog({ canonicalDescriptors = CANONICAL_ARCADE_EXPERIENCE_DESCRIPTORS, includeLegacy = true } = {}) {
  const byId = new Map();
  const rejected = [];
  const legacy = includeLegacy ? [...adaptLegacyArcadeGames(arcadeGames), ...adaptLegacyDisplaySections(sections)].map(unwrap) : [];
  for (const descriptor of [...legacy, ...canonicalDescriptors]) {
    if (!descriptor?.id) continue;
    const validation = validateArcadeExperienceDescriptor(descriptor);
    if (!validation.valid) {
      rejected.push({ id: descriptor.id, errors: validation.errors });
      continue;
    }
    byId.set(descriptor.id, descriptor);
  }
  return { descriptors: [...byId.values()], rejected };
}
