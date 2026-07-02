import { findRequestedDangerousActions, SHS_ORCHESTRATOR_DANGEROUS_FLAGS_FALSE } from "./shsOrchestratorSafety";

export function calculateShsOrchestratorReadiness(request = {}, plan = {}) {
  let readiness_score = 100;
  const blockers = [...(plan.blockers || [])];
  const warnings = [...(plan.warnings || [])];
  const dangerousActions = findRequestedDangerousActions(request, plan);
  const requiredGovernanceGates = plan.required_governance_gates || [];
  const requiredDirectSourceProofs = plan.required_direct_source_proofs || [];
  const requiredContextPackets = plan.required_context_packets || [];

  if (request.risk_level === "critical" || plan.risk_level === "critical") readiness_score -= 30;
  if (!plan.required_approvals?.length) {
    readiness_score -= 25;
    blockers.push("missing_human_approval_path");
  }
  if (!requiredGovernanceGates.length) {
    readiness_score -= 20;
    blockers.push("missing_required_governance_gates");
  }
  if (["client_report", "direct_source_proof", "launch_readiness"].includes(request.request_type) && !requiredDirectSourceProofs.length) {
    readiness_score -= 20;
    warnings.push("required_source_proof_missing");
  }
  if (!plan.recommended_workflow_template) {
    readiness_score -= 15;
    warnings.push("required_workflow_missing");
  }
  if (!requiredContextPackets.length) {
    readiness_score -= 15;
    warnings.push("required_context_packet_missing");
  }
  if (blockers.length) readiness_score -= 15;
  if (warnings.length) readiness_score -= 10;
  if (dangerousActions.length) {
    readiness_score -= 50;
    blockers.push(...dangerousActions.map((action) => `dangerous_action_requested:${action}`));
  }

  const uniqueBlockers = [...new Set(blockers)];
  const uniqueWarnings = [...new Set(warnings)];
  const score = Math.max(0, readiness_score);
  const requiredGateSet = new Set(requiredGovernanceGates);
  const dataApprovalRequired = requiredGateSet.has("Data Approval Gateway") || request.request_type !== "custom";
  const readinessGateRequired = requiredGateSet.has("Readiness Gate") || ["launch_readiness", "client_report", "sales_to_delivery"].includes(request.request_type);
  const boundaryIntact = Object.values(SHS_ORCHESTRATOR_DANGEROUS_FLAGS_FALSE).every((value) => value === false);
  const ready = score >= 80
    && uniqueBlockers.length === 0
    && dangerousActions.length === 0
    && Boolean(plan.required_approvals?.length)
    && readinessGateRequired
    && dataApprovalRequired
    && boundaryIntact;

  return {
    readiness_score: score,
    ready,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    dangerous_actions_requested: dangerousActions,
    readiness_gate_required: readinessGateRequired,
    data_approval_required_before_public_use: dataApprovalRequired,
    shs_shf_boundary_intact: boundaryIntact,
  };
}
