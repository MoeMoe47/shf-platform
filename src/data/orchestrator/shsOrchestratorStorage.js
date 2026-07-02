import { SHS_ORCHESTRATOR_REQUEST_SEED_V1, SHS_ORCHESTRATOR_REQUEST_STORAGE_KEY } from "./shsOrchestratorRequests";
import { SHS_ORCHESTRATOR_PLAN_SEED_V1, SHS_ORCHESTRATOR_PLAN_STORAGE_KEY } from "./shsOrchestratorPlans";
import { getShsOrchestratorTemplate, SHS_ORCHESTRATOR_TEMPLATES_V1 } from "./shsOrchestratorTemplates";
import { calculateShsOrchestratorReadiness } from "./shsOrchestratorReadiness";
import { applyShsOrchestratorSafetyDefaults, buildShsOrchestratorAuditEvent } from "./shsOrchestratorSafety";

function canUseStorage() {
  try {
    return Boolean(globalThis?.localStorage);
  } catch {
    return false;
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function readJson(key, fallback) {
  if (!canUseStorage()) return clone(fallback);
  try {
    const stored = globalThis.localStorage.getItem(key);
    if (!stored) {
      const seed = clone(fallback);
      globalThis.localStorage.setItem(key, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : clone(fallback);
  } catch {
    return clone(fallback);
  }
}

function saveJson(key, value) {
  const safeValue = Array.isArray(value) ? value : [];
  if (canUseStorage()) {
    globalThis.localStorage.setItem(key, JSON.stringify(safeValue));
  }
  return safeValue;
}

function normalizePlan(plan, request = {}) {
  const safePlan = applyShsOrchestratorSafetyDefaults(plan);
  const readiness = calculateShsOrchestratorReadiness(request, safePlan);
  return applyShsOrchestratorSafetyDefaults({
    ...safePlan,
    readiness_score: readiness.readiness_score,
    blockers: readiness.blockers,
    warnings: readiness.warnings,
    updated_at: safePlan.updated_at || nowIso(),
  });
}

export function getShsOrchestratorTemplates() {
  return SHS_ORCHESTRATOR_TEMPLATES_V1;
}

export function getShsOrchestratorRequests() {
  return readJson(SHS_ORCHESTRATOR_REQUEST_STORAGE_KEY, SHS_ORCHESTRATOR_REQUEST_SEED_V1);
}

export function saveShsOrchestratorRequests(requests) {
  return saveJson(SHS_ORCHESTRATOR_REQUEST_STORAGE_KEY, requests);
}

export function getShsOrchestratorPlans() {
  const requests = getShsOrchestratorRequests();
  return readJson(SHS_ORCHESTRATOR_PLAN_STORAGE_KEY, SHS_ORCHESTRATOR_PLAN_SEED_V1).map((plan) => {
    const request = requests.find((item) => item.orchestration_request_id === plan.orchestration_request_id) || {};
    return normalizePlan(plan, request);
  });
}

export function saveShsOrchestratorPlans(plans) {
  const requests = getShsOrchestratorRequests();
  return saveJson(SHS_ORCHESTRATOR_PLAN_STORAGE_KEY, plans.map((plan) => {
    const request = requests.find((item) => item.orchestration_request_id === plan.orchestration_request_id) || {};
    return normalizePlan(plan, request);
  }));
}

export function resetShsOrchestratorState() {
  saveShsOrchestratorRequests(clone(SHS_ORCHESTRATOR_REQUEST_SEED_V1));
  saveShsOrchestratorPlans(clone(SHS_ORCHESTRATOR_PLAN_SEED_V1));
  return {
    requests: getShsOrchestratorRequests(),
    plans: getShsOrchestratorPlans(),
  };
}

export function createShsOrchestratorRequestFromTemplate(templateId) {
  const template = getShsOrchestratorTemplate(templateId);
  const createdAt = nowIso();
  const requests = getShsOrchestratorRequests();
  const request = {
    orchestration_request_id: `orch_req_${String(requests.length + 1).padStart(3, "0")}_${Date.now().toString(36)}`,
    title: template.title,
    request_type: template.request_type,
    operator_intent: template.summary,
    related_client_id: "",
    related_project_id: "",
    related_report_id: "",
    related_agent_ids: template.participating_agents,
    related_workflow_run_id: "",
    related_coordination_plan_id: "",
    related_direct_source_proof_ids: template.required_direct_source_proofs,
    related_task_ids: [],
    status: "draft",
    risk_level: template.risk_level,
    created_at: createdAt,
    updated_at: createdAt,
    operator_note: "Created locally from SHS System Orchestrator V1 template. No execution performed.",
  };
  saveShsOrchestratorRequests([request, ...requests]);
  return {
    requests: getShsOrchestratorRequests(),
    plans: getShsOrchestratorPlans(),
    createdRequest: request,
  };
}

export function analyzeShsOrchestratorRequest(requestId) {
  const requests = getShsOrchestratorRequests();
  const plans = getShsOrchestratorPlans();
  const request = requests.find((item) => item.orchestration_request_id === requestId) || requests[0];
  const template = SHS_ORCHESTRATOR_TEMPLATES_V1.find((item) => item.request_type === request.request_type) || SHS_ORCHESTRATOR_TEMPLATES_V1[0];
  const createdAt = nowIso();
  const plan = normalizePlan({
    orchestration_plan_id: `orch_plan_${String(plans.length + 1).padStart(3, "0")}_${Date.now().toString(36)}`,
    orchestration_request_id: request.orchestration_request_id,
    title: `${template.title} plan`,
    summary: template.summary,
    participating_layers: template.participating_layers,
    participating_agents: template.participating_agents,
    recommended_workflow_template: template.recommended_workflow_template,
    recommended_coordination_template: template.recommended_coordination_template,
    required_context_packets: [`${template.request_type}_context_packet`],
    required_direct_source_proofs: request.related_direct_source_proof_ids?.length ? request.related_direct_source_proof_ids : template.required_direct_source_proofs,
    required_reports: request.related_report_id ? [request.related_report_id] : [],
    required_approvals: template.required_approvals,
    required_governance_gates: template.required_governance_gates,
    readiness_score: 0,
    blockers: [],
    warnings: ["Operator review remains required before any downstream action."],
    safe_next_actions: template.safe_next_actions,
    dangerous_actions_blocked: [],
    created_at: createdAt,
    updated_at: createdAt,
    audit_events: [buildShsOrchestratorAuditEvent("orchestrator_plan_analyzed", "Created local orchestration plan. No execution performed.")],
  }, request);

  const nextRequests = requests.map((item) => item.orchestration_request_id === request.orchestration_request_id
    ? { ...item, status: plan.blockers.length ? "blocked" : "analyzing", updated_at: createdAt }
    : item);
  saveShsOrchestratorRequests(nextRequests);
  saveShsOrchestratorPlans([plan, ...plans]);
  return {
    requests: getShsOrchestratorRequests(),
    plans: getShsOrchestratorPlans(),
    createdPlan: plan,
  };
}

export function applyShsOrchestratorRequestAction(requestId, action, note = "") {
  const statusByAction = {
    ready: "ready_for_review",
    block: "blocked",
    complete: "completed_local",
    approve: "approved_local",
    note: undefined,
  };
  const requests = getShsOrchestratorRequests();
  const nextRequests = requests.map((request) => {
    if (request.orchestration_request_id !== requestId) return request;
    return {
      ...request,
      status: statusByAction[action] || request.status,
      operator_note: note || request.operator_note,
      updated_at: nowIso(),
    };
  });
  return {
    requests: saveShsOrchestratorRequests(nextRequests),
    plans: getShsOrchestratorPlans(),
  };
}
