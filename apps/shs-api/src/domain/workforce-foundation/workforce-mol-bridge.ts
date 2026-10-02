// Phase 6.5 — read-only bridge to the MOL System Registry (src/system/metaverse/mol).
// Workforce capability maturity reuses MOL's vocabulary and MOL's own system maturity; it never forks
// or re-registers systems. Same relative depth from src/ and dist/.
import * as mol from "../../../../../src/system/metaverse/mol/index.js";
import * as destinations from "../../../../../src/system/metaverse/metaverseCanonicalDestinationRegistry.js";

export interface MolSystemSummary { systemId: string; displayName: string; mode: string; maturity: string; authorityDomain: string }

export const WORKFORCE_CAPABILITY_MATURITY: readonly string[] = mol.MOL_CAPABILITY_MATURITY;
// Provider modes describe how a capability is supplied (LIVE, SIMULATED, HYBRID, TEST, UNAVAILABLE); they are not maturity.
export const WORKFORCE_PROVIDER_MODES: readonly string[] = mol.MOL_PROVIDER_MODES;

// Canonical Metaverse destinations are referenced by id only; geometry and world state stay with Metaverse/MOL.
export function isWorkforceDestinationId(destinationId: string): boolean {
  return destinations.isCanonicalDestinationId(destinationId) === true;
}

export function workforceMolSystem(systemId: string): MolSystemSummary | null {
  const entry = mol.getMolSystem(systemId);
  return entry ? { systemId: entry.systemId, displayName: entry.displayName, mode: entry.mode, maturity: entry.maturity, authorityDomain: entry.authorityDomain } : null;
}

export function workforceMolSystemIds(): string[] {
  return mol.listMolSystems().map((entry: any) => entry.systemId);
}
