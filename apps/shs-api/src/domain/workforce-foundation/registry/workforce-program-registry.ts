// Phase 6.5 — code-backed Program and Funding registries (version-controlled configuration, reviewed like the
// MOL System Registry and the reporting Program Report Profiles). Illustrative fixtures never enter these lists.
// No funding source is registered: none exists in canonical data.
import { validateFundingSource, validateProgramPackage, type FundingSource, type ProgramPackage } from "../model/workforce-foundation.js";
import { DATA_CENTER_COMMUNITY_WORKFORCE_PACKAGE } from "./programs/data-center-community-workforce.js";

// Phase 7: the Data Center Community & Workforce Initiative is the first registered package.
export const WORKFORCE_PROGRAM_PACKAGES: readonly ProgramPackage[] = Object.freeze([DATA_CENTER_COMMUNITY_WORKFORCE_PACKAGE]);
export const WORKFORCE_FUNDING_SOURCES: readonly FundingSource[] = Object.freeze([]);

export interface WorkforceRegistry {
  packages: ProgramPackage[];
  fundingSources: FundingSource[];
  rejected: Array<{ id: string; errors: string[] }>;
}

// Invalid entries are rejected and reported, never silently dropped or repaired.
export function buildWorkforceRegistry({ packages = WORKFORCE_PROGRAM_PACKAGES, fundingSources = WORKFORCE_FUNDING_SOURCES }: {
  packages?: readonly ProgramPackage[]; fundingSources?: readonly FundingSource[];
} = {}): WorkforceRegistry {
  const rejected: WorkforceRegistry["rejected"] = [];
  const sources = new Map<string, FundingSource>();
  for (const source of fundingSources) {
    const errors = validateFundingSource(source);
    if (sources.has(source?.fundingSourceId)) errors.push("duplicate fundingSourceId");
    if (errors.length) rejected.push({ id: String(source?.fundingSourceId ?? "unknown"), errors });
    else sources.set(source.fundingSourceId, Object.freeze(structuredClone(source)));
  }
  const programs = new Map<string, ProgramPackage>();
  for (const pkg of packages) {
    const errors = validateProgramPackage(pkg);
    const id = String(pkg?.program?.programId ?? "unknown");
    if (programs.has(id)) errors.push("duplicate programId");
    for (const ref of Array.isArray(pkg?.fundingRefs) ? pkg.fundingRefs : []) {
      if (!sources.has(ref?.fundingSourceId)) errors.push(`fundingRefs: ${ref?.fundingSourceId} is not a registered funding source`);
    }
    if (errors.length) rejected.push({ id, errors });
    else programs.set(id, Object.freeze(structuredClone(pkg)) as ProgramPackage);
  }
  return { packages: [...programs.values()], fundingSources: [...sources.values()], rejected };
}
