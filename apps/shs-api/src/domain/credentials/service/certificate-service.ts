import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { query } from "../../../db/client.js";
import { withTransaction } from "../../../db/transaction.js";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { isAdminTier } from "../../shared/audience-eligibility.js";
import { safeReportFilename } from "../../reporting/report-file-storage.js";
import { certificateRepo, IssuedCertificate } from "../repo/certificate-repo.js";
import { programCertificateProfileRegistry, ProgramCertificateProfile } from "../model/certificate-profile.js";
import { CertificatePresentation, renderCertificate } from "./certificate-renderer.js";
import { CredentialActor, CredentialError } from "./credential-service.js";
import { programCompletionService } from "../../programs/service/program-completion-service.js";
import { IntegrationOutboxRepo } from "../../trusted-reporting/outbox-repo.js";

const certificateOutbox = new IntegrationOutboxRepo();

const storageRoot = () => process.env.SHS_CERTIFICATE_STORAGE_ROOT || path.join(process.env.SHS_REPORT_STORAGE_ROOT || os.tmpdir(), "shs-certificate-artifacts");
function scope(actor: CredentialActor) {
  if (!actor.user_id || !actor.organization_id) throw new CredentialError("SCOPE_MISSING", "Actor organization/user is required.", 403);
  return { organizationId: actor.organization_id, tenantId: `tenant:${actor.organization_id}`, userId: actor.user_id };
}
function assertPermission(actor: CredentialActor, permission: string) {
  if (!hasPermission(actor.permissions, permission)) throw new CredentialError("FORBIDDEN", `Missing permission: ${permission}.`, 403);
}
function safeSegment(value: unknown, fallback: string) {
  const normalized = String(value || fallback).replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^\.+/, "").replace(/^-+|-+$/g, "");
  return normalized || fallback;
}
function stable(value: unknown) { return JSON.stringify(value, Object.keys(value as any).sort()); }

export type CertificateEligibility = {
  eligible: boolean;
  state: "ELIGIBLE" | "INCOMPLETE" | "BLOCKED";
  reason: string;
  profileKey: string;
  profileVersion: string;
  qualificationReference: string | null;
  evidenceReferences: unknown[];
  completionState?: string;
  completionReference?: string | null;
};

function trustedProfile(input: any): ProgramCertificateProfile {
  try {
    programCertificateProfileRegistry.assertTrustedInput(input || {});
    return programCertificateProfileRegistry.resolveForRequest(input || {});
  } catch (error: any) {
    throw new CredentialError(String(error?.message || "CERTIFICATE_PROFILE_INVALID"), "Certificate profile resolution failed closed.", 400);
  }
}

async function resolveTarget(actor: CredentialActor, learnerUserId: string) {
  const current = scope(actor);
  if (!isAdminTier(actor.roles) && learnerUserId !== current.userId) throw new CredentialError("LEARNER_SCOPE_FORBIDDEN", "Learner certificate scope is not authorized.", 403);
  const learner = await query("SELECT user_id, full_name, email FROM users WHERE user_id=$1 AND organization_id=$2 LIMIT 1", [learnerUserId, current.organizationId]);
  if (!learner.rows[0]) throw new CredentialError("LEARNER_NOT_FOUND", "Learner not found in this organization.", 404);
  return { ...current, learner: learner.rows[0] };
}

export function listCertificateProfiles() { return programCertificateProfileRegistry.definitions(); }

export async function evaluateCertificateEligibility(actor: CredentialActor, input: any): Promise<CertificateEligibility> {
  assertPermission(actor, SHS_SECURITY_PERMISSIONS.CREDENTIAL_VIEW);
  const profile = trustedProfile(input);
  const learnerUserId = String(input?.learnerUserId || input?.learner_user_id || actor.user_id);
  await resolveTarget(actor, learnerUserId);
  if (profile.canonicalReferenceMode === "PROGRAM") {
    const completion = await programCompletionService.evaluate(actor, learnerUserId, profile.canonicalProgramReference);
    return { eligible: completion.completed, state: completion.completed ? "ELIGIBLE" : completion.status === "BLOCKED" ? "BLOCKED" : "INCOMPLETE", reason: completion.reason, profileKey: profile.profileKey, profileVersion: profile.version, qualificationReference: completion.completed ? `program-completion:${completion.programCompletionId}` : null, evidenceReferences: completion.evidenceReferences, completionState: completion.status, completionReference: completion.programCompletionId };
  }
  const courseReference = String(input?.courseReference || input?.course_reference || "").trim();
  if (!courseReference) throw new CredentialError("COURSE_REQUIRED", "A canonical course reference is required.", 400);
  const course = await query("SELECT course_id, title, status FROM curriculum_courses WHERE course_id=$1 AND organization_id=$2 LIMIT 1", [courseReference, actor.organization_id]);
  if (!course.rows[0]) throw new CredentialError("COURSE_NOT_FOUND", "Canonical course not found in this organization.", 404);
  const release = await query("SELECT release_id, version_number, snapshot, content_hash FROM curriculum_releases WHERE course_id=$1 AND organization_id=$2 AND status='PUBLISHED' ORDER BY version_number DESC LIMIT 1", [courseReference, actor.organization_id]);
  const snapshot = release.rows[0]?.snapshot;
  const lessons = Array.isArray(snapshot?.units) ? snapshot.units.flatMap((unit: any) => Array.isArray(unit.lessons) ? unit.lessons.map((lesson: any) => ({ ...lesson, unitStableKey: unit.stableKey })) : []) : [];
  if (!release.rows[0] || !lessons.length) return { eligible: false, state: "BLOCKED", reason: "COURSE_COMPLETION_AUTHORITY_UNAVAILABLE", profileKey: profile.profileKey, profileVersion: profile.version, qualificationReference: null, evidenceReferences: [] };
  const completed = await query("SELECT lesson_id, completed_at FROM curriculum_lesson_completions WHERE organization_id=$1 AND user_id=$2 AND curriculum_id=$3", [actor.organization_id, learnerUserId, courseReference]);
  const lessonRows = await query(`SELECT l.lesson_id, l.stable_key, u.stable_key AS unit_stable_key FROM curriculum_lessons l JOIN curriculum_units u ON u.unit_id=l.unit_id WHERE l.organization_id=$1 AND u.organization_id=$1 AND l.status='ACTIVE' AND u.status='ACTIVE' AND u.course_id=$2`, [actor.organization_id, courseReference]);
  const requiredIds = lessons.map((lesson: any) => lessonRows.rows.find((row: any) => row.stable_key === lesson.stableKey && row.unit_stable_key === lesson.unitStableKey)?.lesson_id).filter(Boolean);
  if (requiredIds.length !== lessons.length) return { eligible: false, state: "BLOCKED", reason: "COURSE_COMPLETION_AUTHORITY_UNAVAILABLE", profileKey: profile.profileKey, profileVersion: profile.version, qualificationReference: null, evidenceReferences: [] };
  const completedIds = new Set(completed.rows.map((row: any) => row.lesson_id));
  const missing = requiredIds.filter((lessonId: string) => !completedIds.has(lessonId));
  const evidenceReferences = completed.rows.map((row: any) => ({ type: "lesson-completion", id: `${courseReference}:${row.lesson_id}`, completedAt: row.completed_at }));
  const qualificationReference = `course:${courseReference}:release:${release.rows[0].release_id}`;
  return { eligible: missing.length === 0, state: missing.length ? "INCOMPLETE" : "ELIGIBLE", reason: missing.length ? "REQUIRED_LESSONS_INCOMPLETE" : "COURSE_COMPLETION_VERIFIED", profileKey: profile.profileKey, profileVersion: profile.version, qualificationReference, evidenceReferences };
}

function presentation(profile: ProgramCertificateProfile, record: any, learnerName: string): CertificatePresentation {
  const snapshot = record.presentationSnapshot || {};
  const base = process.env.SHS_CERTIFICATE_VERIFICATION_BASE_URL || "/certificates/verify";
  return { learnerDisplayName: String(snapshot.learnerDisplayName || learnerName), certificateTitle: String(snapshot.certificateTitle || profile.certificateTitle), programName: String(snapshot.programName || profile.displayName), issuer: String(snapshot.issuer || profile.issuerReference), accomplishment: String(snapshot.accomplishment || profile.accomplishmentTextKey), issuedAt: String(snapshot.issuedAt || record.issuedAt), certificateReference: record.certificateSerial, competencies: Array.isArray(snapshot.competencies) ? snapshot.competencies : [], status: record.status, verificationReference: record.verificationReference, profileKey: record.profileKey, profileVersion: record.profileVersion, verificationUrl: `${base.replace(/\/$/, "")}/${encodeURIComponent(record.verificationReference)}` };
}

export async function issueCertificate(actor: CredentialActor, input: any): Promise<IssuedCertificate> {
  assertPermission(actor, SHS_SECURITY_PERMISSIONS.CREDENTIAL_ISSUE);
  const profile = trustedProfile(input);
  const learnerUserId = String(input?.learnerUserId || input?.learner_user_id || "");
  if (!learnerUserId) throw new CredentialError("LEARNER_REQUIRED", "Learner is required.", 400);
  const current = await resolveTarget(actor, learnerUserId);
  const eligibility = await evaluateCertificateEligibility(actor, input);
  if (!eligibility.eligible || !eligibility.qualificationReference) throw new CredentialError("CERTIFICATE_NOT_ELIGIBLE", eligibility.reason, 403);
  const issuedAt = new Date().toISOString();
  const certificateId = `certificate_${randomUUID()}`;
  const verificationReference = `shs-cert-${randomUUID().replaceAll("-", "").slice(0, 20)}`;
  const serial = `${profile.filenamePrefix}-${new Date().getUTCFullYear()}-${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
  const snapshot = { learnerDisplayName: current.learner.full_name, certificateTitle: profile.certificateTitle, programName: profile.displayName, issuer: profile.issuerReference, accomplishment: profile.accomplishmentTextKey, competencies: profile.displayedCompetencyKeys, issuedAt, certificateReference: serial, profileKey: profile.profileKey, profileVersion: profile.version };
  const contentHash = createHash("sha256").update(stable(snapshot)).digest("hex");
  return withTransaction(async (db: any) => {
    await db.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`certificate:${current.organizationId}:${learnerUserId}:${profile.profileKey}:${eligibility.qualificationReference}`]);
    const existing = await certificateRepo.getActiveByQualification({ learnerUserId, organizationId: current.organizationId, canonicalProgramReference: profile.canonicalProgramReference, certificateType: profile.certificateType, qualificationReference: eligibility.qualificationReference }, db);
    if (existing) return existing;
    return certificateRepo.create({ certificateId, learnerUserId, organizationId: current.organizationId, tenantId: current.tenantId, canonicalProgramReference: profile.canonicalProgramReference, courseReference: profile.canonicalReferenceMode === "COURSE_INPUT" ? String(input.courseReference || input.course_reference) : null, certificateType: profile.certificateType, profileKey: profile.profileKey, profileVersion: profile.version, issuerReference: profile.issuerReference, issuedAt, qualificationReference: eligibility.qualificationReference, evidenceReferences: eligibility.evidenceReferences, verificationReference, certificateSerial: serial, templateKey: profile.templateKey, templateVersion: profile.templateVersion, sourceVersions: { qualification: eligibility.qualificationReference }, presentationSnapshot: snapshot, contentHash }, db);
  });
}

async function authorizedCertificate(actor: CredentialActor, id: string) {
  assertPermission(actor, SHS_SECURITY_PERMISSIONS.CREDENTIAL_VIEW);
  const current = scope(actor);
  const item = await certificateRepo.getById(id);
  if (!item || item.organizationId !== current.organizationId || (!isAdminTier(actor.roles) && item.learnerUserId !== current.userId)) return null;
  return item;
}

export async function listCertificates(actor: CredentialActor) { assertPermission(actor, SHS_SECURITY_PERMISSIONS.CREDENTIAL_VIEW); const current = scope(actor); return certificateRepo.listForActor(current.organizationId, current.userId, isAdminTier(actor.roles)); }
export async function getCertificate(actor: CredentialActor, id: string) { return authorizedCertificate(actor, id); }

export async function renderIssuedCertificate(actor: CredentialActor, id: string, format: "HTML" | "PDF") {
  const item = await authorizedCertificate(actor, id); if (!item) throw new CredentialError("CERTIFICATE_NOT_FOUND", "Certificate not found.", 404);
  const profile = programCertificateProfileRegistry.resolve(item.profileKey, item.canonicalProgramReference, item.certificateType, item.profileVersion);
  const output = await renderCertificate(presentation(profile, item, String(item.presentationSnapshot.learnerDisplayName || "Learner")), format);
  const renderId = `certificate_render_${randomUUID()}`;
  const extension = format.toLowerCase();
  const filename = safeReportFilename({ productKey: "foundation", jurisdiction: item.canonicalProgramReference, reportType: profile.certificateTitle, period: item.issuedAt.slice(0, 10), version: item.profileVersion, format: extension, filenamePrefix: profile.filenamePrefix });
  const reference = ["certificates", item.organizationId, item.tenantId, item.certificateId, `${renderId}.${extension}`].map((v) => safeSegment(v, "unknown")).join("/");
  const target = path.resolve(storageRoot(), reference); if (!target.startsWith(path.resolve(storageRoot()) + path.sep)) throw new CredentialError("CERTIFICATE_STORAGE_INVALID", "Certificate storage reference is invalid.", 500);
  await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, output.bytes, { flag: "wx" });
  const render = await certificateRepo.addRender({ renderId, certificateId: item.certificateId, organizationId: item.organizationId, tenantId: item.tenantId, format, mimeType: output.mimeType, byteLength: output.bytes.length, contentHash: output.hash, rendererVersion: output.rendererVersion, templateKey: item.templateKey, templateVersion: item.templateVersion, storageReference: reference, filename });
  return { render, bytes: output.bytes, mimeType: output.mimeType, filename, hash: output.hash };
}

export async function downloadRenderedCertificate(actor: CredentialActor, id: string, renderId: string) {
  const item = await authorizedCertificate(actor, id); if (!item) throw new CredentialError("CERTIFICATE_NOT_FOUND", "Certificate not found.", 404);
  const render = await certificateRepo.getRender(renderId, id); if (!render || render.organization_id !== item.organizationId || render.tenant_id !== item.tenantId) throw new CredentialError("CERTIFICATE_RENDER_NOT_FOUND", "Certificate rendition not found.", 404);
  const root = path.resolve(storageRoot()); const target = path.resolve(root, render.storage_reference); if (!target.startsWith(root + path.sep)) throw new CredentialError("CERTIFICATE_STORAGE_INVALID", "Certificate storage reference is invalid.", 500);
  const bytes = await readFile(target); if (createHash("sha256").update(bytes).digest("hex") !== render.content_hash) throw new CredentialError("CERTIFICATE_HASH_MISMATCH", "Certificate rendition integrity check failed.", 500);
  await certificateRepo.addDeliveryEvent({ deliveryId: `certificate_delivery_${randomUUID()}`, certificateId: id, organizationId: item.organizationId, tenantId: item.tenantId, channel: "DOWNLOAD", requestedByUserId: actor.user_id, status: "DELIVERED" });
  return { bytes, mimeType: render.mime_type, filename: render.filename, hash: render.content_hash };
}

export async function emailIssuedCertificate(actor: CredentialActor, id: string) {
  const item = await authorizedCertificate(actor, id); if (!item) throw new CredentialError("CERTIFICATE_NOT_FOUND", "Certificate not found.", 404);
  if (item.status !== "ISSUED") throw new CredentialError("CERTIFICATE_NOT_DELIVERABLE", "Only an issued certificate may be emailed.", 409);
  const email = await learnerEmail(actor, id);
  if (!email) { const event = await recordDelivery(actor, id, "EMAIL", "FAILED", undefined, "LEARNER_EMAIL_UNAVAILABLE"); return { delivered: false, event, reason: "LEARNER_EMAIL_UNAVAILABLE" }; }
  const transport = String(process.env.SHS_CERTIFICATE_EMAIL_TRANSPORT || (process.env.NODE_ENV === "production" ? "unavailable" : "test")).toLowerCase();
  if (transport !== "test") { const event = await recordDelivery(actor, id, "EMAIL", "FAILED", email, "EMAIL_PROVIDER_NOT_CONFIGURED"); return { delivered: false, event, reason: "EMAIL_PROVIDER_NOT_CONFIGURED" }; }
  const rendered = await renderIssuedCertificate(actor, id, "PDF");
  await certificateOutbox.enqueue({ producer_id: "shs-api.credentials", event_type: "certificate.email.requested", schema_version: "1.0", subject_type: "issued_certificate", subject_id: item.certificateId, organization_id: item.organizationId, originating_actor_id: actor.user_id, originating_actor_type: "user", tenant_id: item.tenantId, occurred_at: new Date().toISOString(), idempotency_key: `certificate.email.requested:${item.certificateId}:${rendered.hash}:${email}`, correlation_id: `certificate-delivery:${item.certificateId}`, payload: { certificate_id: item.certificateId, certificate_reference: item.certificateSerial, recipient_reference: email, attachment_hash: rendered.hash, template_key: item.profileKey }, destination: "email-provider" });
  const event = await recordDelivery(actor, id, "EMAIL", "DELIVERED", email, undefined, `certificate-test-mail:${item.certificateId}:${rendered.hash}`);
  return { delivered: true, event, recipientReference: email, attachmentHash: rendered.hash, transport: "test" };
}

export async function verifyCertificate(reference: string) {
  const item = await certificateRepo.getByVerificationReference(reference); if (!item) return null;
  return { valid: item.status === "ISSUED", status: item.status, certificateTitle: String(item.presentationSnapshot.certificateTitle || "Certificate"), issuer: item.issuerReference, program: String(item.presentationSnapshot.programName || item.canonicalProgramReference), issuedAt: item.issuedAt, certificateReference: item.certificateSerial, verificationReference: item.verificationReference };
}

export async function revokeIssuedCertificate(actor: CredentialActor, id: string, reason?: string) { assertPermission(actor, SHS_SECURITY_PERMISSIONS.CREDENTIAL_REVOKE); const item = await authorizedCertificate(actor, id); if (!item) throw new CredentialError("CERTIFICATE_NOT_FOUND", "Certificate not found.", 404); return certificateRepo.updateStatus(id, actor.organization_id, "REVOKED", actor.user_id, reason || "Revoked by authorized credential authority"); }

export async function replaceIssuedCertificate(actor: CredentialActor, id: string) {
  assertPermission(actor, SHS_SECURITY_PERMISSIONS.CREDENTIAL_ISSUE); const item = await authorizedCertificate(actor, id); if (!item) throw new CredentialError("CERTIFICATE_NOT_FOUND", "Certificate not found.", 404); if (item.status !== "ISSUED") throw new CredentialError("CERTIFICATE_NOT_REPLACEABLE", "Only an issued certificate can be replaced.", 409);
  const current = scope(actor); const replacement = await withTransaction(async (db: any) => { await db.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`certificate-replacement:${id}`]); const next = await certificateRepo.create({ ...item, certificateId: `certificate_${randomUUID()}`, verificationReference: `shs-cert-${randomUUID().replaceAll("-", "").slice(0, 20)}`, certificateSerial: `${item.profileKey.split(".").pop()}-${new Date().getUTCFullYear()}-${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`, issuedAt: new Date().toISOString(), supersedesCertificateId: item.certificateId, presentationSnapshot: { ...item.presentationSnapshot, issuedAt: new Date().toISOString() }, contentHash: item.contentHash }, db); await db.query("UPDATE issued_certificates SET status='REPLACED', replaced_by_certificate_id=$3, updated_at=NOW() WHERE certificate_id=$1 AND organization_id=$2", [id, current.organizationId, next.certificateId]); return next; }); return replacement;
}

export async function recordDelivery(actor: CredentialActor, id: string, channel: "DOWNLOAD" | "PRINT_ACTION" | "EMAIL", status: "REQUESTED" | "DELIVERED" | "FAILED", recipientReference?: string, failureReason?: string, providerMessageReference?: string) { const item = await authorizedCertificate(actor, id); if (!item) throw new CredentialError("CERTIFICATE_NOT_FOUND", "Certificate not found.", 404); return certificateRepo.addDeliveryEvent({ deliveryId: `certificate_delivery_${randomUUID()}`, certificateId: id, organizationId: item.organizationId, tenantId: item.tenantId, channel, recipientReference, requestedByUserId: actor.user_id, status, failureReason, providerMessageReference }); }

export async function learnerEmail(actor: CredentialActor, id: string) { const item = await authorizedCertificate(actor, id); if (!item) throw new CredentialError("CERTIFICATE_NOT_FOUND", "Certificate not found.", 404); const result = await query("SELECT email FROM users WHERE user_id=$1 AND organization_id=$2", [item.learnerUserId, item.organizationId]); return result.rows[0]?.email || null; }
