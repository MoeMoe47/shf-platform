import { randomUUID } from "node:crypto";
import { withTransaction } from "../../../db/transaction.js";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { IntegrationOutboxRepo } from "../../trusted-reporting/outbox-repo.js";
import { AiGovernanceService } from "../../ai-governance/service/ai-governance-service.js";
import { InputSecurityRepo, type Executor } from "../repo/input-security-repo.js";
import { DeterministicInputSecurityScanner } from "../scanner/input-security-scanner.js";
import {
  CONTEXT_ADMISSION_CODES,
  toAdmissionResponse,
  toFindingResponse,
  toScanResponse,
} from "../model/input-security.js";

type Actor = { user_id?: string; id?: string; active_organization_id?: string; organization_id?: string; tenant_id?: string; permissions?: string[] };

function actorScope(actor: Actor) {
  const userId = String(actor.user_id || actor.id || "");
  const organizationId = String(actor.active_organization_id || actor.organization_id || "");
  const tenantId = String(actor.tenant_id || `tenant:${organizationId}`);
  if (!userId || !organizationId || tenantId !== `tenant:${organizationId}`) throw new Error("ORG_CONTEXT_REQUIRED");
  return { userId, organizationId, tenantId };
}

function requireActorPermission(actor: Actor, permission: string) {
  if (!hasPermission(actor.permissions || [], permission)) throw new InputSecurityError("AI_SECURITY_PERMISSION_REQUIRED", "AI security permission is required.", 403);
}

export class InputSecurityError extends Error {
  constructor(public code: string, message = code, public statusCode = 400) {
    super(message);
  }
}

export class InputSecurityService {
  constructor(
    private repo = new InputSecurityRepo(),
    private transaction: typeof withTransaction = withTransaction,
    private outbox = new IntegrationOutboxRepo(),
    private aiGovernance = new AiGovernanceService(),
    private scanner = new DeterministicInputSecurityScanner(),
  ) {}

  private async emit(executor: Executor | null, type: string, subjectType: string, subjectId: string, scope: any, payload: Record<string, unknown> = {}) {
    const event = {
      producer_id: "shs-api.input-security",
      event_type: type,
      subject_type: subjectType,
      subject_id: subjectId,
      organization_id: scope.organizationId,
      tenant_id: scope.tenantId,
      originating_actor_id: scope.userId,
      originating_actor_type: "user",
      occurred_at: new Date().toISOString(),
      idempotency_key: `${type}:${subjectId}`,
      correlation_id: `input-security:${subjectId}`,
      destination: "shs-security",
      payload,
    };
    if (executor) await this.outbox.enqueue(event, executor);
    else await this.outbox.enqueue(event);
  }

  private resourceFromBody(body: any, scope: any) {
    const resourceType = String(body.resourceType || body.resource_type || body.resource?.resourceType || body.resource?.resource_type || "").trim();
    const resourceId = String(body.resourceId || body.resource_id || body.resource?.resourceId || body.resource?.resource_id || "").trim();
    const organizationId = String(body.organizationId || body.organization_id || body.resource?.organizationId || body.resource?.organization_id || scope.organizationId).trim();
    const tenantId = String(body.tenantId || body.tenant_id || body.resource?.tenantId || body.resource?.tenant_id || scope.tenantId).trim();
    if (!resourceType || !resourceId) throw new InputSecurityError("RESOURCE_REQUIRED", "Resource reference is required.");
    if (organizationId !== scope.organizationId) throw new InputSecurityError("ORGANIZATION_MISMATCH", "Organization mismatch.", 403);
    if (tenantId !== scope.tenantId || tenantId !== `tenant:${organizationId}`) throw new InputSecurityError("TENANT_MISMATCH", "Tenant mismatch.", 403);
    return { organization_id: organizationId, tenant_id: tenantId, resource_type: resourceType, resource_id: resourceId };
  }

  async scanInput(actor: Actor, body: any) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_SECURITY_SCAN);
    const scope = actorScope(actor);
    const resource = this.resourceFromBody(body, scope);
    const content = String(body.content || "");
    if (!content.trim()) throw new InputSecurityError("CONTENT_REQUIRED", "Content is required for input security scan.");
    const sourceKind = String(body.sourceKind || body.source_kind || "USER_PROMPT").trim();
    const sourceRef = String(body.sourceRef || body.source_ref || "").trim() || null;
    const contentType = String(body.contentType || body.content_type || "text/plain").trim();
    const scan = await this.scanner.scan({ content });
    return this.transaction(async (db: Executor) => {
      const scanRow = await this.repo.createScan({
        scan_id: `input_scan_${randomUUID()}`,
        organization_id: scope.organizationId,
        tenant_id: scope.tenantId,
        resource_type: resource.resource_type,
        resource_id: resource.resource_id,
        source_kind: sourceKind,
        source_ref: sourceRef,
        content_type: contentType,
        content_sha256: scan.contentSha256,
        scanner_provider: scan.scannerProvider,
        scanner_version: scan.scannerVersion,
        scan_status: scan.scanStatus,
        risk_level: scan.riskLevel,
        finding_count: scan.findings.length,
        decision: scan.decision,
        review_required: scan.reviewRequired,
        submitted_by: scope.userId,
        metadata_json: { deterministicOnly: true, semanticScanner: "UNAVAILABLE" },
      }, db);
      const findings = [];
      for (const finding of scan.findings) {
        const findingRow = await this.repo.createFinding({
          finding_id: `input_finding_${randomUUID()}`,
          scan_id: scanRow.scan_id,
          organization_id: scope.organizationId,
          tenant_id: scope.tenantId,
          resource_type: resource.resource_type,
          resource_id: resource.resource_id,
          category: finding.category,
          severity: finding.severity,
          confidence: finding.confidence,
          decision_code: finding.decisionCode,
          excerpt: finding.excerpt,
          start_offset: finding.startOffset,
          end_offset: finding.endOffset,
        }, db);
        findings.push(findingRow);
        await this.emit(db, "input_security.finding_detected", "ai_input_security_finding", findingRow.finding_id, scope, { category: finding.category, severity: finding.severity });
      }
      const eventType = scan.decision === "BLOCK" ? "input_security.blocked" : scan.decision === "QUARANTINE" ? "input_security.quarantined" : scan.decision === "REQUIRE_REVIEW" ? "input_security.review_required" : "input_security.scan_completed";
      await this.emit(db, eventType, "ai_input_security_scan", scanRow.scan_id, scope, { decision: scan.decision, risk_level: scan.riskLevel });
      return toScanResponse(scanRow, findings);
    });
  }

  async getScan(actor: Actor, scanId: string) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_SECURITY_READ);
    const scope = actorScope(actor);
    const scan = await this.repo.getScan(scanId, scope.organizationId, scope.tenantId);
    if (!scan) throw new InputSecurityError("SCAN_NOT_FOUND", "Scan not found.", 404);
    const findings = await this.repo.listFindings({ organization_id: scope.organizationId, tenant_id: scope.tenantId, scan_id: scanId });
    return toScanResponse(scan, findings);
  }

  async listFindings(actor: Actor, scanId?: string) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_SECURITY_READ);
    const scope = actorScope(actor);
    const rows = await this.repo.listFindings({ organization_id: scope.organizationId, tenant_id: scope.tenantId, scan_id: scanId || null });
    return rows.map(toFindingResponse);
  }

  async reviewScan(actor: Actor, scanId: string, body: any) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_SECURITY_REVIEW);
    const scope = actorScope(actor);
    const scan = await this.repo.getScan(scanId, scope.organizationId, scope.tenantId);
    if (!scan) throw new InputSecurityError("SCAN_NOT_FOUND", "Scan not found.", 404);
    if (scan.submitted_by === scope.userId && scan.review_required) throw new InputSecurityError("SELF_REVIEW_DENIED", "Submitter cannot self-approve security findings.", 403);
    const decision = String(body.decision || "").trim().toUpperCase();
    if (!["APPROVE_ADMISSION", "REJECT", "QUARANTINE", "REQUEST_REMEDIATION"].includes(decision)) throw new InputSecurityError("REVIEW_DECISION_INVALID", "Review decision is invalid.");
    const row = await this.repo.createReview({
      review_id: `input_review_${randomUUID()}`,
      scan_id: scanId,
      organization_id: scope.organizationId,
      tenant_id: scope.tenantId,
      decision,
      rationale: body.rationale || null,
      reviewed_by: scope.userId,
    });
    await this.emit(null, "input_security.review_completed", "ai_input_security_review", row.review_id, scope, { scan_id: scanId, decision });
    return row;
  }

  async evaluateContextAdmission(actor: Actor, body: any) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_CONTEXT_EVALUATE);
    const scope = actorScope(actor);
    const resource = this.resourceFromBody(body, scope);
    const intendedUse = String(body.intendedUse || body.intended_use || "").trim();
    if (!intendedUse) throw new InputSecurityError("INTENDED_USE_REQUIRED", "Intended use is required.");
    const scan = body.scanId || body.scan_id
      ? await this.repo.getScan(String(body.scanId || body.scan_id), scope.organizationId, scope.tenantId)
      : await this.repo.getLatestScan(resource);
    const findings = scan ? await this.repo.listFindings({ organization_id: scope.organizationId, tenant_id: scope.tenantId, scan_id: scan.scan_id }) : [];
    const classification = await this.aiGovernance.getClassification(actor, resource.resource_type, resource.resource_id).catch(() => ({ classification: "INTERNAL" }));
    const model = body.model || {};
    let decision: "ALLOW" | "ALLOW_WITH_WARNING" | "REQUIRE_REVIEW" | "QUARANTINE" | "BLOCK" = "ALLOW";
    let code: string = CONTEXT_ADMISSION_CODES.CONTEXT_ADMISSION_ALLOWED;
    let admitted = true;
    const warnings: string[] = [];

    if (!scan) {
      decision = "REQUIRE_REVIEW"; code = CONTEXT_ADMISSION_CODES.INPUT_NOT_SCANNED; admitted = false;
    } else if (scan.scan_status === "SCANNER_UNAVAILABLE") {
      decision = "REQUIRE_REVIEW"; code = CONTEXT_ADMISSION_CODES.SECURITY_SCANNER_UNAVAILABLE; admitted = false;
    } else if (scan.scan_status === "BLOCKED" || scan.decision === "BLOCK") {
      decision = "BLOCK"; code = findings[0]?.decision_code || CONTEXT_ADMISSION_CODES.CONTEXT_ADMISSION_DENIED; admitted = false;
    } else if (scan.scan_status === "QUARANTINED" || scan.decision === "QUARANTINE") {
      decision = "QUARANTINE"; code = CONTEXT_ADMISSION_CODES.CONTENT_QUARANTINED; admitted = false;
    } else if (scan.scan_status === "REVIEW_REQUIRED" || scan.decision === "REQUIRE_REVIEW" || scan.review_required) {
      const review = await this.repo.getLatestReview(scan.scan_id, scope.organizationId, scope.tenantId);
      if (!review || review.decision !== "APPROVE_ADMISSION") {
        decision = "REQUIRE_REVIEW"; code = CONTEXT_ADMISSION_CODES.SECURITY_REVIEW_REQUIRED; admitted = false;
      } else {
        decision = "ALLOW_WITH_WARNING"; warnings.push(CONTEXT_ADMISSION_CODES.SECURITY_REVIEW_REQUIRED);
      }
    } else if (scan.scan_status !== "CLEAR") {
      decision = "REQUIRE_REVIEW"; code = CONTEXT_ADMISSION_CODES.CONTEXT_ADMISSION_DENIED; admitted = false;
    }

    const resourceClass = String((classification as any).classification || "INTERNAL");
    if (admitted && resourceClass === "RESTRICTED") {
      decision = "BLOCK"; code = CONTEXT_ADMISSION_CODES.RESOURCE_CLASSIFICATION_DENIED; admitted = false;
    }
    if (admitted && ["SENSITIVE", "RESTRICTED"].includes(resourceClass)) {
      const modelDecision = await this.aiGovernance.validateModel({
        ...model,
        organizationId: scope.organizationId,
        tenantId: scope.tenantId,
      }, resourceClass as any);
      if (!modelDecision.allowed) {
        decision = "BLOCK";
        code = CONTEXT_ADMISSION_CODES.MODEL_NOT_ALLOWED_FOR_RESOURCE;
        admitted = false;
      }
    }

    if (admitted && (body.delegationId || body.delegation_id || body.sessionId || body.session_id)) {
      const authority = await this.aiGovernance.evaluateAgentAuthority({
        principalUserId: scope.userId,
        organizationId: scope.organizationId,
        tenantId: scope.tenantId,
        delegationId: body.delegationId || body.delegation_id,
        sessionId: body.sessionId || body.session_id,
        agentIdentifier: body.agentIdentifier || body.agent_identifier,
        purpose: body.purpose || intendedUse,
        resource: { resourceType: resource.resource_type, resourceId: resource.resource_id },
        action: body.action || "ai.context.admit",
        model,
      });
      if (!authority.allowed) {
        decision = "BLOCK";
        code = CONTEXT_ADMISSION_CODES.CONTEXT_ADMISSION_DENIED;
        admitted = false;
      }
    }

    const row = await this.repo.createAdmissionDecision({
      admission_id: `context_admission_${randomUUID()}`,
      organization_id: scope.organizationId,
      tenant_id: scope.tenantId,
      scan_id: scan?.scan_id || null,
      session_id: body.sessionId || body.session_id || null,
      delegation_id: body.delegationId || body.delegation_id || null,
      resource_type: resource.resource_type,
      resource_id: resource.resource_id,
      resource_classification: resourceClass,
      intended_use: intendedUse,
      model_provider: model.providerIdentifier || model.provider_identifier || model.provider || null,
      model_identifier: model.modelIdentifier || model.model_identifier || model.model || null,
      admitted,
      decision,
      decision_code: code,
      warning_codes: warnings,
      security_finding_ids: findings.map((item: any) => item.finding_id),
      evaluated_by: scope.userId,
    });
    await this.emit(null, admitted ? "context_admission.allowed" : "context_admission.denied", "ai_context_admission_decision", row.admission_id, scope, { decision, decision_code: code });
    return toAdmissionResponse(row);
  }
}
