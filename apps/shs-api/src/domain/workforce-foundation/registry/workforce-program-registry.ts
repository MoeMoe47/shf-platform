// Phase 6.5 / 8 — code-backed Program and Funding registries (version-controlled configuration, reviewed like the
// MOL System Registry and the reporting Program Report Profiles). Illustrative fixtures never enter these lists.
// No funding source is registered: none exists in canonical data.
//
// Registration is generic: every program is a module in the static allow-list below, loaded through the same
// validation path. There is no per-program branch anywhere in the platform.
import { validateFundingSource, type FundingSource, type ProgramPackage } from "../model/workforce-foundation.js";
import { canonicalArtifactIndex, validateProgramModule, type CanonicalArtifactIndex, type WorkforceProgramModule } from "./program-module.js";
import { DATA_CENTER_PROGRAM_MODULE } from "./programs/data-center-community-workforce.js";

// Static allow-list of program modules. Only real programs belong here; synthetic shapes stay in tests.
export const WORKFORCE_PROGRAM_MODULES: readonly WorkforceProgramModule[] = Object.freeze([DATA_CENTER_PROGRAM_MODULE]);
export const WORKFORCE_PROGRAM_PACKAGES: readonly ProgramPackage[] = Object.freeze(WORKFORCE_PROGRAM_MODULES.map((module) => module.package));
export const WORKFORCE_FUNDING_SOURCES: readonly FundingSource[] = Object.freeze([]);

export interface WorkforceRegistry {
  packages: ProgramPackage[];
  modules: WorkforceProgramModule[];
  fundingSources: FundingSource[];
  rejected: Array<{ id: string; errors: string[] }>;
}

// Invalid entries are rejected and reported, never silently dropped or repaired. A duplicated programId rejects
// every entry that claims it (fail closed). Accepted programs are ordered by programId.
// No argument builds the production registry. An explicit argument builds exactly what it lists (modules default to
// none), so injected programs are never silently mixed with production programs.
export function buildWorkforceRegistry(options?: {
  modules?: readonly WorkforceProgramModule[]; packages?: readonly ProgramPackage[]; fundingSources?: readonly FundingSource[]; artifactIndex?: CanonicalArtifactIndex;
}): WorkforceRegistry {
  const { modules = options ? [] : WORKFORCE_PROGRAM_MODULES, packages = [], fundingSources = WORKFORCE_FUNDING_SOURCES, artifactIndex } = options ?? {};
  const rejected: WorkforceRegistry["rejected"] = [];
  const sources = new Map<string, FundingSource>();
  for (const source of fundingSources) {
    const errors = validateFundingSource(source);
    if (sources.has(source?.fundingSourceId)) errors.push("duplicate fundingSourceId");
    if (errors.length) rejected.push({ id: String(source?.fundingSourceId ?? "unknown"), errors });
    else sources.set(source.fundingSourceId, Object.freeze(structuredClone(source)));
  }
  // Bare packages (tests, fixtures) are modules without artifact references.
  const candidates: unknown[] = [...modules, ...packages.map((pkg) => ({ package: pkg, artifactRefs: { arcadeActivityIds: [], arcadeExperienceIds: [], missionSources: [], sensoryProfileIds: [] } }))];
  const index = artifactIndex ?? (modules.length ? canonicalArtifactIndex() : { arcadeActivityIds: [], arcadeExperienceIds: [], missionSources: [], sensoryProfileIds: [] });
  const idOf = (candidate: any) => String(candidate?.package?.program?.programId ?? "unknown");
  const counts = new Map<string, number>();
  for (const candidate of candidates) counts.set(idOf(candidate), (counts.get(idOf(candidate)) ?? 0) + 1);
  const accepted: WorkforceProgramModule[] = [];
  for (const candidate of candidates) {
    const id = idOf(candidate);
    const errors = validateProgramModule(candidate, index);
    if ((counts.get(id) ?? 0) > 1) errors.push("duplicate programId");
    const pkg: any = (candidate as any)?.package;
    for (const ref of Array.isArray(pkg?.fundingRefs) ? pkg.fundingRefs : []) {
      if (!sources.has(ref?.fundingSourceId)) errors.push(`fundingRefs: ${ref?.fundingSourceId} is not a registered funding source`);
    }
    if (errors.length) rejected.push({ id, errors });
    else accepted.push(Object.freeze(structuredClone(candidate)) as WorkforceProgramModule);
  }
  accepted.sort((a, b) => a.package.program.programId.localeCompare(b.package.program.programId));
  rejected.sort((a, b) => a.id.localeCompare(b.id));
  return { packages: accepted.map((module) => module.package), modules: accepted, fundingSources: [...sources.values()], rejected };
}
