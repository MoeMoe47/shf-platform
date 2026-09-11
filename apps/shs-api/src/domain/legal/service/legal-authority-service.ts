import { createHash, randomUUID } from "node:crypto";
import { query } from "../../../db/client.js";

function scope(actor: any) {
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "").trim();
  const tenantId = String(actor?.tenant_id || `tenant:${organizationId}`).trim();
  const userId = String(actor?.user_id || "").trim();
  if (!organizationId || !userId || tenantId !== `tenant:${organizationId}`) throw new Error("ORG_CONTEXT_REQUIRED");
  return { organizationId, tenantId, userId };
}

function classification(value: unknown) {
  const result = String(value || "INTERNAL").toUpperCase();
  if (!["PUBLIC", "INTERNAL", "RESTRICTED_EXTERNAL"].includes(result)) throw new Error("LEGAL_CLASSIFICATION_INVALID");
  return result;
}

export async function createArtifact(actor: any, input: any) {
  const s = scope(actor);
  const reference = String(input?.authoritativeReference || input?.authoritative_reference || "").trim();
  const title = String(input?.title || "").trim();
  const artifactType = String(input?.artifactType || input?.artifact_type || "").trim();
  if (!reference || !title || !artifactType) throw new Error("LEGAL_ARTIFACT_REQUIRED");
  const metadata = input?.metadata && typeof input.metadata === "object" ? input.metadata : {};
  const hash = String(input?.contentHash || input?.content_hash || createHash("sha256").update(reference).digest("hex"));
  if (!/^[0-9a-f]{64}$/.test(hash)) throw new Error("LEGAL_CONTENT_HASH_INVALID");
  const artifactId = `legal_artifact_${randomUUID()}`;
  const result = await query(`INSERT INTO legal_artifacts (artifact_id, organization_id, tenant_id, artifact_type, title, status, effective_at, jurisdiction, authoritative_reference, content_hash, classification, confidentiality, privilege_state, metadata_json, created_by_user_id) VALUES ($1,$2,$3,$4,$5,'DRAFT',$6,$7,$8,$9,$10,$11,'NOT_ASSESSED',$12,$13) RETURNING *`, [artifactId, s.organizationId, s.tenantId, artifactType, title, input?.effectiveAt || input?.effective_at || null, input?.jurisdiction || null, reference, hash, classification(input?.classification), String(input?.confidentiality || "INTERNAL").toUpperCase(), JSON.stringify(metadata), s.userId]);
  return result.rows[0];
}

export async function listArtifacts(actor: any) {
  const s = scope(actor);
  const result = await query("SELECT artifact_id, organization_id, tenant_id, artifact_type, title, status, effective_at, superseded_at, jurisdiction, authoritative_reference, content_hash, classification, confidentiality, privilege_state, metadata_json, created_at, updated_at FROM legal_artifacts WHERE organization_id=$1 AND tenant_id=$2 ORDER BY created_at DESC", [s.organizationId, s.tenantId]);
  return result.rows;
}

export async function getArtifact(actor: any, artifactId: string) {
  const s = scope(actor);
  const result = await query("SELECT artifact_id, organization_id, tenant_id, artifact_type, title, status, effective_at, superseded_at, jurisdiction, authoritative_reference, content_hash, classification, confidentiality, privilege_state, metadata_json, created_at, updated_at FROM legal_artifacts WHERE artifact_id=$1 AND organization_id=$2 AND tenant_id=$3", [artifactId, s.organizationId, s.tenantId]);
  return result.rows[0] || null;
}

export async function activateArtifact(actor: any, artifactId: string) {
  const s = scope(actor);
  const result = await query("UPDATE legal_artifacts SET status='ACTIVE', approved_by_user_id=$4, effective_at=COALESCE(effective_at,NOW()), updated_at=NOW() WHERE artifact_id=$1 AND organization_id=$2 AND tenant_id=$3 AND status='DRAFT' RETURNING *", [artifactId, s.organizationId, s.tenantId, s.userId]);
  if (!result.rows[0]) throw new Error("LEGAL_ARTIFACT_NOT_ACTIVATABLE");
  return result.rows[0];
}

export async function createDecision(actor: any, input: any) {
  const s = scope(actor);
  const text = String(input?.decisionText || input?.decision_text || "").trim();
  const authority = String(input?.authorityReference || input?.authority_reference || "").trim();
  if (!text || !authority) throw new Error("LEGAL_DECISION_REQUIRED");
  const artifactId = input?.artifactId || input?.artifact_id || null;
  if (artifactId) {
    const artifact = await query("SELECT artifact_id FROM legal_artifacts WHERE artifact_id=$1 AND organization_id=$2 AND tenant_id=$3", [artifactId, s.organizationId, s.tenantId]);
    if (!artifact.rows[0]) throw new Error("LEGAL_ARTIFACT_NOT_FOUND");
  }
  const result = await query("INSERT INTO legal_decisions (decision_id, artifact_id, organization_id, tenant_id, decision_text, authority_reference, disposition, decision_at, actor_user_id, provenance_json) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *", [`legal_decision_${randomUUID()}`, input?.artifactId || input?.artifact_id || null, s.organizationId, s.tenantId, text, authority, String(input?.disposition || "RECORDED"), input?.decisionAt || input?.decision_at || new Date().toISOString(), s.userId, JSON.stringify(input?.provenance || {})]);
  return result.rows[0];
}

export async function createObligation(actor: any, input: any) {
  const s = scope(actor);
  const text = String(input?.obligationText || input?.obligation_text || "").trim();
  const accountable = String(input?.accountableEntityReference || input?.accountable_entity_reference || "").trim();
  if (!text || !accountable) throw new Error("LEGAL_OBLIGATION_REQUIRED");
  const result = await query("INSERT INTO legal_obligations (obligation_id, artifact_id, organization_id, tenant_id, obligation_text, accountable_entity_reference, status, effective_at, due_at, technical_binding_reference, evidence_reference, created_by_user_id) VALUES ($1,$2,$3,$4,$5,$6,'OPEN',$7,$8,$9,$10,$11) RETURNING *", [`legal_obligation_${randomUUID()}`, input?.artifactId || input?.artifact_id || null, s.organizationId, s.tenantId, text, accountable, input?.effectiveAt || input?.effective_at || null, input?.dueAt || input?.due_at || null, input?.technicalBindingReference || input?.technical_binding_reference || null, input?.evidenceReference || input?.evidence_reference || null, s.userId]);
  return result.rows[0];
}

export async function placeHold(actor: any, input: any) {
  const s = scope(actor);
  const subject = String(input?.subjectReference || input?.subject_reference || "").trim();
  const reason = String(input?.reasonReference || input?.reason_reference || "").trim();
  if (!subject || !reason) throw new Error("LEGAL_HOLD_REQUIRED");
  const result = await query("INSERT INTO legal_holds (hold_id, organization_id, tenant_id, subject_reference, status, reason_reference, placed_by_user_id) VALUES ($1,$2,$3,$4,'ACTIVE',$5,$6) RETURNING *", [`legal_hold_${randomUUID()}`, s.organizationId, s.tenantId, subject, reason, s.userId]);
  return result.rows[0];
}
