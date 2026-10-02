// Phase 6 — server-side bridge to the canonical Arcade experience descriptor catalog.
// Single source of truth: the same pure modules the Arcade clients use (src/shared/arcade/experience),
// never a server copy. Same relative depth from src/ and dist/.
import * as catalog from "../../../../../src/shared/arcade/experience/arcadeExperienceCatalog.js";
import * as validation from "../../../../../src/shared/arcade/experience/arcadeExperienceValidation.js";

export type ArcadeExperienceDescriptor = any;

export function canonicalArcadeExperiences(extra: readonly ArcadeExperienceDescriptor[] = []): { descriptors: ArcadeExperienceDescriptor[]; rejected: Array<{ id: string; errors: string[] }> } {
  return catalog.buildArcadeExperienceCatalog({ canonicalDescriptors: [...catalog.CANONICAL_ARCADE_EXPERIENCE_DESCRIPTORS, ...extra] });
}

export function validateArcadeExperience(descriptor: ArcadeExperienceDescriptor): { valid: boolean; errors: string[] } {
  return validation.validateArcadeExperienceDescriptor(descriptor);
}
