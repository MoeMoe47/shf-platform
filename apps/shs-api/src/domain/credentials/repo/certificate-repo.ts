import { query } from "../../../db/client.js";

export type IssuedCertificate = {
  certificateId: string;
  learnerUserId: string;
  organizationId: string;
  tenantId: string;
  canonicalProgramReference: string;
  courseReference: string | null;
  certificateType: string;
  profileKey: string;
  profileVersion: string;
  issuerReference: string;
  issuedAt: string;
  qualificationReference: string;
  evidenceReferences: unknown[];
  status: string;
  verificationReference: string;
  certificateSerial: string;
  templateKey: string;
  templateVersion: string;
  sourceVersions: Record<string, unknown>;
  presentationSnapshot: Record<string, unknown>;
  contentHash: string;
  supersedesCertificateId: string | null;
  replacedByCertificateId: string | null;
  revokedAt: string | null;
  revokedByUserId: string | null;
  revocationReason: string | null;
  revocationReference: string | null;
};

function iso(value: any) { return value instanceof Date ? value.toISOString() : value; }
function map(row: any): IssuedCertificate {
  return {
    certificateId: row.certificate_id,
    learnerUserId: row.learner_user_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    canonicalProgramReference: row.canonical_program_reference,
    courseReference: row.course_reference,
    certificateType: row.certificate_type,
    profileKey: row.profile_key,
    profileVersion: row.profile_version,
    issuerReference: row.issuer_reference,
    issuedAt: iso(row.issued_at),
    qualificationReference: row.qualification_reference,
    evidenceReferences: row.evidence_references_json || [],
    status: row.status,
    verificationReference: row.verification_reference,
    certificateSerial: row.certificate_serial,
    templateKey: row.template_key,
    templateVersion: row.template_version,
    sourceVersions: row.source_versions_json || {},
    presentationSnapshot: row.presentation_snapshot_json || {},
    contentHash: row.content_hash,
    supersedesCertificateId: row.supersedes_certificate_id,
    replacedByCertificateId: row.replaced_by_certificate_id,
    revokedAt: iso(row.revoked_at),
    revokedByUserId: row.revoked_by_user_id,
    revocationReason: row.revocation_reference,
    revocationReference: row.revocation_reference,
  };
}

const COLUMNS = `certificate_id, learner_user_id, organization_id, tenant_id,
  canonical_program_reference, course_reference, certificate_type, profile_key,
  profile_version, issuer_reference, issued_at, qualification_reference,
  evidence_references_json, status, verification_reference, certificate_serial,
  template_key, template_version, source_versions_json, presentation_snapshot_json,
  content_hash, supersedes_certificate_id, replaced_by_certificate_id, revoked_at,
  revoked_by_user_id, revocation_reference`;

export class CertificateRepo {
  async create(input: any, executor: any = { query }): Promise<IssuedCertificate> {
    const result = await executor.query(`INSERT INTO issued_certificates
      (certificate_id, learner_user_id, organization_id, tenant_id, canonical_program_reference,
       course_reference, certificate_type, profile_key, profile_version, issuer_reference,
       issued_at, qualification_reference, evidence_references_json, status,
       verification_reference, certificate_serial, template_key, template_version,
       source_versions_json, presentation_snapshot_json, content_hash, supersedes_certificate_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'ISSUED',$14,$15,$16,$17,$18,$19,$20,$21)
      RETURNING ${COLUMNS}`, [input.certificateId, input.learnerUserId, input.organizationId, input.tenantId,
      input.canonicalProgramReference, input.courseReference, input.certificateType, input.profileKey,
      input.profileVersion, input.issuerReference, input.issuedAt, input.qualificationReference,
      JSON.stringify(input.evidenceReferences || []), input.verificationReference, input.certificateSerial,
      input.templateKey, input.templateVersion, JSON.stringify(input.sourceVersions || {}),
      JSON.stringify(input.presentationSnapshot), input.contentHash, input.supersedesCertificateId || null]);
    return map(result.rows[0]);
  }

  async getById(id: string): Promise<IssuedCertificate | null> {
    const result = await query(`SELECT ${COLUMNS} FROM issued_certificates WHERE certificate_id=$1`, [id]);
    return result.rows[0] ? map(result.rows[0]) : null;
  }

  async getByVerificationReference(reference: string): Promise<IssuedCertificate | null> {
    const result = await query(`SELECT ${COLUMNS} FROM issued_certificates WHERE verification_reference=$1`, [reference]);
    return result.rows[0] ? map(result.rows[0]) : null;
  }

  async getActiveByQualification(input: { learnerUserId: string; organizationId: string; canonicalProgramReference: string; certificateType: string; qualificationReference: string }, executor: any = { query }): Promise<IssuedCertificate | null> {
    const result = await executor.query(`SELECT ${COLUMNS} FROM issued_certificates
      WHERE learner_user_id=$1 AND organization_id=$2 AND canonical_program_reference=$3
        AND certificate_type=$4 AND qualification_reference=$5 AND status IN ('ISSUED','REPLACED')
      ORDER BY issued_at DESC LIMIT 1`, [input.learnerUserId, input.organizationId, input.canonicalProgramReference, input.certificateType, input.qualificationReference]);
    return result.rows[0] ? map(result.rows[0]) : null;
  }

  async listForActor(organizationId: string, learnerUserId: string, admin: boolean): Promise<IssuedCertificate[]> {
    const result = await query(admin
      ? `SELECT ${COLUMNS} FROM issued_certificates WHERE organization_id=$1 ORDER BY issued_at DESC`
      : `SELECT ${COLUMNS} FROM issued_certificates WHERE organization_id=$1 AND learner_user_id=$2 ORDER BY issued_at DESC`, admin ? [organizationId] : [organizationId, learnerUserId]);
    return result.rows.map(map);
  }

  async updateStatus(id: string, organizationId: string, status: string, actorId: string, reason: string | null, successorId: string | null = null): Promise<IssuedCertificate | null> {
    const result = await query(`UPDATE issued_certificates SET status=$3, revoked_at=CASE WHEN $3='REVOKED' THEN NOW() ELSE revoked_at END,
      revoked_by_user_id=CASE WHEN $3='REVOKED' THEN $4 ELSE revoked_by_user_id END,
      revocation_reference=CASE WHEN $3='REVOKED' THEN $5 ELSE revocation_reference END,
      replaced_by_certificate_id=COALESCE($6, replaced_by_certificate_id), updated_at=NOW()
      WHERE certificate_id=$1 AND organization_id=$2 RETURNING ${COLUMNS}`, [id, organizationId, status, actorId, reason, successorId]);
    return result.rows[0] ? map(result.rows[0]) : null;
  }

  async setSuccessor(id: string, organizationId: string, successorId: string): Promise<void> {
    await query("UPDATE issued_certificates SET status='REPLACED', replaced_by_certificate_id=$3, updated_at=NOW() WHERE certificate_id=$1 AND organization_id=$2", [id, organizationId, successorId]);
  }

  async addRender(input: any): Promise<any> {
    const result = await query(`INSERT INTO certificate_renders
      (certificate_render_id, certificate_id, organization_id, tenant_id, format, mime_type, byte_length,
       content_hash, renderer_version, template_key, template_version, storage_reference, filename)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`, [input.renderId, input.certificateId, input.organizationId, input.tenantId, input.format, input.mimeType, input.byteLength, input.contentHash, input.rendererVersion, input.templateKey, input.templateVersion, input.storageReference, input.filename]);
    return result.rows[0];
  }

  async getRender(renderId: string, certificateId: string): Promise<any | null> {
    const result = await query("SELECT * FROM certificate_renders WHERE certificate_render_id=$1 AND certificate_id=$2", [renderId, certificateId]);
    return result.rows[0] || null;
  }

  async addDeliveryEvent(input: any): Promise<any> {
    const result = await query(`INSERT INTO certificate_delivery_events
      (delivery_id, certificate_id, organization_id, tenant_id, channel, recipient_reference,
       requested_by_user_id, status, provider_reference, failure_reason)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`, [input.deliveryId, input.certificateId, input.organizationId, input.tenantId, input.channel, input.recipientReference || null, input.requestedByUserId, input.status, input.providerMessageReference || null, input.failureReason || null]);
    return result.rows[0];
  }
}

export const certificateRepo = new CertificateRepo();
