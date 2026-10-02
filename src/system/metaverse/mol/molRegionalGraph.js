// Phase 4F.5 — Regional Digital Twin Graph foundation + Dependency Graph.
//
// A coordination model: reference + relationship, never copy + ownership.
// Nodes point at canonical IDs owned elsewhere (canonical destinations, the
// traffic route registry, the river/water zone registry, the MOL System
// Registry). The graph is not authoritative for Identity, Career,
// Curriculum, Evidence, Truth, organizations or credentials, and stores no
// records from them.

import { CANONICAL_DESTINATION_IDS } from "../metaverseCanonicalDestinationRegistry.js";
import { METAVERSE_DESTINATION_RELATIONSHIPS } from "../metaverseDestinationRelationshipRegistry.js";
import { METAVERSE_WATER_ZONES } from "../metaverseRiverFlowRegistry.js";
import { listMolSystems } from "./molSystemRegistry.js";

export const MOL_GRAPH_VERSION = 1;
export const MOL_TWIN_NODE_KINDS = Object.freeze(["CITY", "DISTRICT", "FACILITY", "SYSTEM", "TRANSPORT_CORRIDOR", "WATERWAY"]);
// Only relationship types justified by current architecture.
export const MOL_RELATIONSHIP_TYPES = Object.freeze(["LOCATED_IN", "DEPENDS_ON"]);
export const MOL_IMPACT_LIMITS = Object.freeze({ maxDepth: 4, maxNodes: 50 });
export const MOL_CITY_NODE_ID = "city:silicon-heartland";

// Declared MOL coordination topology between real canonical infrastructure destinations.
// It states dependencies for coordination; it does not describe or own facility operations.
export const MOL_INFRASTRUCTURE_DEPENDENCIES = Object.freeze([
  ["cooling-mechanical-plant", "power-electrical-facility"],
  ["main-data-center", "power-electrical-facility"],
  ["main-data-center", "cooling-mechanical-plant"],
  ["network-operations-center", "main-data-center"],
  ["ai-compute-facility", "main-data-center"],
  ["security-operations-center", "network-operations-center"],
]);

// System Registry entries anchored to canonical destinations by reference.
export const MOL_SYSTEM_LOCATIONS = Object.freeze({
  "power-grid": "power-electrical-facility",
  "data-center": "main-data-center",
});

export const destinationNodeId = (id) => `destination:${id}`;
export const systemNodeId = (id) => `system:${id}`;
export const corridorNodeId = (id) => `corridor:${id}`;
export const waterwayNodeId = (id) => `waterway:${id}`;

function edge(from, to, type) {
  return Object.freeze({ from, to, type });
}

// `trafficRoutes` is injected (the approved routes export), so this module stays runtime-neutral.
export function buildMolRegionalTwinGraph({ trafficRoutes = [], extraEdges = [] } = {}) {
  const nodes = new Map();
  const edges = [];
  const addNode = (nodeId, kind, label, ref) => nodes.set(nodeId, Object.freeze({ nodeId, kind, label, ref: Object.freeze(ref) }));

  addNode(MOL_CITY_NODE_ID, "CITY", "Silicon Heartland", { authority: "METAVERSE_REGISTRY", canonicalId: "silicon-heartland-city" });
  const relationships = new Map(METAVERSE_DESTINATION_RELATIONSHIPS.map((item) => [item.destinationId, item]));
  for (const destinationId of Object.values(CANONICAL_DESTINATION_IDS)) {
    const districtId = relationships.get(destinationId)?.districtId || null;
    addNode(destinationNodeId(destinationId), "FACILITY", destinationId, { authority: "CANONICAL_DESTINATION_REGISTRY", canonicalId: destinationId });
    if (districtId) {
      const districtNode = `district:${districtId}`;
      if (!nodes.has(districtNode)) {
        addNode(districtNode, "DISTRICT", districtId, { authority: "CITY_DISTRICT_REGISTRY", canonicalId: districtId });
        edges.push(edge(districtNode, MOL_CITY_NODE_ID, "LOCATED_IN"));
      }
      edges.push(edge(destinationNodeId(destinationId), districtNode, "LOCATED_IN"));
    }
  }
  for (const system of listMolSystems()) {
    addNode(systemNodeId(system.systemId), "SYSTEM", system.displayName, { authority: "MOL_SYSTEM_REGISTRY", canonicalId: system.systemId });
    if (MOL_SYSTEM_LOCATIONS[system.systemId]) edges.push(edge(systemNodeId(system.systemId), destinationNodeId(MOL_SYSTEM_LOCATIONS[system.systemId]), "LOCATED_IN"));
    for (const dependency of system.dependsOn) edges.push(edge(systemNodeId(system.systemId), systemNodeId(dependency), "DEPENDS_ON"));
  }
  for (const [dependent, dependency] of MOL_INFRASTRUCTURE_DEPENDENCIES) edges.push(edge(destinationNodeId(dependent), destinationNodeId(dependency), "DEPENDS_ON"));
  for (const route of trafficRoutes.filter((item) => item?.status === "APPROVED")) {
    addNode(corridorNodeId(route.id), "TRANSPORT_CORRIDOR", route.name || route.id, { authority: "TRAFFIC", canonicalId: route.id });
  }
  for (const zone of METAVERSE_WATER_ZONES) {
    addNode(waterwayNodeId(zone.id), "WATERWAY", zone.id, { authority: "WATER_MOBILITY", canonicalId: zone.id });
  }
  for (const item of extraEdges) edges.push(edge(item.from, item.to, item.type));
  return createMolGraph([...nodes.values()], edges);
}

export function createMolGraph(nodeList, edgeList) {
  const nodes = new Map(nodeList.map((node) => [node.nodeId, node]));
  const errors = [];
  for (const item of edgeList) {
    if (!MOL_RELATIONSHIP_TYPES.includes(item.type)) errors.push(`unsupported relationship ${item.type}`);
    if (!nodes.has(item.from) || !nodes.has(item.to)) errors.push(`edge references unknown node ${item.from} -> ${item.to}`);
  }
  const edges = Object.freeze(edgeList.filter((item) => MOL_RELATIONSHIP_TYPES.includes(item.type) && nodes.has(item.from) && nodes.has(item.to)));

  const dependenciesOf = (nodeId) => edges.filter((item) => item.from === nodeId && item.type === "DEPENDS_ON").map((item) => item.to);
  const dependentsOf = (nodeId) => edges.filter((item) => item.to === nodeId && item.type === "DEPENDS_ON").map((item) => item.from);
  const systemsAt = (nodeId) => edges.filter((item) => item.to === nodeId && item.type === "LOCATED_IN" && nodes.get(item.from)?.kind === "SYSTEM").map((item) => item.from);

  // Bounded breadth-first downstream impact: who depends on this node (and systems located at
  // impacted facilities). Visited-set traversal makes cycles safe; depth/node caps prevent
  // uncontrolled cascades and the result says when it was truncated.
  function downstreamImpact(nodeId, { maxDepth = MOL_IMPACT_LIMITS.maxDepth, maxNodes = MOL_IMPACT_LIMITS.maxNodes } = {}) {
    if (!nodes.has(nodeId)) return { origin: nodeId, known: false, impacted: [], truncated: false };
    const visited = new Set([nodeId]);
    const impacted = [];
    let frontier = [nodeId];
    let truncated = false;
    for (let depth = 1; depth <= maxDepth && frontier.length; depth += 1) {
      const next = [];
      for (const current of frontier) {
        for (const neighbor of [...dependentsOf(current), ...systemsAt(current)]) {
          if (visited.has(neighbor)) continue;
          if (impacted.length >= maxNodes) { truncated = true; break; }
          visited.add(neighbor);
          impacted.push({ nodeId: neighbor, depth, via: current, kind: nodes.get(neighbor).kind });
          next.push(neighbor);
        }
      }
      frontier = next;
    }
    if (frontier.length && frontier.some((current) => [...dependentsOf(current), ...systemsAt(current)].some((neighbor) => !visited.has(neighbor)))) truncated = true;
    return { origin: nodeId, known: true, impacted, truncated };
  }

  function findDependencyCycles() {
    const cycles = [];
    const state = new Map();
    const stack = [];
    const visit = (nodeId) => {
      state.set(nodeId, "VISITING");
      stack.push(nodeId);
      for (const next of dependenciesOf(nodeId)) {
        if (state.get(next) === "VISITING") cycles.push([...stack.slice(stack.indexOf(next)), next]);
        else if (!state.has(next)) visit(next);
      }
      stack.pop();
      state.set(nodeId, "DONE");
    };
    for (const nodeId of nodes.keys()) if (!state.has(nodeId)) visit(nodeId);
    return cycles;
  }

  return Object.freeze({
    graphVersion: MOL_GRAPH_VERSION,
    nodes: Object.freeze([...nodes.values()]),
    edges,
    errors: Object.freeze(errors),
    getNode: (nodeId) => nodes.get(nodeId) || null,
    dependenciesOf,
    dependentsOf,
    downstreamImpact,
    findDependencyCycles,
  });
}
