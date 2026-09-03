import { query } from "../../../db/client.js";
import { StudioProjectService } from "./studio-project-service.js";
import { projectAuthoritativeFact } from "../../verified-evidence/service/verified-evidence-service.js";
import { evaluateAssignmentCompletion } from "../../completion-policy/service/completion-evaluator.js";
import { PortfolioService } from "../../portfolio/service/portfolio-service.js";

const projects = new StudioProjectService();
const portfolio = new PortfolioService();

function scope(actor: any) {
  const userId = String(actor?.user_id || actor?.id || "");
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "");
  const tenantId = String(actor?.tenant_id || `tenant:${organizationId}`);
  if (!userId || !organizationId || tenantId !== `tenant:${organizationId}`) throw new Error("ORG_CONTEXT_REQUIRED");
  return { userId, organizationId, tenantId };
}

async function finalizedDelivery(actor: any, projectId: string) {
  const project = await projects.get(actor, projectId);
  const s = scope(actor);
  if (project.destination !== "STUDENT") return { project, delivery: null, evidence: [] };
  const delivery = (await query(
    `SELECT d.* FROM studio_delivery_records d
     WHERE d.project_id=$1 AND d.organization_id=$2 AND d.tenant_id=$3 AND d.status='FINALIZED'
     ORDER BY d.created_at DESC LIMIT 1`,
    [project.projectId, s.organizationId, s.tenantId],
  )).rows[0] || null;
  const currentWorkspaceRevision = Number((await query(
    `SELECT revision FROM studio_builder_workspaces
     WHERE project_id=$1 AND organization_id=$2 AND tenant_id=$3`,
    [project.projectId, s.organizationId, s.tenantId],
  )).rows[0]?.revision || 0);
  const evidence = delivery ? (await query(
    `SELECT evidence_id, status, evidence_rule_id, competency_id, provenance_json, created_at
     FROM prepare_prove_evidence
     WHERE organization_id=$1 AND tenant_id=$2 AND user_id=$3
       AND source_type='STUDIO_DELIVERY' AND source_record_id=$4 AND status <> 'SUPERSEDED'
     ORDER BY created_at ASC, evidence_id ASC`,
    [s.organizationId, s.tenantId, project.learnerId, delivery.delivery_record_id],
  )).rows : [];
  return { project, delivery, evidence, currentWorkspaceRevision };
}

export async function getStudioInstitutionalStatus(actor: any, projectId: string) {
  const found = await finalizedDelivery(actor, projectId);
  const packet = await projects.getBuildPacket(actor, projectId);
  let completion: any = null;
  if (found.project.assignmentId && packet.lineage?.unitKey && packet.lineage?.lessonKey) {
    completion = await evaluateAssignmentCompletion(actor, found.project.assignmentId, packet.lineage.unitKey, packet.lineage.lessonKey);
  }
  const verifiedOutcomes = found.evidence.length ? (await query(
    `SELECT d.decision_id, d.competency_id, c.title, d.reviewed_at
     FROM learner_competency_decisions d JOIN competency_definitions c ON c.competency_id=d.competency_id
     WHERE d.organization_id=$1 AND d.tenant_id=$2 AND d.user_id=$3 AND d.evidence_id = ANY($4::text[]) AND d.decision='DEMONSTRATED'
     ORDER BY d.reviewed_at ASC`,
    [found.project.organizationId, found.project.tenantId, found.project.learnerId, found.evidence.map((row: any) => row.evidence_id)],
  )).rows : [];
  const portfolioArtifacts = await portfolio.findArtifactsForEvidence(actor, found.evidence.map((row: any) => row.evidence_id));
  return {
    projectId: found.project.projectId,
    destination: found.project.destination,
    currentWorkspaceRevision: found.currentWorkspaceRevision,
    delivery: found.delivery ? { deliveryRecordId: found.delivery.delivery_record_id, workspaceRevision: Number(found.delivery.workspace_revision), status: found.delivery.status, isCurrent: Number(found.delivery.workspace_revision) === found.currentWorkspaceRevision } : null,
    evidence: found.evidence.map((row: any) => {
      const provenance = typeof row.provenance_json === "string" ? JSON.parse(row.provenance_json) : (row.provenance_json || {});
      const workspaceRevision = Number(provenance.workspace_revision || 0);
      const artifact = portfolioArtifacts.get(row.evidence_id);
      return { evidenceId: row.evidence_id, status: row.status, evidenceRuleId: row.evidence_rule_id, competencyId: row.competency_id, workspaceRevision, isCurrent: workspaceRevision > 0 && workspaceRevision === found.currentWorkspaceRevision, createdAt: row.created_at, portfolio: artifact ? { status: artifact.status, artifactId: artifact.artifactId, visibility: artifact.presentation.visibility } : { status: "AVAILABLE" } };
    }),
    whatYouProved: verifiedOutcomes.map((row: any) => ({ competencyId: row.competency_id, title: row.title, verifiedAt: row.reviewed_at })),
    portfolio: { available: Boolean(found.evidence.length), status: found.evidence.length ? (portfolioArtifacts.size ? "ADDED_OR_AVAILABLE" : "AVAILABLE") : "WAITING_FOR_EVIDENCE" },
    completion: completion ? { eligible: completion.eligible, reason: completion.reason, requirements: completion.requirements } : null,
  };
}

export async function projectStudioEvidence(actor: any, projectId: string) {
  const found = await finalizedDelivery(actor, projectId);
  if (found.project.destination !== "STUDENT") throw new Error("STUDENT_EVIDENCE_DESTINATION_REQUIRED");
  if (!found.delivery) throw new Error("STUDIO_DELIVERY_REQUIRED");
  const rules = await query(
    `SELECT evidence_rule_id FROM curriculum_evidence_rules
     WHERE organization_id=$1 AND source_type='STUDIO_DELIVERY' AND status='ACTIVE' AND evidence_type IS NOT NULL
     ORDER BY evidence_rule_id`,
    [found.project.organizationId],
  );
  const projected = [];
  for (const rule of rules.rows) {
    projected.push(await projectAuthoritativeFact(
      { user_id: found.project.learnerId, organization_id: found.project.organizationId },
      { sourceType: "STUDIO_DELIVERY", sourceRecordId: found.delivery.delivery_record_id, evidenceRuleId: rule.evidence_rule_id },
    ));
  }
  return { projectId: found.project.projectId, deliveryRecordId: found.delivery.delivery_record_id, projected, status: projected.length ? "REVIEWABLE" : "PENDING_INSTITUTIONAL_MAPPING" };
}
