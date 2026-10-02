// Phase 8 — Workforce Program module contract and static loader.
//
// A program module is CONTENT + CONFIGURATION + REFERENCES: its ProgramPackage, an optional fundability assessment,
// and references to authority-owned artifacts (canonical Arcade activities and descriptors, canonical Mission sources,
// sensory profiles). It never contains those artifacts, never provisions them itself, and never contains code: a module
// is plain data, so a program cannot ship its own engine. Modules come from a static allow-list (no dynamic loading,
// no filesystem scanning), load in deterministic programId order, and fail closed on any defect.
import { CANONICAL_ARCADE_ACTIVITIES } from "../../arcade/catalog/canonical-arcade-activities.js";
import { canonicalArcadeExperiences } from "../../arcade-integration/arcade-experience-bridge.js";
import { CANONICAL_MISSION_SOURCES } from "../../mission-content/catalog/canonical-mission-sources.js";
import { evaluateFundabilityGate, type FundabilityComponent } from "../model/readiness-and-fundability.js";
import { validateProgramPackage, type ProgramPackage } from "../model/workforce-foundation.js";
import { canonicalSensoryRegistry } from "../sensory-bridge.js";

export interface ProgramArtifactRefs {
  arcadeActivityIds: string[];
  arcadeExperienceIds: string[];
  missionSources: Array<{ missionId: string; missionVersion: number }>;
  sensoryProfileIds: string[];
}

export interface WorkforceProgramModule {
  package: ProgramPackage;
  fundabilityAssessment?: { component: FundabilityComponent; basis: Record<string, string> };
  artifactRefs: ProgramArtifactRefs;
}

export interface CanonicalArtifactIndex {
  arcadeActivityIds: string[];
  arcadeExperienceIds: string[];
  missionSources: string[];
  sensoryProfileIds: string[];
}

export function canonicalArtifactIndex(): CanonicalArtifactIndex {
  const sensory = canonicalSensoryRegistry();
  return {
    arcadeActivityIds: CANONICAL_ARCADE_ACTIVITIES.map((item) => item.id),
    arcadeExperienceIds: canonicalArcadeExperiences().descriptors.filter((item: any) => item.provenance?.classification === "canonical_descriptor").map((item: any) => item.id),
    missionSources: CANONICAL_MISSION_SOURCES.map((item) => `${item.missionId}@${item.version}`),
    sensoryProfileIds: [
      ...sensory.soundProfiles.map((item: any) => item.profileId), ...sensory.celebrationProfiles.map((item: any) => item.profileId),
      ...sensory.environmentAudioProfiles.map((item: any) => item.profileId), ...sensory.presentationPolicies.map((item: any) => item.policyId),
    ],
  };
}

const isRecord = (value: unknown): value is Record<string, any> => value !== null && typeof value === "object" && !Array.isArray(value);

// Plain data only: no functions, class instances, symbols or getters anywhere in a module.
function codeFindings(value: unknown, path: string, found: string[], depth = 0) {
  if (depth > 10) return void found.push(`${path}: nesting too deep`);
  if (typeof value === "function" || typeof value === "symbol" || typeof value === "bigint") return void found.push(`${path}: modules must be plain data (no code)`);
  if (Array.isArray(value)) value.forEach((item, index) => codeFindings(item, `${path}[${index}]`, found, depth + 1));
  else if (value !== null && typeof value === "object") {
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) return void found.push(`${path}: modules must be plain data (no class instances)`);
    for (const key of Object.keys(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (descriptor?.get || descriptor?.set) found.push(`${path}.${key}: modules must be plain data (no accessors)`);
      else codeFindings((value as any)[key], `${path}.${key}`, found, depth + 1);
    }
  }
}

export function validateProgramModule(module: unknown, index: CanonicalArtifactIndex = canonicalArtifactIndex()): string[] {
  if (!isRecord(module)) return ["module must be an object"];
  const errors: string[] = [];
  codeFindings(module, "module", errors);
  for (const key of Object.keys(module)) if (!["package", "fundabilityAssessment", "artifactRefs"].includes(key)) errors.push(`module.${key}: unsupported field`);
  errors.push(...validateProgramPackage(module.package));
  if (module.fundabilityAssessment !== undefined) {
    const assessment = module.fundabilityAssessment;
    if (!isRecord(assessment) || !isRecord(assessment.component) || !isRecord(assessment.basis)) errors.push("module.fundabilityAssessment must be {component, basis}");
    else {
      const probe = evaluateFundabilityGate(assessment.component as FundabilityComponent, { fundingLaneCount: 0, blockingDependencyCount: 0, readinessStatus: "READY" });
      for (const reason of probe.reasons.filter((item) => item.startsWith("INVALID_"))) errors.push(`module.fundabilityAssessment.component: ${reason}`);
    }
  }
  const refs = module.artifactRefs;
  if (!isRecord(refs)) return [...errors, "module.artifactRefs is required"];
  for (const key of Object.keys(refs)) if (!["arcadeActivityIds", "arcadeExperienceIds", "missionSources", "sensoryProfileIds"].includes(key)) errors.push(`module.artifactRefs.${key}: unsupported field`);
  const pkg = isRecord(module.package) ? module.package : {};
  const list = (value: unknown) => (Array.isArray(value) ? value : []);
  // Every artifact the module names must exist in its owning canonical registry AND be referenced by the package.
  for (const id of list(refs.arcadeActivityIds)) if (!index.arcadeActivityIds.includes(id)) errors.push(`artifactRefs.arcadeActivityIds: ${id} is not a canonical Arcade activity`);
  const packageExperiences = list(pkg.arcadeExperienceRefs).map((ref: any) => ref?.experienceId);
  for (const id of list(refs.arcadeExperienceIds)) {
    if (!index.arcadeExperienceIds.includes(id)) errors.push(`artifactRefs.arcadeExperienceIds: ${id} is not a canonical Arcade descriptor`);
    if (!packageExperiences.includes(id)) errors.push(`artifactRefs.arcadeExperienceIds: ${id} is not referenced by the package`);
  }
  const packageMissions = list(pkg.missionRefs).map((ref: any) => `${ref?.missionId}@${ref?.missionVersion}`);
  for (const source of list(refs.missionSources)) {
    const key = `${source?.missionId}@${source?.missionVersion}`;
    if (!index.missionSources.includes(key)) errors.push(`artifactRefs.missionSources: ${key} is not a canonical Mission source`);
    if (!packageMissions.includes(key)) errors.push(`artifactRefs.missionSources: ${key} is not referenced by the package`);
  }
  const packageSensory = Object.values(isRecord(pkg.sensoryRefs) ? pkg.sensoryRefs : {}).filter(Boolean);
  for (const id of list(refs.sensoryProfileIds)) {
    if (!index.sensoryProfileIds.includes(id)) errors.push(`artifactRefs.sensoryProfileIds: ${id} is not a registered sensory profile`);
    if (!packageSensory.includes(id)) errors.push(`artifactRefs.sensoryProfileIds: ${id} is not referenced by the package`);
  }
  return errors;
}
