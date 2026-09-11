import crypto from "node:crypto";

export type TrustedReportingOutboxEvent = {
  producer_id: string;
  event_type: string;
  schema_version?: string;
  subject_type: string;
  subject_id: string;
  organization_id: string;
  originating_actor_id: string;
  originating_actor_type: string;
  tenant_id: string;
  occurred_at: string;
  idempotency_key: string;
  correlation_id: string;
  payload: Record<string, unknown>;
  evidence_references?: string[];
  destination: string;
};

export type ReferralOutboxEvent = TrustedReportingOutboxEvent;

export function buildGovernmentAssuranceTruthDeterminationOutboxEvent(determination: any, handoff: any, correlationId: string): TrustedReportingOutboxEvent {
  const determinationId = String(determination?.determination_id || determination?.determinationId || "").trim();
  const truthFactId = String(determination?.truth_fact_id || determination?.truthFactId || "").trim();
  const organizationId = String(determination?.organization_id || "").trim();
  const actorId = String(determination?.determining_actor || determination?.determined_by || "").trim();
  const tenantId = String(determination?.tenant_id || `tenant:${organizationId}`).trim();
  const claimReference = String(determination?.claim_reference || determination?.claimReference || "").trim();
  const verificationReference = String(determination?.verification_reference || determination?.verificationReference || "").trim();
  const provenanceReference = String(handoff?.provenanceReference || "").trim();
  const occurredAt = determination?.created_at instanceof Date ? determination.created_at.toISOString() : String(determination?.created_at || new Date().toISOString());
  if (!determinationId || !truthFactId || !organizationId || !actorId || !tenantId || !claimReference || !verificationReference || !provenanceReference) throw new Error("government_assurance_truth_determination_outbox_scope_missing");
  if (tenantId !== `tenant:${organizationId}`) throw new Error("government_assurance_truth_determination_outbox_scope_invalid");
  if (determination?.decision !== "ACCEPTED" || handoff?.status !== "PENDING_TRUTH_SPINE_INGESTION") throw new Error("government_assurance_truth_determination_outbox_not_accepted");
  return {
    producer_id: "shs.government_assurance",
    event_type: "government_assurance.truth_determination.accepted",
    schema_version: "v1",
    subject_type: "gpa_truth_determination",
    subject_id: determinationId,
    organization_id: organizationId,
    originating_actor_id: actorId,
    originating_actor_type: "user",
    tenant_id: tenantId,
    occurred_at: occurredAt,
    idempotency_key: `gpa-truth-determination:${determinationId}:accepted`,
    correlation_id: String(correlationId || determination?.correlation_id || determinationId).trim(),
    evidence_references: Array.isArray(determination?.evidence_references)
      ? determination.evidence_references.map((reference: unknown) => String(reference).trim()).filter(Boolean)
      : [],
    payload: {
      determination_id: determinationId,
      truth_fact_id: truthFactId,
      claim_reference: claimReference,
      verification_reference: verificationReference,
      provenance_reference: provenanceReference,
      truth_spine_authority: String(handoff?.authority || "shs-truth-spine-v1"),
      truth_spine_status: String(handoff.status),
      lifecycle_status: "accepted",
    },
    destination: "agent-fabric",
  };
}

export function buildEmploymentStartedVerifiedOutboxEvent(outcome: any, correlationId: string): TrustedReportingOutboxEvent {
  const outcomeId = String(outcome?.outcome_id || outcome?.outcomeId || "").trim();
  const organizationId = String(outcome?.organization_id || "").trim();
  const actorId = String(outcome?.verified_by_user_id || outcome?.verifiedBy || outcome?.created_by_user_id || outcome?.createdBy || "").trim();
  const tenantId = String(outcome?.tenant_id || "").trim();
  const occurredAt = outcome?.employment_started_at instanceof Date
    ? outcome.employment_started_at.toISOString()
    : String(outcome?.employment_started_at || "");
  if (!outcomeId || !organizationId || !actorId || !tenantId || !occurredAt) throw new Error("employment_started_verified_outbox_scope_missing");
  return {
    producer_id: "shf.workforce",
    event_type: "employment_started.verified",
    schema_version: "v1",
    subject_type: "workforce_employment_outcome",
    subject_id: outcomeId,
    organization_id: organizationId,
    originating_actor_id: actorId,
    originating_actor_type: "user",
    tenant_id: tenantId,
    occurred_at: occurredAt,
    idempotency_key: `workforce-employment-outcome:${outcomeId}:verified`,
    correlation_id: String(correlationId || "").trim(),
    payload: {
      outcome_id: outcomeId,
      participant_ref: String(outcome?.participant_ref || "").trim(),
      ...(outcome?.program_id ? { program_id: String(outcome.program_id).trim() } : {}),
      outcome_type: "EMPLOYMENT_STARTED",
      employment_started_at: occurredAt,
      verification_source_type: String(outcome?.verification_source_type || "").trim(),
      lifecycle_status: "verified",
      version: Number(outcome?.version),
    },
    destination: "agent-fabric",
  };
}

export function buildFundingCommitmentCommittedOutboxEvent(committed: any, correlationId: string): TrustedReportingOutboxEvent {
  const commitmentId = String(committed?.commitment_id || committed?.commitmentId || "").trim();
  const organizationId = String(committed?.organization_id || "").trim();
  const actorId = String(committed?.committed_by_user_id || committed?.committedBy || committed?.created_by_user_id || committed?.createdBy || "").trim();
  const tenantId = String(committed?.tenant_id || "").trim();
  if (!commitmentId || !organizationId || !actorId || !tenantId) throw new Error("funding_commitment_committed_outbox_scope_missing");
  const occurredAt = committed?.committed_at instanceof Date
    ? committed.committed_at.toISOString()
    : String(committed?.committed_at || committed?.committedAt || "");
  if (!occurredAt) throw new Error("funding_commitment_committed_occurred_at_missing");
  return {
    producer_id: "shs.exchange",
    event_type: "funding_commitment.committed",
    schema_version: "v1",
    subject_type: "funding_commitment",
    subject_id: commitmentId,
    organization_id: organizationId,
    originating_actor_id: actorId,
    originating_actor_type: "user",
    tenant_id: tenantId,
    occurred_at: occurredAt,
    idempotency_key: `exchange-funding-commitment:${commitmentId}:committed`,
    correlation_id: String(correlationId || "").trim(),
    payload: {
      commitment_id: commitmentId,
      recipient_organization_id: String(committed?.recipient_organization_id || committed?.recipientOrganizationId || "").trim(),
      amount_minor: Number(committed?.amount_minor ?? committed?.amountMinor),
      currency: String(committed?.currency || "").trim(),
      lifecycle_status: "committed",
      version: Number(committed?.version),
    },
    destination: "agent-fabric",
  };
}

export function buildGrantBinderCreatedOutboxEvent(created: any, correlationId: string): TrustedReportingOutboxEvent {
  const binderId = String(created?.binder_id || created?.binderId || "").trim();
  const organizationId = String(created?.organization_id || "").trim();
  const actorId = String(created?.created_by_user_id || created?.createdBy || created?.created_by || "").trim();
  const tenantId = String(created?.tenant_id || "").trim();
  if (!binderId || !organizationId || !actorId || !tenantId) throw new Error("grant_binder_created_outbox_scope_missing");
  const createdAt = created?.created_at || created?.createdAt;
  const occurredAt = createdAt instanceof Date
    ? createdAt.toISOString()
    : String(createdAt || new Date().toISOString());
  return {
    producer_id: "shs.grant_binder",
    event_type: "grant_binder.created",
    schema_version: "v1",
    subject_type: "grant_binder",
    subject_id: binderId,
    organization_id: organizationId,
    originating_actor_id: actorId,
    originating_actor_type: "user",
    tenant_id: tenantId,
    occurred_at: occurredAt,
    idempotency_key: `grant-binder:${binderId}:created`,
    correlation_id: String(correlationId || "").trim(),
    payload: {
      binder_id: binderId,
      lifecycle_status: String(created?.lifecycle_status || created?.lifecycleStatus || "draft"),
      version: Number(created?.version || 1),
    },
    destination: "agent-fabric",
  };
}

export function buildReferralOutboxEvent(created: any, correlationId: string): ReferralOutboxEvent {
  const referralId = String(created?.case_id || "").trim();
  const organizationId = String(created?.organization_id || "").trim();
  const actorId = String(created?.created_by_user_id || "").trim();
  if (!referralId || !organizationId || !actorId) throw new Error("referral_outbox_scope_missing");
  const occurredAt = created?.created_at instanceof Date
    ? created.created_at.toISOString()
    : String(created?.created_at || new Date().toISOString());
  return {
    producer_id: "hub.referral",
    event_type: "referral.created",
    subject_type: "referral",
    subject_id: referralId,
    organization_id: organizationId,
    originating_actor_id: actorId,
    originating_actor_type: "user",
    tenant_id: `tenant:${organizationId}`,
    occurred_at: occurredAt,
    idempotency_key: `referral:${referralId}:created`,
    correlation_id: String(correlationId || "").trim(),
    payload: { referral_id: referralId },
    destination: "agent-fabric",
  };
}

export function buildReportCreatedOutboxEvent(created: any, revisionId: string, correlationId: string): TrustedReportingOutboxEvent {
  const reportId = String(created?.report_id || created?.reportId || "").trim();
  const organizationId = String(created?.organization_id || "").trim();
  const actorId = String(created?.created_by_user_id || created?.createdBy || "").trim();
  const tenantId = String(created?.tenant_id || "").trim();
  const revision = String(revisionId || "").trim();
  if (!reportId || !organizationId || !actorId || !tenantId || !revision) throw new Error("report_created_outbox_scope_missing");
  const occurredAt = created?.created_at instanceof Date
    ? created.created_at.toISOString()
    : String(created?.created_at || new Date().toISOString());
  return {
    producer_id: "shs.reporting",
    event_type: "report.created",
    schema_version: "v1",
    subject_type: "report_draft",
    subject_id: reportId,
    organization_id: organizationId,
    originating_actor_id: actorId,
    originating_actor_type: "user",
    tenant_id: tenantId,
    occurred_at: occurredAt,
    idempotency_key: `report:${reportId}:created`,
    correlation_id: String(correlationId || "").trim(),
    payload: {
      report_id: reportId,
      revision_id: revision,
      report_version: Number(created?.version || 1),
      lifecycle_status: String(created?.lifecycle_status || "draft"),
    },
    destination: "agent-fabric",
  };
}

export function classifyDeliveryFailure(error: { status?: number; code?: string }): { retryable: boolean; final: boolean } {
  const networkCode = String(error.code || (error as any)?.cause?.code || "");
  if (error.status === 408 || error.status === 429 || (error.status || 0) >= 500 || ["ETIMEDOUT", "ECONNRESET", "ECONNREFUSED", "ENETUNREACH"].includes(networkCode)) {
    return { retryable: true, final: false };
  }
  return { retryable: false, final: true };
}

export type DeliveryClassification = "SUCCESS" | "ALREADY_ACCEPTED_IDEMPOTENT_SUCCESS" | "RETRYABLE_FAILURE" | "PERMANENT_FAILURE";

export function classifyDeliveryResponse(status: number, body: any = null): DeliveryClassification {
  if (status >= 200 && status < 300) return "SUCCESS";
  if (status === 409 && body?.idempotent_replay === true) return "ALREADY_ACCEPTED_IDEMPOTENT_SUCCESS";
  if (status === 408 || status === 429 || status >= 500) return "RETRYABLE_FAILURE";
  return "PERMANENT_FAILURE";
}

export function canonicalRequestBytes(method: string, path: string, bodyDigest: string, issuedAt: string, expiresAt: string, keyId: string): Buffer {
  return Buffer.from([method.toUpperCase(), path, bodyDigest, issuedAt, expiresAt, keyId].join("|"), "utf8");
}

export function signInternalRequest(method: string, path: string, body: Record<string, unknown>, now = Math.floor(Date.now() / 1000)) {
  const serviceId = "service:shs-api";
  const keyId = String(process.env.SHF_INTERNAL_SERVICE_ACTIVE_KID || "").trim();
  const keysRaw = String(process.env.SHF_INTERNAL_SERVICE_KEYS_JSON || "").trim();
  if (!keyId || !keysRaw) throw new Error("internal_service_credentials_missing");
  if ([process.env.SHS_AUTH_ENV, process.env.NODE_ENV].some((value) => String(value || "").toLowerCase() === "production") && !process.env.SHF_INTERNAL_SERVICE_KEYS_REF) {
    throw new Error("production_internal_service_key_provider_required");
  }
  let keys: Record<string, string>;
  try {
    keys = JSON.parse(keysRaw);
  } catch {
    throw new Error("internal_service_credentials_invalid");
  }
  const secret = keys[keyId];
  if (!secret) throw new Error("internal_service_key_unknown");
  const issuedAt = String(now);
  const expiresAt = String(now + 60);
  const bodyDigest = crypto.createHash("sha256").update(stableJson(body)).digest("hex");
  const signature = crypto.createHmac("sha256", secret).update(canonicalRequestBytes(method, path, bodyDigest, issuedAt, expiresAt, keyId)).digest("hex");
  return {
    "X-SHF-Service-Id": serviceId,
    "X-SHF-Service-Kid": keyId,
    "X-SHF-Service-Iat": issuedAt,
    "X-SHF-Service-Exp": expiresAt,
    "X-SHF-Service-Signature": signature,
  };
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
