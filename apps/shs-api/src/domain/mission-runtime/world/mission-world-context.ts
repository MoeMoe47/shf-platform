// Phase 4G — Mission ↔ Metaverse world context (Mission Runtime side).
//
// MOL supplies world context; Mission Runtime owns Mission state. Nothing here
// starts, progresses, completes or evaluates a Mission. Two contexts are never
// mixed:
//   FROZEN — captured once inside the start transaction (reproducibility, review, replay).
//   LIVE   — recomputed on demand from the same deterministic source; never stored.
// Every value carries its freshness (CURRENT / STALE / SOURCE_UNAVAILABLE) and
// whether it is SIMULATED. Unavailable capabilities contribute no state.
import type { MissionDefinition } from "../../mission-content/model/mission-definition.js";
import { MISSION_WORLD_CAPABILITIES, type MissionWorldCapability } from "../../mission-content/model/mission-world.js";
import {
  MOL_MISSION_CONTEXT_CONTRACT,
  molApprovedScenarioIds,
  molDependencies,
  molGraphNode,
  molMissionWorldContext,
  molNodeForLocation,
  molProjectWorldState,
  molScenarioEvents,
  molSystem,
  type MolSystemDescriptor,
} from "./mol-bridge.js";

export const MISSION_WORLD_CONTEXT_VERSION = 1;
export const MISSION_WORLD_CONTEXT_MAX_BYTES = 3584;
export const MISSION_WORLD_MAX_EVENT_REFS = 8;
export type MissionWorldHealth = "HEALTHY" | "DEGRADED" | "UNAVAILABLE";
export type MissionWorldCapabilityStatus = "AVAILABLE" | "DEGRADED" | "UNAVAILABLE" | "SIMULATION_NOT_PERMITTED";

export interface MissionWorldContextProvider {
  system(systemId: string): MolSystemDescriptor | null;
  health(systemId: string): MissionWorldHealth;
  scenarioIds(): string[];
  scenarioEvents(scenarioId: string, seed: string, startAt: string): { ok: boolean; errors: string[]; events: any[] };
}

// Default provider: the MOL registry. Registry-UNAVAILABLE systems (no provider) are never healthy.
export function createMolWorldContextProvider({ health = {} }: { health?: Record<string, MissionWorldHealth> } = {}): MissionWorldContextProvider {
  return {
    system: molSystem,
    health: (systemId) => (molSystem(systemId)?.mode === "UNAVAILABLE" ? "UNAVAILABLE" : health[systemId] ?? "HEALTHY"),
    scenarioIds: molApprovedScenarioIds,
    scenarioEvents: molScenarioEvents,
  };
}
export const defaultMissionWorldContextProvider = createMolWorldContextProvider();

function environmentNode(environmentId: string) {
  return molGraphNode(`destination:${environmentId}`) || molGraphNode(`district:${environmentId}`);
}

export function resolveMissionWorldBinding(definition: MissionDefinition, provider: MissionWorldContextProvider) {
  const declaration = definition.metaverseContext!;
  const environment = definition.environmentRefs.filter((ref) => ref.system === "metaverse").map((ref) => {
    const node = environmentNode(ref.environmentId);
    return { environmentId: ref.environmentId, required: ref.required !== false, resolved: Boolean(node), nodeId: node?.nodeId ?? null, nodeKind: node?.kind ?? null };
  });
  const declared: Array<[MissionWorldCapability, boolean]> = [
    ...declaration.requiredCapabilities.map((capability): [MissionWorldCapability, boolean] => [capability, true]),
    ...declaration.optionalCapabilities.map((capability): [MissionWorldCapability, boolean] => [capability, false]),
  ];
  const capabilities = declared.map(([capability, required]) => {
    const systemId = MISSION_WORLD_CAPABILITIES[capability];
    const system = provider.system(systemId);
    const health = system ? provider.health(systemId) : "UNAVAILABLE";
    const status: MissionWorldCapabilityStatus = !system || system.mode === "UNAVAILABLE" || health === "UNAVAILABLE" ? "UNAVAILABLE"
      // No silent fallback: a simulated provider is usable only when the Mission explicitly allows it.
      : system.mode === "SIMULATED" && !declaration.allowSimulatedContext ? "SIMULATION_NOT_PERMITTED"
        : health === "DEGRADED" ? "DEGRADED" : "AVAILABLE";
    return { capability, systemId, required, providerMode: system?.mode ?? "UNAVAILABLE", maturity: system?.maturity ?? "PLANNED", status };
  });
  const scenarioApproved = provider.scenarioIds().includes(declaration.scenarioId);
  const usable = (status: MissionWorldCapabilityStatus) => status === "AVAILABLE" || status === "DEGRADED";
  const requiredCapabilityFailures = capabilities.filter((item) => item.required && !usable(item.status)).map((item) => `${item.capability}:${item.status}`);
  // Environment references and an approved scenario are always required; capability outages follow the declared policy.
  const hardFailures = [
    ...environment.filter((item) => item.required && !item.resolved).map((item) => `ENVIRONMENT_UNRESOLVED:${item.environmentId}`),
    ...(scenarioApproved ? [] : [`SCENARIO_NOT_APPROVED:${declaration.scenarioId}`]),
  ];
  const blockReasons = [...hardFailures, ...(declaration.requiredUnavailablePolicy === "BLOCK_START" ? requiredCapabilityFailures : [])];
  return {
    scenarioId: declaration.scenarioId,
    environment,
    capabilities,
    blocked: blockReasons.length > 0,
    blockReasons,
    degraded: capabilities.some((item) => !usable(item.status) || item.status === "DEGRADED") || environment.some((item) => !item.resolved),
    usableSystems: new Set(capabilities.filter((item) => usable(item.status)).map((item) => item.systemId)),
  };
}

type Binding = ReturnType<typeof resolveMissionWorldBinding>;

// Location relevance: the Mission's environment nodes and everything they depend on.
function relevantNodes(binding: Binding) {
  const nodes = new Set<string>();
  const queue = binding.environment.filter((item) => item.nodeId).map((item) => item.nodeId!);
  while (queue.length && nodes.size < 64) {
    const next = queue.shift()!;
    if (nodes.has(next)) continue;
    nodes.add(next);
    queue.push(...molDependencies(next));
  }
  return nodes;
}

// Bounded subscription: an event is relevant only if its source capability is usable AND it is
// part of this runtime's correlation chain or touches the Mission's location dependency set.
export function filterMissionWorldEvents(events: readonly any[], binding: Binding, correlationId: string) {
  const nodes = relevantNodes(binding);
  const accepted: Array<{ event: any; relevance: string[] }> = [];
  for (const event of events) {
    if (!binding.usableSystems.has(event.sourceSystem)) continue;
    const relevance: string[] = [];
    if (event.correlationId === correlationId) relevance.push("CORRELATION");
    const node = molNodeForLocation(event.location);
    if (node && nodes.has(node)) relevance.push("LOCATION");
    if (relevance.length) accepted.push({ event, relevance: ["CAPABILITY", ...relevance] });
  }
  return accepted;
}

// Minimal immutable references instead of copied event bodies.
export function toMissionWorldEventRef({ event, relevance }: { event: any; relevance: string[] }) {
  return {
    molEventId: event.eventId, eventType: event.eventType, sourceSystem: event.sourceSystem, authority: event.authority,
    providerMode: event.providerMode, occurredAt: event.occurredAt, correlationId: event.correlationId, causationId: event.causationId, relevance,
  };
}

function byteLength(value: unknown) {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

export function missionWorldCorrelationId(scenarioId: string, runtimeId: string) {
  return `${scenarioId}:${runtimeId}`;
}

export function buildMissionWorldContext(input: {
  definition: MissionDefinition;
  runtimeId: string;
  startedAt: string;
  now: string;
  contextKind: "FROZEN" | "LIVE";
  provider: MissionWorldContextProvider;
  ambientEvents?: readonly any[];
}) {
  const binding = resolveMissionWorldBinding(input.definition, input.provider);
  const nowMs = Date.parse(input.now);
  const scenario = binding.blockReasons.some((reason) => reason.startsWith("SCENARIO_NOT_APPROVED"))
    ? { ok: false, errors: ["SCENARIO_NOT_APPROVED"], events: [] }
    // Deterministic per runtime: seed = runtime id, timeline anchored at runtime start.
    : input.provider.scenarioEvents(binding.scenarioId, input.runtimeId, input.startedAt);
  const correlationId = missionWorldCorrelationId(binding.scenarioId, input.runtimeId);
  const available = [...(scenario.events || []), ...(input.ambientEvents || [])].filter((event) => Date.parse(event.occurredAt) <= nowMs);
  const relevant = filterMissionWorldEvents(available, binding, correlationId);
  const worldState = molProjectWorldState(relevant.map((item) => item.event), nowMs);
  const conditions = molMissionWorldContext(worldState);
  // Provider health overrides projection freshness: degraded sources are stale, never refreshed.
  for (const list of [conditions.closures, conditions.restrictions, conditions.incidents, conditions.infrastructure]) {
    for (const entry of list) {
      const source = Object.values(worldState.categories).flatMap((category: any) => Object.values(category)).find((item: any) => item.key === entry.key) as any;
      if (source && input.provider.health(source.sourceSystem) === "DEGRADED") entry.freshness = "STALE";
    }
  }
  let eventRefs = relevant.slice(-MISSION_WORLD_MAX_EVENT_REFS).map(toMissionWorldEventRef);
  const context = {
    contextVersion: MISSION_WORLD_CONTEXT_VERSION,
    sourceContractVersion: MOL_MISSION_CONTEXT_CONTRACT.contractVersion,
    contextKind: input.contextKind,
    capturedAt: input.now,
    simulated: binding.capabilities.some((item) => item.providerMode !== "LIVE"),
    scenario: { scenarioId: binding.scenarioId, correlationId, approved: !binding.blockReasons.some((reason) => reason.startsWith("SCENARIO_NOT_APPROVED")) },
    environment: binding.environment.map(({ environmentId, required, resolved, nodeKind }) => ({ environmentId, required, resolved, nodeKind })),
    capabilities: binding.capabilities,
    conditions: {
      environment: conditions.environment,
      closures: conditions.closures,
      restrictions: conditions.restrictions,
      incidents: conditions.incidents,
      infrastructure: conditions.infrastructure,
    },
    eventRefs,
    eventRefsTruncated: relevant.length > eventRefs.length,
    degraded: binding.degraded,
    degradedCapabilities: binding.capabilities.filter((item) => item.status !== "AVAILABLE").map((item) => item.capability),
    missionAuthority: false as const,
  };
  // Bounded to fit a single Mission Runtime event; references are trimmed first, never conditions silently.
  while (byteLength(context) > MISSION_WORLD_CONTEXT_MAX_BYTES && context.eventRefs.length) {
    eventRefs = eventRefs.slice(1);
    context.eventRefs = eventRefs;
    context.eventRefsTruncated = true;
  }
  return { binding, context };
}

export type MissionWorldContext = ReturnType<typeof buildMissionWorldContext>["context"];
