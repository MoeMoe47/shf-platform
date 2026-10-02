// Phase 4G — server-side bridge to the Phase 4F.5 MOL contracts.
//
// Single source of truth: this imports the same pure, deterministic MOL
// modules the Metaverse client uses (src/system/metaverse/mol). It never
// forks or re-implements MOL. There is no live MOL service: every 4G world
// context is a deterministic SIMULATED scenario re-derived from approved MOL
// scenarios, honestly labeled as such. MOL has no Mission authority
// (MOL_MISSION_WORLD_CONTEXT_CONTRACT.missionAuthority === false).
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
// Same relative depth from src/ and dist/, so this resolves in tsx and in the compiled build.
import * as mol from "../../../../../../src/system/metaverse/mol/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROUTES_PATH = path.resolve(here, "../../../../../../src/system/metaverse/traffic/metaverseTrafficRoutes.json");

let trafficRoutes: Array<{ id: string; status: string; name?: string }> | null = null;
let graph: any = null;

export function molTrafficRoutes() {
  if (!trafficRoutes) trafficRoutes = JSON.parse(readFileSync(ROUTES_PATH, "utf8")).routes ?? [];
  return trafficRoutes!;
}

export function molGraph() {
  if (!graph) graph = mol.buildMolRegionalTwinGraph({ trafficRoutes: molTrafficRoutes() });
  return graph;
}

export interface MolSystemDescriptor {
  systemId: string;
  authorityDomain: string;
  mode: string;
  maturity: string;
}

export const MOL_MISSION_CONTEXT_CONTRACT: { contractVersion: number; missionAuthority: false; startsMissions: false } = mol.MOL_MISSION_WORLD_CONTEXT_CONTRACT;

export function molSystem(systemId: string): MolSystemDescriptor | null {
  const system = mol.getMolSystem(systemId);
  return system ? { systemId: system.systemId, authorityDomain: system.authorityDomain, mode: system.mode, maturity: system.maturity } : null;
}

export function molApprovedScenarioIds(): string[] {
  return mol.listMolScenarios().map((scenario: { scenarioId: string }) => scenario.scenarioId);
}

export function molScenarioEvents(scenarioId: string, seed: string, startAt: string): { ok: boolean; errors: string[]; events: any[] } {
  return mol.buildMolScenarioEvents(scenarioId, { seed, startAt, trafficRoutes: molTrafficRoutes() });
}

export function molProjectWorldState(events: any[], now: number) {
  return mol.projectMolWorldState(events, { now });
}

export function molGraphNode(nodeId: string): { nodeId: string; kind: string; ref: { authority: string; canonicalId: string } } | null {
  return molGraph().getNode(nodeId);
}

export function molDownstreamImpact(nodeId: string) {
  return molGraph().downstreamImpact(nodeId);
}

export function molDependencies(nodeId: string): string[] {
  return molGraph().dependenciesOf(nodeId);
}

export function molNodeForLocation(location: unknown): string | null {
  return mol.graphNodeForLocation(location);
}

// MOL_MISSION_WORLD_CONTEXT_CONTRACT projection (read-only, learner-free).
export function molMissionWorldContext(worldState: any) {
  return mol.projectMolMissionWorldContext(worldState);
}
