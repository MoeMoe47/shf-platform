export type Pr2GapStatus = "RESOLVED" | "BLOCKED — EXTERNAL DEPENDENCY" | "OPEN — REPOSITORY WORK REMAINS";

export type Pr2GapReadiness = {
  gapId: string;
  gap: string;
  status: Pr2GapStatus;
  evidence: string;
  remainingDependency: string;
};

export type LineageNode = {
  id: string;
  owner: string;
  sourceId: string;
  scope: "organization_tenant" | "subject_organization_tenant" | "public_safe";
  provenance: string;
  version: string;
};

export type LineageChain = {
  id: string;
  domain: "education" | "civicsure" | "studio" | "arag1" | "agent_fabric" | "program";
  nodes: LineageNode[];
  terminal: string;
};

export const PR2_SCOPED_GAPS: Pr2GapReadiness[] = [
  {
    gapId: "PR0-GAP-010",
    gap: "Object/evidence/report storage",
    status: "BLOCKED — EXTERNAL DEPENDENCY",
    evidence: "Local private source/report storage has safe-key, immutable-create, hashable backup/restore support.",
    remainingDependency: "Production object store, encryption/lifecycle policy, and access-control proof.",
  },
  {
    gapId: "PR0-GAP-011",
    gap: "Upload security",
    status: "BLOCKED — EXTERNAL DEPENDENCY",
    evidence: "Source ingestion validates type, size, safe filename, explicit authentication, scope, private storage, and audit metadata.",
    remainingDependency: "Production malware/content scanning provider and quarantine acceptance proof.",
  },
  {
    gapId: "PR0-GAP-012",
    gap: "Backup / restore",
    status: "BLOCKED — EXTERNAL DEPENDENCY",
    evidence: "Repository-local file-store backup/restore helpers and safe drill tests exist; DB backup plan is provider-neutral and secret-safe.",
    remainingDependency: "Scheduled production DB/object/report/config backups and restore drill in deployed infrastructure.",
  },
  {
    gapId: "PR0-GAP-017",
    gap: "Privacy / retention / deletion / legal hold / SAR",
    status: "RESOLVED",
    evidence: "Machine-checkable classification, no-delete canonical boundaries, legal-hold override, scoped subject export, and correction routing are defined.",
    remainingDependency: "None for repository-local PR-2 scope; counsel/customer-specific durations remain policy inputs.",
  },
  {
    gapId: "PR0-GAP-024",
    gap: "Real-data lineage",
    status: "BLOCKED — EXTERNAL DEPENDENCY",
    evidence: "Representative education, CivicSure, Studio, ARAG-1, Agent Fabric, and program lineage chains are machine-checkable.",
    remainingDependency: "Real or approved production-like pilot source data and source-owner acceptance.",
  },
  {
    gapId: "PR0-GAP-025",
    gap: "Recompute / correction propagation",
    status: "RESOLVED",
    evidence: "Correction propagation requires event detection, recompute, projection refresh, metric refresh, report supersession, and public projection refresh.",
    remainingDependency: "None for repository-local PR-2 scope; real-data proof is tracked by PR0-GAP-024.",
  },
];

export const REPRESENTATIVE_LINEAGE_CHAINS: LineageChain[] = [
  {
    id: "lineage.education.program-progress.v1",
    domain: "education",
    terminal: "institutional_report",
    nodes: [
      { id: "enrollment", owner: "EnrollmentService", sourceId: "enrollments.enrollment_id", scope: "subject_organization_tenant", provenance: "created_by_user_id", version: "enrollment revision" },
      { id: "assignment", owner: "AssignmentService", sourceId: "assignments.assignment_id", scope: "subject_organization_tenant", provenance: "created_by", version: "curriculum_release_id" },
      { id: "lesson_activity", owner: "CurriculumCatalogService", sourceId: "curriculum_releases.release_id", scope: "organization_tenant", provenance: "published_by_user_id", version: "version_number/content_hash" },
      { id: "assessment_outcome", owner: "LearnerResultService", sourceId: "curriculum_learner_outcomes.outcome_id", scope: "subject_organization_tenant", provenance: "provenance_json", version: "supersedes_outcome_id/source_versions_json" },
      { id: "program_completion", owner: "ProgramCompletionService", sourceId: "program_completion_records.program_completion_id", scope: "subject_organization_tenant", provenance: "completion_hash", version: "requirements_version/definition_hash" },
      { id: "report", owner: "ReportingService", sourceId: "report_artifacts.artifact_id", scope: "organization_tenant", provenance: "canonical_references_json", version: "artifact_version/content_hash" },
    ],
  },
  {
    id: "lineage.civicsure.assurance-public.v1",
    domain: "civicsure",
    terminal: "public_safe_projection",
    nodes: [
      { id: "funding_requirement", owner: "GovernmentAssuranceService", sourceId: "gpa_funding_awards/gpa_source_systems", scope: "organization_tenant", provenance: "provenance_json", version: "policy_version" },
      { id: "claim_delivery", owner: "GPAClaimService", sourceId: "gpa_claims.claim_id", scope: "organization_tenant", provenance: "source_authority_references", version: "claim version" },
      { id: "verification", owner: "ClaimVerificationService", sourceId: "gpa_verifications.verification_id", scope: "organization_tenant", provenance: "evidence_references", version: "method_id/method_version" },
      { id: "truth", owner: "GPATruthService", sourceId: "gpa_truth_facts.truth_fact_id", scope: "organization_tenant", provenance: "verification_id/evidence_references", version: "truth_version/supersession" },
      { id: "metric", owner: "MetricRegistry", sourceId: "gpa_metric_results.metric_result_id", scope: "organization_tenant", provenance: "source_truth_fact_ids", version: "metric_id/version" },
      { id: "public_projection", owner: "ReportingPublicDisclosure", sourceId: "shf_public_impact_projections.projection_id", scope: "public_safe", provenance: "snapshot_hash/publication_id", version: "report_version/snapshot_version" },
    ],
  },
  {
    id: "lineage.studio.release.v1",
    domain: "studio",
    terminal: "release_artifact",
    nodes: [
      { id: "project", owner: "StudioProjectService", sourceId: "projects.project_id", scope: "subject_organization_tenant", provenance: "created_by_user_id", version: "project status" },
      { id: "workspace_revision", owner: "StudioProjectService", sourceId: "studio_workspace_revisions.revision_id", scope: "subject_organization_tenant", provenance: "saved_by_user_id", version: "revision_number" },
      { id: "qa_run", owner: "StudioQA", sourceId: "studio_qa_runs.qa_run_id", scope: "organization_tenant", provenance: "workspace_revision_id", version: "qa policy version" },
      { id: "review_submission", owner: "StudioReview", sourceId: "studio_review_submissions.submission_id", scope: "organization_tenant", provenance: "submitted_snapshot_hash", version: "workspace_revision_id" },
      { id: "review_decision", owner: "StudioReview", sourceId: "studio_review_decisions.decision_id", scope: "organization_tenant", provenance: "reviewer_user_id", version: "decision_version" },
      { id: "finalized_delivery", owner: "StudioRelease", sourceId: "studio_handoffs.handoff_id", scope: "organization_tenant", provenance: "approved_submission_id", version: "artifact_hash" },
    ],
  },
  {
    id: "lineage.arag1.release-assurance.v1",
    domain: "arag1",
    terminal: "release_decision",
    nodes: [
      { id: "work_order", owner: "ARAGReleaseService", sourceId: "arag_release_requests.release_request_id", scope: "organization_tenant", provenance: "repository_scope", version: "policy_version" },
      { id: "gate_check", owner: "ARAGReleaseService", sourceId: "arag_release_evaluations.evaluation_id", scope: "organization_tenant", provenance: "check_results_hash", version: "gate_version" },
      { id: "human_approval", owner: "ARAGReleaseService", sourceId: "arag_release_approvals.approval_id", scope: "organization_tenant", provenance: "approved_by_user_id", version: "approval_version" },
      { id: "release_record", owner: "ARAGReleaseService", sourceId: "arag_release_records.release_record_id", scope: "organization_tenant", provenance: "evidence_packet_hash", version: "release_version" },
    ],
  },
  {
    id: "lineage.agent-fabric.governed-session.v1",
    domain: "agent_fabric",
    terminal: "audit_event",
    nodes: [
      { id: "agent_identity", owner: "AIGovernance", sourceId: "ai_agent_definitions.agent_identifier", scope: "organization_tenant", provenance: "model_policy_reference", version: "agent_version" },
      { id: "session", owner: "AgentSimulationService", sourceId: "ai_agent_simulations.simulation_id", scope: "organization_tenant", provenance: "principal_user_id", version: "policy snapshot" },
      { id: "tool_invocation", owner: "MCPGateway", sourceId: "mcp_invocations.mcp_invocation_id", scope: "organization_tenant", provenance: "resource/tool/policy", version: "execution_mode" },
      { id: "audit", owner: "AuditService", sourceId: "audit_events.audit_event_id", scope: "organization_tenant", provenance: "actor/target/reason", version: "append-only event" },
    ],
  },
  {
    id: "lineage.program.service-delivery.v1",
    domain: "program",
    terminal: "service_report",
    nodes: [
      { id: "organization", owner: "IdentityOrganizationService", sourceId: "organizations.organization_id", scope: "organization_tenant", provenance: "created_by_user_id", version: "status" },
      { id: "service_entitlement", owner: "ServiceCatalogService", sourceId: "organization_service_entitlements.entitlement_id", scope: "organization_tenant", provenance: "agreement_reference", version: "service_key/version" },
      { id: "program", owner: "ProgramService", sourceId: "programs.program_id", scope: "organization_tenant", provenance: "program_classification", version: "program status" },
      { id: "delivery_evidence", owner: "Evidence/Reporting", sourceId: "source_assets/report_artifacts", scope: "organization_tenant", provenance: "content_hash/canonical_references", version: "artifact_version" },
    ],
  },
];

export type DataClass =
  | "PUBLIC"
  | "INTERNAL"
  | "CONFIDENTIAL"
  | "RESTRICTED"
  | "PARTICIPANT_PII"
  | "STUDENT_DATA"
  | "PROVIDER_CONFIDENTIAL"
  | "GOVERNMENT_ASSURANCE_INTERNAL"
  | "IMMUTABLE_INSTITUTIONAL_HISTORY";

export type RetentionDecision = {
  action: "NO_AUTOMATIC_DELETE" | "ARCHIVE_ONLY" | "DELETE_ELIGIBLE" | "EXPORT_ELIGIBLE";
  reason: string;
};

const CANONICAL_NO_DELETE = new Set<DataClass>([
  "RESTRICTED",
  "STUDENT_DATA",
  "PROVIDER_CONFIDENTIAL",
  "GOVERNMENT_ASSURANCE_INTERNAL",
  "IMMUTABLE_INSTITUTIONAL_HISTORY",
]);

export function retentionDecision(dataClass: DataClass, input: { legalHold?: boolean; canonicalHistory?: boolean; subjectExport?: boolean } = {}): RetentionDecision {
  if (input.legalHold) return { action: "NO_AUTOMATIC_DELETE", reason: "LEGAL_HOLD_ACTIVE" };
  if (input.canonicalHistory || CANONICAL_NO_DELETE.has(dataClass)) return { action: "NO_AUTOMATIC_DELETE", reason: "CANONICAL_OR_PROTECTED_HISTORY" };
  if (input.subjectExport) return { action: "EXPORT_ELIGIBLE", reason: "SUBJECT_ACCESS_ALLOWED_WITH_SCOPE_FILTERS" };
  if (dataClass === "PUBLIC" || dataClass === "INTERNAL") return { action: "ARCHIVE_ONLY", reason: "LOWER_CLASSIFICATION_REQUIRES_OWNER_POLICY" };
  return { action: "NO_AUTOMATIC_DELETE", reason: "UNKNOWN_PRIVACY_POLICY_DEFAULT_DENY" };
}

export function subjectExportRecordAllowed(record: { subjectUserId?: string; learnerUserId?: string; classification: DataClass; internalOnly?: boolean }, subjectUserId: string) {
  const owner = record.subjectUserId || record.learnerUserId;
  if (!owner || owner !== subjectUserId) return false;
  if (record.internalOnly) return false;
  return !["RESTRICTED", "PROVIDER_CONFIDENTIAL", "GOVERNMENT_ASSURANCE_INTERNAL", "IMMUTABLE_INSTITUTIONAL_HISTORY"].includes(record.classification);
}

export type CorrectionPropagationPlan = {
  sourceCorrection: string;
  eventRequired: boolean;
  recomputeRequired: boolean;
  projectionRefreshRequired: boolean;
  metricRefreshRequired: boolean;
  reportSupersessionRequired: boolean;
  publicProjectionRefreshRequired: boolean;
};

export function correctionPropagationPlan(sourceCorrection: string): CorrectionPropagationPlan {
  const source = String(sourceCorrection || "").trim();
  if (!source) throw new Error("source_correction_required");
  return {
    sourceCorrection: source,
    eventRequired: true,
    recomputeRequired: true,
    projectionRefreshRequired: true,
    metricRefreshRequired: true,
    reportSupersessionRequired: true,
    publicProjectionRefreshRequired: true,
  };
}

export function validateLineageChain(chain: LineageChain) {
  if (chain.nodes.length < 2) throw new Error("lineage_chain_incomplete");
  const missing = chain.nodes.find((node) => !node.owner || !node.sourceId || !node.scope || !node.provenance || !node.version);
  if (missing) throw new Error(`lineage_node_incomplete:${missing.id}`);
  return true;
}
