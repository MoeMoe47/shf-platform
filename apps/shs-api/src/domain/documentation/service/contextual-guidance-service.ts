import { DgalService } from "./dgal-service.js";
import { safeActionReference, type DgalActor, type ResolvedRequirement } from "../model/dgal.js";

export const GUIDANCE_CATEGORIES = {
  REQUIRED_NOW: "REQUIRED_NOW",
  WAITING_ON_YOU: "WAITING_ON_YOU",
  WAITING_ON_SOMEONE_ELSE: "WAITING_ON_SOMEONE_ELSE",
  BLOCKED: "BLOCKED",
  REFERENCE: "REFERENCE",
  OPTIONAL: "OPTIONAL",
  COMPLETED: "COMPLETED",
} as const;

export type GuidanceCategory = typeof GUIDANCE_CATEGORIES[keyof typeof GUIDANCE_CATEGORIES];
export type GuidanceTarget = { route: string; resourceType?: string; resourceId?: string; action?: string };
export type GuidanceSource = {
  sourceId: string;
  sourceDomain: string;
  title: string;
  explanation: string;
  category: GuidanceCategory;
  required?: boolean;
  priority?: number;
  status?: string;
  actorResponsibility?: string;
  waitingOn?: string | null;
  completionSource?: string | null;
  requirementId?: string | null;
  actionTarget?: GuidanceTarget | null;
  returnTarget?: GuidanceTarget | null;
  canonicalKey?: string;
  available?: boolean;
  unavailableReason?: string;
  tour?: { tourId: string; stepId?: string; stepIndex?: number } | null;
};

export type ContextualGuidanceContext = {
  serviceKey?: string;
  workflowType?: string;
  workflowStage?: string;
  resourceType?: string;
  resourceId?: string;
  returnTarget?: GuidanceTarget | null;
};

export type ComposedGuidanceItem = GuidanceSource & {
  guidanceId: string;
  required: boolean;
  sourceReferences: string[];
  requirementReferences: string[];
  actionTarget: GuidanceTarget | null;
  returnTarget: GuidanceTarget | null;
};

export type GuidanceComposition = {
  status: "RESOLVED" | "NO_ACTIONS" | "UNKNOWN" | "SOURCE_UNAVAILABLE" | "CONFLICT";
  items: ComposedGuidanceItem[];
  context: Record<string, unknown>;
  unavailableSources: string[];
  unresolved: string[];
};

const CATEGORY_ORDER: Record<GuidanceCategory, number> = {
  REQUIRED_NOW: 0,
  WAITING_ON_YOU: 1,
  BLOCKED: 2,
  WAITING_ON_SOMEONE_ELSE: 3,
  OPTIONAL: 4,
  REFERENCE: 5,
  COMPLETED: 6,
};

function targetKey(target: GuidanceTarget | null | undefined) {
  if (!target) return "";
  return `${target.route}|${target.resourceType || ""}|${target.resourceId || ""}|${target.action || ""}`;
}

function safeTarget(target: GuidanceTarget | null | undefined) {
  if (!target) return null;
  const route = safeActionReference(target.route);
  if (!route || !route.startsWith("/")) throw new Error("unsafe_guidance_target");
  return {
    route,
    resourceType: target.resourceType || undefined,
    resourceId: target.resourceId || undefined,
    action: target.action || undefined,
  };
}

function requirementGuidance(requirement: ResolvedRequirement): GuidanceSource {
  return {
    sourceId: `dgal:${requirement.requirementId}`,
    sourceDomain: requirement.sourceDomain,
    title: requirement.title,
    explanation: requirement.explanation,
    category: requirement.required ? GUIDANCE_CATEGORIES.REQUIRED_NOW : GUIDANCE_CATEGORIES.OPTIONAL,
    required: requirement.required,
    priority: requirement.priority,
    status: "OPEN",
    actorResponsibility: requirement.required ? "YOU" : "REFERENCE",
    waitingOn: requirement.required ? "YOU" : null,
    requirementId: requirement.requirementId,
    actionTarget: requirement.actionReference ? { route: requirement.actionReference } : null,
    canonicalKey: requirement.templateId || requirement.documentTypeId || requirement.guidanceItemId || requirement.ruleKey,
  };
}

export class ContextualGuidanceService {
  constructor(private readonly dgal = new DgalService()) {}

  async compose(actor: DgalActor, context: ContextualGuidanceContext = {}, sources: GuidanceSource[] = []): Promise<GuidanceComposition> {
    const requirementResult = await this.dgal.resolveDocumentationRequirements(actor, context);
    const baseContext = {
      organizationId: actor.active_organization_id || actor.organization_id,
      tenantId: actor.tenant_id,
      serviceKey: context.serviceKey || null,
      workflowType: context.workflowType || null,
      workflowStage: context.workflowStage || null,
      resourceType: context.resourceType || null,
      resourceId: context.resourceId || null,
    };
    if (requirementResult.status === "UNKNOWN") {
      return { status: "UNKNOWN", items: [], context: baseContext, unavailableSources: [], unresolved: requirementResult.unresolved };
    }

    const unavailableSources = sources.filter((source) => source.available === false).map((source) => source.sourceDomain);
    const unresolved = sources.filter((source) => source.available === false).map((source) => source.unavailableReason || `${source.sourceDomain}:unavailable`);
    const requirementSources = requirementResult.status === "RESOLVED" ? requirementResult.requirements.map(requirementGuidance) : [];
    const candidates = [...requirementSources, ...sources.filter((source) => source.available !== false)];
    const selected = new Map<string, ComposedGuidanceItem>();

    for (const candidate of candidates) {
      const key = candidate.canonicalKey || targetKey(candidate.actionTarget) || candidate.sourceId;
      const item: ComposedGuidanceItem = {
        ...candidate,
        guidanceId: candidate.sourceId,
        required: Boolean(candidate.required),
        sourceReferences: [candidate.sourceId],
        requirementReferences: candidate.requirementId ? [candidate.requirementId] : [],
        actionTarget: safeTarget(candidate.actionTarget),
        returnTarget: safeTarget(candidate.returnTarget || context.returnTarget),
      };
      const existing = selected.get(key);
      if (!existing) { selected.set(key, item); continue; }
      if (existing.required !== item.required && (existing.priority || 100) === (item.priority || 100)) {
        return { status: "CONFLICT", items: [], context: baseContext, unavailableSources, unresolved: [`guidance_conflict:${key}`] };
      }
      existing.sourceReferences.push(...item.sourceReferences);
      existing.requirementReferences.push(...item.requirementReferences);
      existing.explanation = existing.explanation || item.explanation;
      if ((item.priority || 100) < (existing.priority || 100)) {
        selected.set(key, { ...item, sourceReferences: existing.sourceReferences, requirementReferences: existing.requirementReferences });
      }
    }

    const items = [...selected.values()].sort((a, b) => (CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category]) || ((a.priority || 100) - (b.priority || 100)) || a.guidanceId.localeCompare(b.guidanceId));
    if (unavailableSources.length && !items.length) return { status: "SOURCE_UNAVAILABLE", items: [], context: baseContext, unavailableSources, unresolved };
    if (!items.length) return { status: "NO_ACTIONS", items: [], context: baseContext, unavailableSources, unresolved };
    return { status: unavailableSources.length ? "RESOLVED" : "RESOLVED", items, context: baseContext, unavailableSources, unresolved };
  }

  unavailable(context: ContextualGuidanceContext = {}, source = "guidance") {
    return { status: "SOURCE_UNAVAILABLE", items: [], context, unavailableSources: [source], unresolved: [`${source}:unavailable`] } satisfies GuidanceComposition;
  }
}

export function civicSureProviderSources(workspace: any): GuidanceSource[] {
  const route = "/index.html#/civicsure/provider";
  const sources: GuidanceSource[] = [];
  for (const request of workspace?.items?.evidenceRequests || []) {
    const submitted = ["SUBMITTED", "UNDER_REVIEW", "ACCEPTED", "VERIFIED"].includes(String(request.status).toUpperCase());
    sources.push({
      sourceId: `civicsure:evidence-request:${request.evidence_request_id}`,
      sourceDomain: "CIVICSURE",
      title: submitted ? "Evidence submitted for review" : `Submit ${request.evidence_type || "required evidence"}`,
      explanation: submitted ? "Your provider submission is waiting for authorized review." : (request.requirement_reference || "CivicSure assigned evidence is required for this provider workflow."),
      category: submitted ? GUIDANCE_CATEGORIES.WAITING_ON_SOMEONE_ELSE : GUIDANCE_CATEGORIES.REQUIRED_NOW,
      required: true,
      priority: submitted ? 30 : 10,
      status: request.status,
      actorResponsibility: submitted ? "REVIEWER" : "YOU",
      waitingOn: submitted ? "OPERATOR" : "YOU",
      completionSource: submitted ? `CIVICSURE_EVIDENCE_REQUEST:${request.evidence_request_id}` : null,
      actionTarget: { route, resourceType: "CIVICSURE_EVIDENCE_REQUEST", resourceId: request.evidence_request_id, action: "OPEN" },
      returnTarget: { route, resourceType: "CIVICSURE_EVIDENCE_REQUEST", resourceId: request.evidence_request_id, action: "OPEN" },
      canonicalKey: `civicsure:evidence:${request.evidence_request_id}`,
    });
  }
  for (const finding of workspace?.items?.findings || []) {
    const responded = String(finding.provider_response_state || "").toUpperCase() === "SUBMITTED";
    sources.push({
      sourceId: `civicsure:finding:${finding.finding_id}`,
      sourceDomain: "CIVICSURE",
      title: responded ? "Finding response is under review" : "Respond to CivicSure finding",
      explanation: responded ? "Your provider response is waiting for authorized review." : (finding.description || "A provider response is required."),
      category: responded ? GUIDANCE_CATEGORIES.WAITING_ON_SOMEONE_ELSE : GUIDANCE_CATEGORIES.REQUIRED_NOW,
      required: true,
      priority: responded ? 35 : 12,
      status: finding.status,
      actorResponsibility: responded ? "REVIEWER" : "YOU",
      waitingOn: responded ? "OPERATOR" : "YOU",
      completionSource: responded ? `CIVICSURE_FINDING_RESPONSE:${finding.finding_id}` : null,
      actionTarget: { route, resourceType: "CIVICSURE_FINDING", resourceId: finding.finding_id, action: "RESPOND" },
      returnTarget: { route, resourceType: "CIVICSURE_FINDING", resourceId: finding.finding_id, action: "RESPOND" },
      canonicalKey: `civicsure:finding:${finding.finding_id}`,
    });
  }
  for (const action of workspace?.items?.correctiveActions || []) {
    const submitted = ["EVIDENCE_SUBMITTED", "UNDER_REVIEW", "COMPLETE", "CLOSED"].includes(String(action.status).toUpperCase());
    sources.push({
      sourceId: `civicsure:corrective-action:${action.corrective_action_id}`,
      sourceDomain: "CIVICSURE",
      title: submitted ? "Corrective-action response is under review" : "Complete corrective-action response",
      explanation: submitted ? "Your corrective-action response is waiting for authorized review." : (action.required_action || "A provider corrective-action response is required."),
      category: submitted ? GUIDANCE_CATEGORIES.WAITING_ON_SOMEONE_ELSE : GUIDANCE_CATEGORIES.REQUIRED_NOW,
      required: true,
      priority: submitted ? 40 : 14,
      status: action.status,
      actorResponsibility: submitted ? "REVIEWER" : "YOU",
      waitingOn: submitted ? "OPERATOR" : "YOU",
      completionSource: submitted ? `CIVICSURE_CORRECTIVE_ACTION:${action.corrective_action_id}` : null,
      actionTarget: { route, resourceType: "CIVICSURE_CORRECTIVE_ACTION", resourceId: action.corrective_action_id, action: "RESPOND" },
      returnTarget: { route, resourceType: "CIVICSURE_CORRECTIVE_ACTION", resourceId: action.corrective_action_id, action: "RESPOND" },
      canonicalKey: `civicsure:corrective-action:${action.corrective_action_id}`,
    });
  }
  return sources;
}

/** Translate DGAL-4 durable states into presentation facts; it does not
 * acknowledge, verify, or otherwise mutate institutional state. */
export function agreementWorkflowSources(state: { acknowledgment?: any; manualSignature?: any; route?: string } = {}): GuidanceSource[] {
  const route = state.route || "/documentation/agreements";
  const sources: GuidanceSource[] = [];
  const acknowledgment = state.acknowledgment;
  if (acknowledgment) {
    const status = String(acknowledgment.status || "").toUpperCase();
    const acknowledged = status === "ACKNOWLEDGED";
    sources.push({
      sourceId: `dgal:acknowledgment:${acknowledgment.acknowledgment_id || acknowledgment.acknowledgmentId}`,
      sourceDomain: acknowledgment.owning_domain || "DGAL",
      title: acknowledged ? "Acknowledgment recorded" : "Review and acknowledge the required item",
      explanation: acknowledged ? "Your explicit acknowledgment is recorded for the exact document or agreement version." : "Review the exact version, then use the explicit acknowledgment action.",
      category: acknowledged ? GUIDANCE_CATEGORIES.COMPLETED : GUIDANCE_CATEGORIES.REQUIRED_NOW,
      required: true,
      priority: acknowledged ? 90 : 10,
      status,
      actorResponsibility: acknowledged ? "COMPLETED" : "YOU",
      waitingOn: acknowledged ? null : "YOU",
      completionSource: acknowledged ? `ACKNOWLEDGMENT:${acknowledgment.acknowledgment_id || acknowledgment.acknowledgmentId}` : null,
      actionTarget: acknowledged ? null : { route, resourceType: "ACKNOWLEDGMENT", resourceId: acknowledgment.acknowledgment_id || acknowledgment.acknowledgmentId, action: "REVIEW" },
      canonicalKey: `acknowledgment:${acknowledgment.document_instance_id || acknowledgment.agreement_reference || acknowledgment.acknowledgment_id}`,
    });
  }
  const manual = state.manualSignature;
  if (manual) {
    const status = String(manual.verification_status || manual.verificationStatus || "").toUpperCase();
    const verified = status === "VERIFIED";
    const rejected = status === "REJECTED";
    sources.push({
      sourceId: `dgal:manual-signature:${manual.manual_signature_id || manual.manualSignatureId}`,
      sourceDomain: manual.owning_domain || "DGAL",
      title: verified ? "Manual signature verified" : rejected ? "Manual signature needs correction" : status === "UPLOADED" ? "Manual signature awaiting verification" : "Print, sign, and upload the required document",
      explanation: verified ? "The uploaded paper artifact was verified by an authorized reviewer." : rejected ? "The uploaded artifact was not accepted; review the correction reason and submit a new copy." : status === "UPLOADED" ? "An authorized reviewer must verify the uploaded paper artifact." : "Print the exact document version, sign it physically, and upload the returned copy.",
      category: verified ? GUIDANCE_CATEGORIES.COMPLETED : rejected ? GUIDANCE_CATEGORIES.BLOCKED : status === "UPLOADED" ? GUIDANCE_CATEGORIES.WAITING_ON_SOMEONE_ELSE : GUIDANCE_CATEGORIES.REQUIRED_NOW,
      required: true,
      priority: verified ? 91 : 11,
      status,
      actorResponsibility: verified ? "COMPLETED" : status === "UPLOADED" ? "REVIEWER" : "YOU",
      waitingOn: verified ? null : status === "UPLOADED" ? "AUTHORIZED_VERIFIER" : "YOU",
      completionSource: verified ? `MANUAL_SIGNATURE:${manual.manual_signature_id || manual.manualSignatureId}` : null,
      actionTarget: verified ? null : { route, resourceType: "MANUAL_SIGNATURE", resourceId: manual.manual_signature_id || manual.manualSignatureId, action: status === "UPLOADED" ? "VIEW_STATUS" : "PRINT_UPLOAD" },
      canonicalKey: `manual-signature:${manual.document_instance_id || manual.manual_signature_id}`,
    });
  }
  return sources;
}

/** Electronic-signature state is presentation data only. Provider callbacks
 * never become workflow completion, Evidence acceptance, or Truth. */
export function electronicSignatureWorkflowSources(state: { signature?: any; route?: string } = {}): GuidanceSource[] {
  const signature = state.signature;
  if (!signature) return [];
  const status = String(signature.status || "").toUpperCase();
  const route = state.route || "/documentation/signatures";
  const id = signature.signature_request_id || signature.signatureRequestId;
  const labels: Record<string, { title: string; explanation: string; category: string; owner: string; waitingOn: string | null }> = {
    DRAFT: { title: "Signature request is being prepared", explanation: "The authorized workflow has not sent this request yet.", category: GUIDANCE_CATEGORIES.BLOCKED, owner: "OPERATOR", waitingOn: "AUTHORIZED_REQUESTER" },
    SENT: { title: "Signature required", explanation: "The exact document version is ready for the intended signer.", category: GUIDANCE_CATEGORIES.REQUIRED_NOW, owner: "YOU", waitingOn: "YOU" },
    VIEWED: { title: "Signature in progress", explanation: "The intended signer opened the exact document and must finish the signing step.", category: GUIDANCE_CATEGORIES.WAITING_ON_SOMEONE_ELSE, owner: "SIGNER", waitingOn: "SIGNER" },
    SIGNED: { title: "Electronic signature recorded", explanation: "The provider reported completion for the exact document version; the owning workflow still decides what happens next.", category: GUIDANCE_CATEGORIES.COMPLETED, owner: "COMPLETED", waitingOn: null },
    DECLINED: { title: "Signature declined", explanation: "The signer declined this request; an authorized workflow owner must determine the next step.", category: GUIDANCE_CATEGORIES.BLOCKED, owner: "OPERATOR", waitingOn: "AUTHORIZED_REQUESTER" },
    VOIDED: { title: "Signature request voided", explanation: "This request is no longer active. A new request requires authorized workflow action.", category: GUIDANCE_CATEGORIES.BLOCKED, owner: "OPERATOR", waitingOn: "AUTHORIZED_REQUESTER" },
    EXPIRED: { title: "Signature request expired", explanation: "The provider request expired. An authorized workflow owner must decide whether to issue a new request.", category: GUIDANCE_CATEGORIES.BLOCKED, owner: "OPERATOR", waitingOn: "AUTHORIZED_REQUESTER" },
    FAILED: { title: "Signature provider unavailable", explanation: "The signature request did not complete. Retry or reconciliation requires authorized action.", category: GUIDANCE_CATEGORIES.BLOCKED, owner: "OPERATOR", waitingOn: "AUTHORIZED_REQUESTER" },
  };
  const label = labels[status] || labels.FAILED;
  return [{
    sourceId: `dgal:signature:${id}`,
    sourceDomain: signature.owning_domain || "DGAL",
    title: label.title,
    explanation: label.explanation,
    category: label.category as any,
    required: ["SENT", "VIEWED"].includes(status),
    priority: status === "SIGNED" ? 92 : 9,
    status,
    actorResponsibility: label.owner,
    waitingOn: label.waitingOn,
    completionSource: status === "SIGNED" ? `ELECTRONIC_SIGNATURE:${id}` : null,
    actionTarget: status === "SIGNED" ? null : { route, resourceType: "SIGNATURE_REQUEST", resourceId: id, action: status === "SENT" || status === "VIEWED" ? "OPEN_SESSION" : "REVIEW_STATUS" },
    canonicalKey: `electronic-signature:${signature.document_instance_id || id}`,
  }];
}
