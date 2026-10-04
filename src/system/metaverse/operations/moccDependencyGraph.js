import { MOCC_INTEGRATION_REGISTRY } from "./moccIntegrationStatusRegistry.js";
import { METAVERSE_DISTRICT_MARKERS, METAVERSE_FACILITIES } from "../metaverseNavigationModel.js";

const CANONICAL_SPATIAL_AUTHORITY = "METAVERSE_CANONICAL_SPATIAL_REGISTRY";

function ref(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function buildMoccDependencyGraph({ events = [], integrations = MOCC_INTEGRATION_REGISTRY } = {}) {
  const nodes = new Map();
  const edges = new Map();
  const eventsByRef = new Map();

  const addNode = (node) => {
    if (node?.node_id && !nodes.has(node.node_id)) nodes.set(node.node_id, node);
  };
  const addEdge = (from, to, relationship_type, authority, source_reference) => {
    if (!nodes.has(from) || !nodes.has(to) || from === to) return;
    const source_authority = ref(authority);
    const source_ref = ref(source_reference);
    if (!source_authority || !source_ref) return;
    const edge_id = `${relationship_type}:${from}:${to}:${source_ref}`;
    edges.set(edge_id, { edge_id, from_node: from, to_node: to, relationship_type, source_authority, source_reference: source_ref });
  };

  for (const integration of Array.isArray(integrations) ? integrations : []) {
    if (!integration?.domain || !integration.status) continue;
    addNode({
      node_id: `integration:${integration.domain}`,
      node_type: "INTEGRATION",
      label: integration.domain.replaceAll("_", " "),
      domain: integration.domain,
      source_authority: "MOCC_INTEGRATION_STATUS_REGISTRY",
      source_reference: integration.domain,
      status: integration.status,
      metadata: {
        owning_system: integration.owning_system ?? null,
        expected_interface: integration.expected_interface ?? null,
        mocc_ready_for: integration.mocc_ready_for ?? null,
        missing_dependency: integration.missing_dependency ?? null,
        impact: integration.impact ?? null,
        completion_step: integration.completion_step ?? null,
      },
    });
  }

  const validEvents = Array.isArray(events) ? events.filter((event) => ref(event?.event_id)) : [];
  for (const event of validEvents) {
    const id = `event:${event.event_id}`;
    const source_reference = ref(event.source_event_ref) || ref(event.event_id);
    addNode({
      node_id: id,
      node_type: "EVENT",
      label: ref(event.title) || ref(event.event_type) || event.event_id,
      domain: ref(event.event_type)?.split(".")[0] || null,
      source_authority: ref(event.source_authority),
      source_reference,
      status: ref(event.state),
      spatial_reference: event.location ? {
        district_id: ref(event.location.district_id),
        facility_id: ref(event.location.facility_id),
      } : null,
      metadata: {
        event_type: ref(event.event_type),
        timestamp: ref(event.timestamp),
        severity: ref(event.severity),
        mission_id: ref(event.mission_id),
        scenario_id: ref(event.scenario_id),
      },
    });
    eventsByRef.set(event.event_id, id);
    if (event.source_event_ref) eventsByRef.set(event.source_event_ref, id);
  }

  for (const event of validEvents) {
    const eventNode = `event:${event.event_id}`;
    const sourceRef = ref(event.source_event_ref) || ref(event.event_id);
    const authority = event.source_authority;
    for (const dependency of event.dependencies || []) {
      const target = eventsByRef.get(dependency);
      if (target) addEdge(eventNode, target, "DEPENDS_ON", authority, sourceRef);
    }
    const parent = eventsByRef.get(event.parent_event);
    if (parent) addEdge(eventNode, parent, "PART_OF", authority, sourceRef);
    for (const childRef of event.child_events || []) {
      const child = eventsByRef.get(childRef);
      if (child) addEdge(child, eventNode, "PART_OF", authority, sourceRef);
    }
    for (const affected of event.affected_entities || []) {
      const target = eventsByRef.get(affected);
      if (target) addEdge(eventNode, target, "AFFECTS", authority, sourceRef);
    }

    for (const [reference, node_type, prefix, relationship] of [
      [ref(event.mission_id), "MISSION", "mission", "RELATED_TO"],
      [ref(event.scenario_id), "SIMULATION", "simulation", "RELATED_TO"],
    ]) {
      if (!reference) continue;
      const relatedNode = `${prefix}:${reference}`;
      addNode({ node_id: relatedNode, node_type, label: reference, domain: node_type === "MISSION" ? "MISSIONS" : "SIMULATIONS", source_authority: ref(authority), source_reference: reference });
      addEdge(eventNode, relatedNode, relationship, authority, sourceRef);
    }

    const facilityId = ref(event.location?.facility_id);
    const districtId = ref(event.location?.district_id);
    const facility = facilityId && METAVERSE_FACILITIES.find((item) => item.id === facilityId || item.destinationId === facilityId);
    const district = districtId && METAVERSE_DISTRICT_MARKERS.find((item) => item.id === districtId);
    if (facility) {
      const facilityNode = `facility:${facility.id}`;
      const canonicalDistrictId = facility.districtId;
      addNode({
        node_id: facilityNode,
        node_type: "FACILITY",
        label: facility.label,
        domain: "LIVING_CITY",
        source_authority: CANONICAL_SPATIAL_AUTHORITY,
        source_reference: facility.destinationId || facility.id,
        spatial_reference: { facility_id: facility.id, district_id: canonicalDistrictId },
      });
      addEdge(eventNode, facilityNode, "LOCATED_AT", authority, sourceRef);
      const canonicalDistrict = METAVERSE_DISTRICT_MARKERS.find((item) => item.id === canonicalDistrictId);
      if (canonicalDistrict) {
        const districtNode = `district:${canonicalDistrict.id}`;
        addNode({ node_id: districtNode, node_type: "DISTRICT", label: canonicalDistrict.fullLabel || canonicalDistrict.label, domain: "LIVING_CITY", source_authority: CANONICAL_SPATIAL_AUTHORITY, source_reference: canonicalDistrict.id, spatial_reference: { district_id: canonicalDistrict.id } });
        addEdge(facilityNode, districtNode, "PART_OF", CANONICAL_SPATIAL_AUTHORITY, facility.destinationId || facility.id);
      }
    } else if (district) {
      const districtNode = `district:${district.id}`;
      addNode({ node_id: districtNode, node_type: "DISTRICT", label: district.fullLabel || district.label, domain: "LIVING_CITY", source_authority: CANONICAL_SPATIAL_AUTHORITY, source_reference: district.id, spatial_reference: { district_id: district.id } });
      addEdge(eventNode, districtNode, "LOCATED_AT", authority, sourceRef);
    }
  }

  return { nodes: [...nodes.values()], edges: [...edges.values()] };
}

export function filterMoccDependencyGraph(graph, filters = {}) {
  const nodes = (graph?.nodes || []).filter((node) => filters[node.node_type] !== false
    && !(node.node_type === "INTEGRATION" && node.status === "PENDING" && filters.PENDING_INTEGRATION === false));
  const ids = new Set(nodes.map((node) => node.node_id));
  return {
    nodes,
    edges: (graph?.edges || []).filter((edge) => ids.has(edge.from_node) && ids.has(edge.to_node)),
  };
}

export function getMoccDependencyNodeDetails(graph, nodeId) {
  const node = (graph?.nodes || []).find((item) => item.node_id === nodeId) || null;
  if (!node) return null;
  return {
    ...node,
    upstream: (graph.edges || []).filter((edge) => edge.to_node === nodeId),
    downstream: (graph.edges || []).filter((edge) => edge.from_node === nodeId),
  };
}
