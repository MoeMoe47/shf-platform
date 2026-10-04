import { getMoccIntegrationStatus, MOCC_INTEGRATION_REGISTRY } from "./moccIntegrationStatusRegistry.js";
import { projectMoccScenario } from "./moccScenarioModel.js";

export const MOCC_WHAT_IF_STATUSES = Object.freeze(["NOT_RUN", "BLOCKED", "PARTIAL", "COMPLETE"]);
export const MOCC_WHAT_IF_IMPACT_TYPES = Object.freeze(["DIRECT", "DEPENDENCY_EXPOSED", "POTENTIAL", "BLOCKED", "UNRESOLVED"]);
export const MOCC_WHAT_IF_MAX_DEPTH = 4;

const NON_CONNECTED_STATUSES = new Set(["PARTIAL", "FOUNDATION", "NOT_CONNECTED", "UNAVAILABLE"]);
const ALLOWED_RELATIONSHIPS = new Set(["AFFECTS", "DEPENDS_ON"]);

function text(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function clone(value) {
  return structuredClone(value);
}

function scenarioSnapshot(scenario) {
  return {
    scenario_id: scenario.scenario_id,
    title: scenario.title,
    mode: scenario.mode,
    status: scenario.status,
    simulation_readiness: scenario.simulation_readiness,
    duration_minutes: scenario.duration_minutes,
    participating_domains: clone(scenario.participating_domains),
    integration_requirements: clone(scenario.integration_requirements),
    initial_conditions: clone(scenario.initial_conditions),
    planned_events: clone(scenario.planned_events),
    dependencies: clone(scenario.dependencies),
    mission_references: clone(scenario.mission_references),
    schedule_references: clone(scenario.schedule_references),
    spatial_references: clone(scenario.spatial_references),
  };
}

function integrationRecord(domain, integrations) {
  return integrations.find((item) => item.domain === domain) || getMoccIntegrationStatus(domain);
}

function integrationOutcome(domain, integrations) {
  const record = integrationRecord(domain, integrations);
  if (!record || record.status === "CONNECTED") return { usable: Boolean(record), record };
  return { usable: false, record };
}

function addUnique(list, key, value) {
  if (!list.some((item) => item[key] === value[key])) list.push(value);
}

function nodeReference(node) {
  return node ? {
    node_id: node.node_id,
    node_type: node.node_type,
    label: node.label,
    domain: node.domain || null,
    status: node.status || null,
    source_authority: node.source_authority || null,
    source_reference: node.source_reference || null,
    spatial_reference: node.spatial_reference ? clone(node.spatial_reference) : null,
  } : null;
}

function edgeReference(edge) {
  return {
    edge_id: edge.edge_id,
    from_node: edge.from_node,
    to_node: edge.to_node,
    relationship_type: edge.relationship_type,
    traversal_from: edge.relationship_type === "DEPENDS_ON" ? edge.to_node : edge.from_node,
    traversal_to: edge.relationship_type === "DEPENDS_ON" ? edge.from_node : edge.to_node,
    source_authority: edge.source_authority || null,
    source_reference: edge.source_reference || null,
  };
}

function pendingEntry(domain, integrations, reason) {
  const integration = integrationRecord(domain, integrations);
  return {
    domain,
    status: integration?.status || "UNAVAILABLE",
    owning_system: integration?.owning_system || null,
    expected_interface: integration?.expected_interface || null,
    missing_dependency: integration?.missing_dependency || null,
    limitation: reason,
  };
}

function blockedImpact({ reference, node, domain, reason, condition, path = [] }) {
  return {
    impact_type: node ? "BLOCKED" : "UNRESOLVED",
    target: nodeReference(node),
    reference: reference || node?.node_id || null,
    domain: domain || node?.domain || null,
    source_condition: condition || null,
    path: path.map(edgeReference),
    source_authority: node?.source_authority || null,
    source_reference: node?.source_reference || null,
    reason,
  };
}

export function createMoccWhatIfNotRun(scenario = null) {
  return {
    analysis_id: null,
    scenario_id: scenario?.scenario_id || null,
    analysis_status: "NOT_RUN",
    created_at: null,
    input_snapshot: null,
    assumptions: [],
    affected_nodes: [],
    affected_domains: [],
    derived_impacts: [],
    blocked_impacts: [],
    blocking_dependencies: [],
    unresolved_references: [],
    pending_integrations: [],
    dependency_paths: [],
    spatial_references: [],
    evidence_refs: [],
    audit_refs: [],
    limitations: ["Analysis has not been run."],
    metadata: {},
  };
}

export function analyzeMoccScenario(scenario = null, {
  analysisId = null,
  dependencyGraph = null,
  schedules = [],
  integrations = MOCC_INTEGRATION_REGISTRY,
  maxDepth = MOCC_WHAT_IF_MAX_DEPTH,
} = {}) {
  if (!scenario || typeof scenario !== "object") return createMoccWhatIfNotRun();

  const validated = projectMoccScenario(scenario, { dependencyGraph, schedules, integrations });
  const graphNodes = new Map((dependencyGraph?.nodes || []).map((node) => [node.node_id, node]));
  const graphEdges = (dependencyGraph?.edges || []).filter((edge) => ALLOWED_RELATIONSHIPS.has(edge.relationship_type))
    .slice().sort((a, b) => a.edge_id.localeCompare(b.edge_id));
  const snapshot = scenarioSnapshot(validated);
  const result = {
    ...createMoccWhatIfNotRun(validated),
    analysis_id: text(analysisId),
    scenario_id: validated.scenario_id,
    analysis_status: "PARTIAL",
    input_snapshot: snapshot,
    assumptions: [],
    affected_nodes: [],
    affected_domains: [],
    derived_impacts: [],
    blocked_impacts: [],
    blocking_dependencies: [],
    unresolved_references: [],
    pending_integrations: [],
    dependency_paths: [],
    spatial_references: clone(validated.spatial_references),
    evidence_refs: clone(validated.evidence_refs),
    audit_refs: clone(validated.audit_refs),
    limitations: [
      "Results describe deterministic scenario relationships only; they do not establish real-world outcomes.",
      "No quantitative, probability, response-time, capacity, or physics model is connected.",
      "No live-domain data or command interface is queried or changed.",
    ],
    metadata: { maximum_traversal_depth: Math.max(1, Math.min(Number(maxDepth) || MOCC_WHAT_IF_MAX_DEPTH, MOCC_WHAT_IF_MAX_DEPTH)) },
  };

  const pendingDomains = new Set();
  const blockedDomains = new Set();
  const participantDomains = new Set(validated.participating_domains.map(({ domain }) => domain));
  const scenarioInputIssues = [];
  for (const participant of Array.isArray(scenario.participating_domains) ? scenario.participating_domains : []) {
    const domain = typeof participant === "string" ? participant : participant?.domain;
    if (text(domain) && !integrationRecord(domain, integrations)) scenarioInputIssues.push({ code: "PARTICIPATING_DOMAIN_UNRESOLVED", reference: domain });
  }
  if (validated.approval_required && validated.approval_status !== "APPROVED") {
    scenarioInputIssues.push({ code: "APPROVAL_NOT_CONFIGURED", reference: validated.scenario_id });
  }
  for (const domain of Object.keys(validated.initial_conditions || {})) {
    if (!integrationRecord(domain, integrations)) scenarioInputIssues.push({ code: "INITIAL_CONDITION_DOMAIN_UNRESOLVED", reference: domain });
    else if (!participantDomains.has(domain)) scenarioInputIssues.push({ code: "INITIAL_CONDITION_DOMAIN_NOT_PARTICIPATING", reference: domain });
  }
  for (const event of validated.planned_events) {
    if (!integrationRecord(event.domain, integrations)) scenarioInputIssues.push({ code: "PLANNED_EVENT_DOMAIN_UNRESOLVED", reference: event.domain });
    else if (!participantDomains.has(event.domain)) scenarioInputIssues.push({ code: "PLANNED_EVENT_DOMAIN_NOT_PARTICIPATING", reference: event.domain });
  }
  for (const dependency of validated.dependencies) {
    const node = graphNodes.get(dependency);
    if (!node) {
      result.unresolved_references.push({ reference: dependency, type: "DEPENDENCY" });
      result.blocking_dependencies.push({ reference: dependency, status: null, reason: "Dependency graph node is unresolved." });
      result.blocked_impacts.push(blockedImpact({ reference: dependency, reason: "Dependency graph node is unresolved." }));
      continue;
    }
    const dependencyIntegration = node.node_type === "INTEGRATION" || node.domain ? integrationRecord(node.domain, integrations) : null;
    if (!dependencyIntegration) continue;
    if (dependencyIntegration.status === "PENDING") {
      pendingDomains.add(node.domain);
      result.blocked_impacts.push(blockedImpact({ node, domain: node.domain, reason: "Required integration is pending; downstream behavior cannot be evaluated." }));
    } else if (NON_CONNECTED_STATUSES.has(dependencyIntegration.status)) {
      blockedDomains.add(node.domain);
      result.blocking_dependencies.push({ reference: dependency, status: dependencyIntegration.status, reason: "Required integration is not connected for this analysis." });
      result.blocked_impacts.push(blockedImpact({ node, domain: node.domain, reason: "Required integration is not connected; no downstream result is inferred." }));
    }
  }

  for (const participant of validated.participating_domains) {
    if (participant.integration_status === "PENDING") {
      pendingDomains.add(participant.domain);
      addUnique(result.pending_integrations, "domain", pendingEntry(participant.domain, integrations, "Scenario includes a pending integration; its downstream behavior is not evaluated."));
    } else if (participant.required && NON_CONNECTED_STATUSES.has(participant.integration_status)) {
      blockedDomains.add(participant.domain);
      result.blocking_dependencies.push({ reference: `integration:${participant.domain}`, status: participant.integration_status, reason: "Required participating domain is not connected for deterministic analysis." });
    }
  }
  for (const requirement of validated.integration_requirements) {
    const domain = requirement.startsWith("integration:") ? requirement.slice("integration:".length) : requirement;
    const integration = integrationRecord(domain, integrations);
    if (!integration) {
      result.unresolved_references.push({ reference: requirement, type: "INTEGRATION_REQUIREMENT" });
      result.blocking_dependencies.push({ reference: requirement, status: null, reason: "No canonical integration record resolves this requirement." });
    } else if (integration.status === "PENDING") {
      pendingDomains.add(domain);
      addUnique(result.pending_integrations, "domain", pendingEntry(domain, integrations, "Required integration is pending; related impacts cannot be evaluated."));
    } else if (NON_CONNECTED_STATUSES.has(integration.status)) {
      blockedDomains.add(domain);
      result.blocking_dependencies.push({ reference: `integration:${domain}`, status: integration.status, reason: "Required integration is not connected to a deterministic analysis interface." });
    }
  }

  if (scenarioInputIssues.length || !["READY", "PENDING_INTEGRATION", "VALIDATED"].includes(validated.status)) {
    result.analysis_status = "BLOCKED";
    const validationIssues = [...validated.validation_issues, ...scenarioInputIssues];
    result.blocking_dependencies.push(...validationIssues.map((item) => ({ reference: item.reference || item.domain || null, status: null, reason: item.code })));
    result.unresolved_references.push(...validationIssues
      .filter((item) => item.code.includes("UNRESOLVED"))
      .map((item) => ({ reference: item.reference || null, type: item.code })));
    result.limitations.push("Scenario validation must pass before any impact traversal can run.");
    return result;
  }

  const directInputs = [];
  const addInput = ({ nodeReferenceId, domain, condition, sourceReference, spatialReference = null }) => {
    if (nodeReferenceId) {
      const node = graphNodes.get(nodeReferenceId);
      if (!node) {
        result.unresolved_references.push({ reference: nodeReferenceId, type: "SCENARIO_INPUT" });
        result.blocked_impacts.push(blockedImpact({ reference: nodeReferenceId, domain, condition, reason: "No matching dependency graph node exists." }));
        return;
      }
      const nodeIntegration = node.node_type === "INTEGRATION" || node.domain
        ? integrationOutcome(node.domain || domain, integrations)
        : null;
      if (nodeIntegration && !nodeIntegration.usable) {
        const state = nodeIntegration;
        if (state.record?.status === "PENDING") {
          pendingDomains.add(node.domain || domain);
          addUnique(result.pending_integrations, "domain", pendingEntry(node.domain || domain, integrations, "Scenario input domain is pending; no downstream behavior is evaluated."));
          result.blocked_impacts.push(blockedImpact({ reference: node.node_id, node, domain, condition, reason: "Pending integration prevents evaluating this scenario input." }));
        } else {
          blockedDomains.add(node.domain || domain);
          result.blocking_dependencies.push({ reference: node.node_id, status: state.record?.status || null, reason: "Scenario input domain has no connected analysis interface." });
          result.blocked_impacts.push(blockedImpact({ reference: node.node_id, node, domain, condition, reason: "No connected domain analysis interface; downstream behavior is unresolved." }));
        }
        return;
      }
      directInputs.push({ node, condition, source_reference: sourceReference || null, spatial_reference: spatialReference });
      return;
    }
    result.unresolved_references.push({ reference: domain || sourceReference, type: "SCENARIO_INPUT_DOMAIN" });
    result.blocked_impacts.push(blockedImpact({ reference: domain || sourceReference, domain, condition, reason: "No canonical graph node resolves this scenario input." }));
  };

  for (const [domain, conditions] of Object.entries(validated.initial_conditions || {})) {
    const conditionEntries = conditions && typeof conditions === "object" && !Array.isArray(conditions) ? Object.entries(conditions) : [];
    for (const [key, value] of conditionEntries) {
      const condition = { kind: "INITIAL_CONDITION", domain, key, value: clone(value) };
      addInput({ nodeReferenceId: `integration:${domain}`, domain, condition, sourceReference: domain });
      result.assumptions.push({ statement: `Scenario input ${domain}.${key} is treated as an imposed simulation condition, not an observed operational fact.`, source: condition });
    }
  }

  for (const event of validated.planned_events) {
    const eventDomain = text(event.domain);
    const integration = integrationRecord(eventDomain, integrations);
    const condition = {
      kind: "PLANNED_SCENARIO_EVENT",
      scenario_event_id: event.scenario_event_id,
      event_type: event.event_type,
      domain: eventDomain,
      relative_time_minutes: event.relative_time_minutes,
    };
    if (integration?.status === "PENDING") {
      pendingDomains.add(eventDomain);
      result.blocked_impacts.push(blockedImpact({ reference: event.target_reference, domain: eventDomain, condition, reason: "The event's domain integration is pending; no event behavior is simulated." }));
      result.assumptions.push({ statement: `Planned event ${event.scenario_event_id} is a scenario input only; no operational event is created.`, source: condition });
      continue;
    }
    if (!integration || integration.status !== "CONNECTED") {
      if (integration?.status) blockedDomains.add(eventDomain);
      result.blocking_dependencies.push({ reference: `integration:${eventDomain}`, status: integration?.status || null, reason: "Planned-event domain has no connected deterministic analysis interface." });
      result.blocked_impacts.push(blockedImpact({ reference: event.target_reference, domain: eventDomain, condition, reason: "No connected deterministic event model; event consequences are not inferred." }));
      continue;
    }
    const target = event.target_reference;
    const targetNodeId = target && graphNodes.has(target) ? target : null;
    if (target && !targetNodeId) {
      result.unresolved_references.push({ reference: target, type: "SCENARIO_EVENT_TARGET" });
      result.blocked_impacts.push(blockedImpact({ reference: target, domain: eventDomain, condition, reason: "Canonical location is not represented by a dependency graph node; no impact path can be traversed." }));
      continue;
    }
    addInput({ nodeReferenceId: targetNodeId || `integration:${eventDomain}`, domain: eventDomain, condition, sourceReference: event.scenario_event_id, spatialReference: target || null });
    result.assumptions.push({ statement: `Planned event ${event.scenario_event_id} is treated as a direct scenario input at its declared target/domain; its event type has no additional behavior model.`, source: condition });
  }

  const maxTraversalDepth = result.metadata.maximum_traversal_depth;
  const impactBySourceTarget = new Set();
  const impactedNodeIds = new Set();

  for (const input of directInputs) {
    const sourceId = input.node.node_id;
    const sourceKey = `${sourceId}:${input.condition?.scenario_event_id || input.condition?.key || input.condition?.kind}`;
    const directKey = `${sourceKey}->${sourceId}`;
    if (!impactBySourceTarget.has(directKey)) {
      impactBySourceTarget.add(directKey);
      result.derived_impacts.push({
        impact_type: "DIRECT",
        target: nodeReference(input.node),
        source_condition: input.condition,
        scenario_reference: input.source_reference || input.condition?.scenario_event_id || input.condition?.domain || null,
        source_node: nodeReference(input.node),
        path: [],
        rule: "SCENARIO_INPUT_DIRECT",
        explanation: "Scenario configuration names this node as an input target; this is not a prediction of operational change.",
      });
      impactedNodeIds.add(sourceId);
    }

    const visited = new Set([sourceId]);
    const queue = [{ nodeId: sourceId, path: [], depth: 0 }];
    while (queue.length) {
      const current = queue.shift();
      const nextSteps = [];
      for (const edge of graphEdges) {
        if (edge.relationship_type === "AFFECTS" && edge.from_node === current.nodeId) {
          nextSteps.push({ edge, nodeId: edge.to_node });
        } else if (edge.relationship_type === "DEPENDS_ON" && edge.to_node === current.nodeId) {
          nextSteps.push({ edge, nodeId: edge.from_node });
        }
      }
      for (const step of nextSteps) {
        const next = graphNodes.get(step.nodeId);
        if (!next || visited.has(step.nodeId)) continue;
        const path = [...current.path, step.edge];
        if (current.depth >= maxTraversalDepth) {
          result.blocked_impacts.push(blockedImpact({ reference: next.node_id, node: next, condition: input.condition, path, reason: `Traversal depth limit (${maxTraversalDepth}) reached.` }));
          result.limitations.push(`Traversal stopped at the configured maximum depth of ${maxTraversalDepth}.`);
          continue;
        }
        visited.add(step.nodeId);
        const key = `${sourceKey}->${next.node_id}`;
        const nextIntegration = next.node_type === "INTEGRATION" || next.domain ? integrationRecord(next.domain, integrations) : null;
        if (nextIntegration && nextIntegration.status !== "CONNECTED") {
          if (nextIntegration.status === "PENDING") {
            pendingDomains.add(next.domain);
            addUnique(result.pending_integrations, "domain", pendingEntry(next.domain, integrations, "Impact path reaches a pending domain; downstream behavior is not evaluated."));
          } else {
            blockedDomains.add(next.domain);
            result.blocking_dependencies.push({ reference: next.node_id, status: nextIntegration.status || null, reason: "Impact path reaches a domain without a connected analysis interface." });
          }
          result.blocked_impacts.push(blockedImpact({ reference: next.node_id, node: next, domain: next.domain, condition: input.condition, path, reason: nextIntegration.status === "PENDING" ? "Pending integration stops this impact path." : "Unavailable integration stops this impact path." }));
          continue;
        }
        if (!impactBySourceTarget.has(key)) {
          impactBySourceTarget.add(key);
          const usesDependency = path.some((edge) => edge.relationship_type === "DEPENDS_ON");
          result.derived_impacts.push({
            impact_type: usesDependency ? "DEPENDENCY_EXPOSED" : "DIRECT",
            target: nodeReference(next),
            source_condition: input.condition,
            scenario_reference: input.source_reference || input.condition?.scenario_event_id || input.condition?.domain || null,
            source_node: nodeReference(input.node),
            path: path.map(edgeReference),
            rule: usesDependency ? "SUPPORTED_DEPENDENCY_EDGE" : "SUPPORTED_AFFECTS_EDGE",
            explanation: usesDependency ? "An explicit DEPENDS_ON relationship exposes this dependent node to the scenario input; no failure is asserted." : "An explicit AFFECTS relationship connects this node to the scenario input; no further outcome is asserted.",
          });
          impactedNodeIds.add(next.node_id);
        }
        queue.push({ nodeId: next.node_id, path, depth: current.depth + 1 });
      }
    }
  }

  for (const domain of pendingDomains) {
    addUnique(result.pending_integrations, "domain", pendingEntry(domain, integrations, "This domain's downstream behavior is outside the available analysis interface."));
  }
  for (const domain of blockedDomains) {
    const integration = integrationRecord(domain, integrations);
    result.blocking_dependencies.push({ reference: `integration:${domain}`, status: integration?.status || null, reason: "Required domain is not connected to a deterministic analysis interface." });
  }

  result.affected_nodes = [...impactedNodeIds].map((nodeId) => nodeReference(graphNodes.get(nodeId))).filter(Boolean);
  result.affected_domains = [...new Set(result.affected_nodes.map((node) => node.domain).filter(Boolean))].sort();
  result.dependency_paths = result.derived_impacts.filter((impact) => impact.path.length).map((impact) => ({
    source_node: impact.source_node,
    target_node: impact.target,
    relationship_path: impact.path,
    rule: impact.rule,
  }));
  result.unresolved_references = result.unresolved_references.filter((entry, index, all) => all.findIndex((other) => other.reference === entry.reference && other.type === entry.type) === index);
  result.blocking_dependencies = result.blocking_dependencies.filter((entry, index, all) => all.findIndex((other) => other.reference === entry.reference && other.reason === entry.reason) === index);

  const hasInputs = directInputs.length > 0;
  const incomplete = result.pending_integrations.length > 0 || result.blocked_impacts.length > 0 || result.unresolved_references.length > 0 || result.blocking_dependencies.length > 0;
  result.analysis_status = hasInputs && !incomplete ? "COMPLETE" : "PARTIAL";
  if (!hasInputs) result.limitations.push("No scenario input resolved to an analyzable dependency graph node.");
  if (pendingDomains.size) result.limitations.push("Pending integrations limit downstream analysis; no behavior for those domains is inferred.");
  if (blockedDomains.size) result.limitations.push("One or more required domains are not connected; their downstream impacts remain unresolved.");

  return result;
}
