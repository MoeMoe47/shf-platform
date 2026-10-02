// Phase 6.5 — read-only bridge to the shared Sensory foundation (src/shared/experience/sensory).
// ProgramPackages reference sensory profiles; they never own or copy them. Same relative depth from src/ and dist/.
import * as sensory from "../../../../../src/shared/experience/sensory/index.js";

export type SensoryRegistry = ReturnType<typeof sensory.buildSensoryRegistry>;
export type SensoryReferenceKind = "SOUND_PROFILE" | "CELEBRATION_PROFILE" | "ENVIRONMENT_AUDIO_PROFILE" | "PRESENTATION_POLICY";

export function canonicalSensoryRegistry(): SensoryRegistry {
  return sensory.buildSensoryRegistry();
}

export function resolveSensoryReference(registry: SensoryRegistry, kind: SensoryReferenceKind, id: string | null): { kind: string; id: string; resolved: boolean } | null {
  return sensory.resolveSensoryReference(registry, kind, id);
}
